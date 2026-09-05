"""
server.py  ─  FastAPI Win Predictor API
========================================
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
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator

BASE       = Path(__file__).parent
MODEL_PATH = BASE / "ipl_win_predictor.pkl"

# LOAD MODEL
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
    """Read a player/stat dataset only when a player endpoint needs it."""
    with (DATA_DIR / filename).open(encoding="utf-8") as file:
        return json.load(file)


def normalize_player_name(value):
    return "".join(character for character in value.lower() if character.isalnum() or character == " ").strip()


# APP
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


# REQUEST / RESPONSE SCHEMAS
class PredictRequest(BaseModel):
    batting_team : str
    bowling_team : str
    venue        : str
    target       : int
    current_score: int
    overs_done   : float
    wickets_down : int

    @validator("target")
    def target_range(cls, v):
        if not 1 <= v <= 500:
            raise ValueError("target must be between 1 and 500 runs")
        return v

    @validator("current_score")
    def score_range(cls, v, values):
        if v < 0:
            raise ValueError("current_score cannot be negative")
        target = values.get("target")
        if target is not None and v >= target:
            raise ValueError("current_score must be less than target while predicting an ongoing chase")
        return v

    @validator("overs_done")
    def overs_range(cls, v):
        if not 0 <= v < 20:
            raise ValueError("overs_done must be between 0 and 19.5")
        # Cricket notation uses the decimal part for balls, not a real decimal.
        # Valid values are 12.0, 12.1, ... 12.5; 12.6 and above are invalid.
        balls_part = round((v - int(v)) * 10)
        if balls_part > 5 or abs(v - (int(v) + balls_part / 10)) > 1e-6:
            raise ValueError("overs_done must use cricket notation, e.g. 12.3 (maximum 12.5)")
        return v

    @validator("wickets_down")
    def wkt_range(cls, v):
        if not 0 <= v <= 10:
            raise ValueError("wickets_down must be 0-10")
        return v


class PredictResponse(BaseModel):
    batting_team      : str
    bowling_team      : str
    win_probability   : float
    lose_probability  : float
    runs_left         : int
    balls_left        : int
    wickets_left      : int
    crr               : float
    rrr               : float


def safe_encode(encoder, value, field_name):
    if value not in encoder.classes_:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown {field_name}: '{value}'. "
                   f"Valid options: {list(encoder.classes_)}"
        )
    return int(encoder.transform([value])[0])


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
    batters = load_stat_file("stats_batters.json") if role in ("all", "batter") else []
    bowlers = load_stat_file("stats_bowlers.json") if role in ("all", "bowler") else []
    query = normalize_player_name(q)

    def matches(name):
        words = normalize_player_name(name).split()
        searchable = f"{' '.join(words)} {''.join(word[0] for word in words)} {words[-1] if words else ''}"
        return not query or query in searchable or all(token in searchable for token in query.split())

    response = {}
    if role in ("all", "batter"):
        response["batters"] = [player for player in batters if matches(player["batter"])]
    if role in ("all", "bowler"):
        response["bowlers"] = [player for player in bowlers if matches(player["bowler"])]
    return response


@app.get("/players/h2h")
def player_h2h(batter: str, bowler: str):
    """Return exact H2H, or career-comparison data when no official matchup exists."""
    batters = load_stat_file("stats_batters.json")
    bowlers = load_stat_file("stats_bowlers.json")
    h2h = load_stat_file("stats_h2h.json")
    bat = next((player for player in batters if normalize_player_name(player["batter"]) == normalize_player_name(batter)), None)
    bowl = next((player for player in bowlers if normalize_player_name(player["bowler"]) == normalize_player_name(bowler)), None)
    if not bat or not bowl:
        raise HTTPException(status_code=404, detail="Batter or bowler was not found in the IPL datasets")
    duel = next((entry for entry in h2h if normalize_player_name(entry["batter"]) == normalize_player_name(bat["batter"]) and normalize_player_name(entry["bowler"]) == normalize_player_name(bowl["bowler"])), None)
    return {"mode": "h2h" if duel else "career_comparison", "matchup": duel, "batter": bat, "bowler": bowl}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    complete_overs = int(req.overs_done)
    extra_balls    = round((req.overs_done - complete_overs) * 10)
    balls_bowled   = complete_overs * 6 + extra_balls

    runs_left    = req.target - req.current_score
    balls_left   = 120 - balls_bowled
    wickets_left = 10 - req.wickets_down
    overs_bowled = balls_bowled / 6 if balls_bowled > 0 else 0.001
    crr          = round(req.current_score / overs_bowled, 4)
    rrr          = round(runs_left / (balls_left / 6), 4) if balls_left > 0 else 36.0

    bat_enc   = safe_encode(le_team,  req.batting_team,  "batting_team")
    bowl_enc  = safe_encode(le_team,  req.bowling_team, "bowling_team")
    venue_enc = safe_encode(le_venue, req.venue,         "venue")

    X = np.array([[bat_enc, bowl_enc, venue_enc,
                   runs_left, balls_left, wickets_left,
                   req.target, crr, rrr]])

    win_prob  = float(model.predict_proba(X)[0, 1])
    lose_prob = 1.0 - win_prob

    return PredictResponse(
        batting_team     = req.batting_team,
        bowling_team     = req.bowling_team,
        win_probability  = round(win_prob, 4),
        lose_probability = round(lose_prob, 4),
        runs_left        = runs_left,
        balls_left       = balls_left,
        wickets_left     = wickets_left,
        crr              = round(crr, 2),
        rrr              = round(rrr, 2),
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
