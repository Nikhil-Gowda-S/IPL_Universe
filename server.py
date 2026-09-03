"""
server.py  ─  Phase 2b: FastAPI Win Predictor API
==================================================
Loads the trained XGBoost model and exposes:
  POST /predict       – win probability from current match state
  GET  /health        – health check
  GET  /teams         – list of valid team names
  GET  /venues        – list of valid venue names
"""

from pathlib import Path
import json
from typing import Optional

import joblib
import numpy as np
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator

BASE       = Path(__file__).parent
MODEL_PATH = BASE / "ipl_win_predictor.pkl"

# ─────────────────────────────────────────────────────────────────────────────
# LOAD MODEL
# ─────────────────────────────────────────────────────────────────────────────
if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Model not found at {MODEL_PATH}. "
        "Please run `python train_model.py` first."
    )

artifact   = joblib.load(MODEL_PATH)
model      = artifact["model"]
le_team    = artifact["le_team"]
le_venue   = artifact["le_venue"]
FEAT_COLS  = artifact["feat_cols"]
ALL_TEAMS  = artifact["all_teams"]
ALL_VENUES = artifact["all_venues"]
DATA_DIR   = BASE / "frontend" / "public" / "data"

def load_stat_file(filename):
    """Read the same complete dataset shipped to the client."""
    with (DATA_DIR / filename).open(encoding="utf-8") as file:
        return json.load(file)

BATTERS = load_stat_file("stats_batters.json")
BOWLERS = load_stat_file("stats_bowlers.json")
H2H     = load_stat_file("stats_h2h.json")

def normalize_player_name(value):
    return "".join(character for character in value.lower() if character.isalnum() or character == " ").strip()

# ─────────────────────────────────────────────────────────────────────────────
# APP
# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title       = "IPL Win Predictor API",
    description = "Real-time 2nd-innings win probability using XGBoost.",
    version     = "1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# REQUEST / RESPONSE SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    batting_team : str
    bowling_team : str
    venue        : str
    target       : int          # 1st-innings score + 1
    current_score: int          # runs scored so far in 2nd innings
    overs_done   : float        # e.g. 12.3  (12 complete overs + 3 balls)
    wickets_down : int          # wickets fallen (0-10)

    @validator("wickets_down")
    def wkt_range(cls, v):
        if not 0 <= v <= 10:
            raise ValueError("wickets_down must be 0-10")
        return v

class PredictResponse(BaseModel):
    batting_team      : str
    bowling_team      : str
    win_probability   : float    # probability that batting team wins
    lose_probability  : float
    runs_left         : int
    balls_left        : int
    wickets_left      : int
    crr               : float
    rrr               : float

# ─────────────────────────────────────────────────────────────────────────────
# HELPER
# ─────────────────────────────────────────────────────────────────────────────
def safe_encode(encoder, value, field_name):
    if value not in encoder.classes_:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown {field_name}: '{value}'. "
                   f"Valid options: {list(encoder.classes_)}"
        )
    return int(encoder.transform([value])[0])

# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "model": "XGBoost", "metrics": artifact.get("metrics", {})}

@app.get("/teams")
def get_teams():
    return {"teams": ALL_TEAMS}

@app.get("/venues")
def get_venues():
    return {"venues": ALL_VENUES}

@app.get("/players/search")
def search_players(q: str = "", role: str = "all"):
    """Full IPL player search with case-insensitive initial-name support."""
    query = normalize_player_name(q)
    def matches(name):
        words = normalize_player_name(name).split()
        searchable = f"{' '.join(words)} {''.join(word[0] for word in words)} {words[-1] if words else ''}"
        return not query or query in searchable or all(token in searchable for token in query.split())
    response = {}
    if role in ("all", "batter"):
        response["batters"] = [player for player in BATTERS if matches(player["batter"])]
    if role in ("all", "bowler"):
        response["bowlers"] = [player for player in BOWLERS if matches(player["bowler"])]
    return response

@app.get("/players/h2h")
def player_h2h(batter: str, bowler: str):
    """Return exact H2H, or career-comparison data when no official matchup exists."""
    bat = next((player for player in BATTERS if normalize_player_name(player["batter"]) == normalize_player_name(batter)), None)
    bowl = next((player for player in BOWLERS if normalize_player_name(player["bowler"]) == normalize_player_name(bowler)), None)
    if not bat or not bowl:
        raise HTTPException(status_code=404, detail="Batter or bowler was not found in the IPL datasets")
    duel = next((entry for entry in H2H if normalize_player_name(entry["batter"]) == normalize_player_name(bat["batter"]) and normalize_player_name(entry["bowler"]) == normalize_player_name(bowl["bowler"])), None)
    return {"mode": "h2h" if duel else "career_comparison", "matchup": duel, "batter": bat, "bowler": bowl}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    # Convert overs_done (e.g. 12.3) to balls bowled
    complete_overs = int(req.overs_done)
    extra_balls    = round((req.overs_done - complete_overs) * 10)  # 12.3 -> 3 balls
    balls_bowled   = complete_overs * 6 + extra_balls

    # Derived features
    runs_left    = max(req.target - req.current_score, 0)
    balls_left   = max(120 - balls_bowled, 0)
    wickets_left = max(10 - req.wickets_down, 0)
    overs_bowled = balls_bowled / 6 if balls_bowled > 0 else 0.001
    crr          = round(req.current_score / overs_bowled, 4)
    rrr          = round(runs_left / (balls_left / 6), 4) if balls_left > 0 else 36.0

    # Encode categoricals
    bat_enc   = safe_encode(le_team,  req.batting_team,  "batting_team")
    bowl_enc  = safe_encode(le_team,  req.bowling_team,  "bowling_team")
    venue_enc = safe_encode(le_venue, req.venue,         "venue")

    X = np.array([[bat_enc, bowl_enc, venue_enc,
                   runs_left, balls_left, wickets_left,
                   req.target, crr, rrr]])

    win_prob  = float(model.predict_proba(X)[0, 1])
    lose_prob = 1.0 - win_prob

    return PredictResponse(
        batting_team    = req.batting_team,
        bowling_team    = req.bowling_team,
        win_probability = round(win_prob, 4),
        lose_probability= round(lose_prob, 4),
        runs_left       = runs_left,
        balls_left      = balls_left,
        wickets_left    = wickets_left,
        crr             = round(crr, 2),
        rrr             = round(rrr, 2),
    )

# ─────────────────────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
