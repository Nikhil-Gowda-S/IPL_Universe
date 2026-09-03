"""
build_pipeline.py  ─  Phase 1: IPL Data Pipeline
================================================
1. Standardise legacy team names in both CSVs.
2. Merge deliveries + matches on match_id == id.
3. Compute 2nd-innings target-tracking features.
4. Export pre-aggregated JSON files consumed by the frontend.
"""

import json
import warnings
from pathlib import Path

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────────────────────────────────────
# 0. PATHS
# ─────────────────────────────────────────────────────────────────────────────
BASE   = Path(__file__).parent
OUT    = BASE / "frontend" / "public" / "data"
OUT.mkdir(parents=True, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# 1. TEAM-NAME STANDARDISATION MAP
# ─────────────────────────────────────────────────────────────────────────────
TEAM_MAP = {
    "Delhi Daredevils"           : "Delhi Capitals",
    "Kings XI Punjab"            : "Punjab Kings",
    "Deccan Chargers"            : "Sunrisers Hyderabad",
    "Pune Warriors"              : "Rising Pune Supergiant",
    "Rising Pune Supergiants"    : "Rising Pune Supergiant",
    "Gujarat Lions"              : "Gujarat Titans",
    "Kochi Tuskers Kerala"       : "Kochi Tuskers Kerala",
    "Royal Challengers Bangalore": "Royal Challengers Bengaluru",
    "Sunrisers Hyderabad"        : "Sunrisers Hyderabad",
    "Chennai Super Kings"        : "Chennai Super Kings",
    "Mumbai Indians"             : "Mumbai Indians",
    "Kolkata Knight Riders"      : "Kolkata Knight Riders",
    "Rajasthan Royals"           : "Rajasthan Royals",
    "Lucknow Super Giants"       : "Lucknow Super Giants",
    "Gujarat Titans"             : "Gujarat Titans",
}

def standardise_teams(df, cols):
    for col in cols:
        if col in df.columns:
            df[col] = df[col].replace(TEAM_MAP)
    return df

# ─────────────────────────────────────────────────────────────────────────────
# 2. LOAD & CLEAN
# ─────────────────────────────────────────────────────────────────────────────
print("Loading CSVs ...")
matches    = pd.read_csv(BASE / "matches.csv")
deliveries = pd.read_csv(BASE / "deliveries.csv")

matches    = standardise_teams(matches,    ["team1","team2","toss_winner","winner"])
deliveries = standardise_teams(deliveries, ["batting_team","bowling_team"])

matches["season_year"] = matches["season"].str[:4].astype(int)

print(f"   matches   : {len(matches):,} rows")
print(f"   deliveries: {len(deliveries):,} rows")

# ─────────────────────────────────────────────────────────────────────────────
# 3. MERGE
# ─────────────────────────────────────────────────────────────────────────────
print("Merging ...")
merged = deliveries.merge(
    matches[["id","season","season_year","venue","toss_winner","toss_decision",
             "winner","target_runs","target_overs","result","result_margin","player_of_match"]],
    left_on="match_id", right_on="id", how="left"
)
merged.drop(columns=["id"], inplace=True)

# ─────────────────────────────────────────────────────────────────────────────
# 4. SECOND-INNINGS TARGET-TRACKING FEATURES
# ─────────────────────────────────────────────────────────────────────────────
print("Computing 2nd-innings tracking features ...")

inn2 = merged[merged["inning"] == 2].copy()
inn2 = inn2.sort_values(["match_id","over","ball"]).reset_index(drop=True)

inn2["current_score"] = inn2.groupby("match_id")["total_runs"].cumsum()
inn2["target"]        = inn2["target_runs"].fillna(0).astype(int)
inn2["runs_left"]     = (inn2["target"] - inn2["current_score"]).clip(lower=0)
inn2["balls_bowled"]  = inn2["over"] * 6 + inn2["ball"]
inn2["balls_left"]    = (120 - inn2["balls_bowled"]).clip(lower=0)

inn2["wickets_fallen"] = inn2.groupby("match_id")["is_wicket"].cumsum()
inn2["wickets_left"]   = (10 - inn2["wickets_fallen"]).clip(lower=0)

inn2["overs_bowled"] = inn2["balls_bowled"] / 6
inn2["crr"] = (inn2["current_score"] / inn2["overs_bowled"]).replace([np.inf, -np.inf], 0).fillna(0)
inn2["rrr"] = (inn2["runs_left"] / (inn2["balls_left"] / 6)).replace([np.inf, -np.inf], 36.0).fillna(36.0)
inn2["is_winner"] = (inn2["batting_team"] == inn2["winner"]).astype(int)

print(f"   2nd-innings deliveries: {len(inn2):,}")

merged.to_parquet(BASE / "merged_all.parquet", index=False)
inn2.to_parquet(BASE / "inn2_tracking.parquet", index=False)
print("   Saved merged_all.parquet & inn2_tracking.parquet")

# ─────────────────────────────────────────────────────────────────────────────
# 5. AGGREGATED STATS JSONs
# ─────────────────────────────────────────────────────────────────────────────

def jdump(obj, path):
    class NpEncoder(json.JSONEncoder):
        def default(self, o):
            if isinstance(o, (np.integer,)):  return int(o)
            if isinstance(o, (np.floating,)): return round(float(o), 4) if np.isfinite(o) else None
            if isinstance(o, np.ndarray):     return o.tolist()
            return super().default(o)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, cls=NpEncoder, ensure_ascii=False, separators=(",",":"))
    print(f"   OK  {Path(path).name}  ({Path(path).stat().st_size/1024:.1f} KB)")

# ── 5a. BATTER STATS ──────────────────────────────────────────────────────────
print("\nBuilding stats_batters.json ...")
d = merged.copy()
d["is_boundary_4"] = (d["batsman_runs"] == 4).astype(int)
d["is_boundary_6"] = (d["batsman_runs"] == 6).astype(int)

def phase(ov):
    if ov <= 5:  return "powerplay"
    if ov <= 14: return "middle"
    return "death"

d["phase"] = d["over"].apply(phase)

batter_agg = (
    d.groupby("batter")
     .agg(
         total_runs  = ("batsman_runs","sum"),
         balls_faced = ("batsman_runs","count"),
         fours       = ("is_boundary_4","sum"),
         sixes       = ("is_boundary_6","sum"),
         matches     = ("match_id","nunique"),
     )
     .reset_index()
)
batter_agg["strike_rate"] = (batter_agg["total_runs"] / batter_agg["balls_faced"] * 100).round(2)

phase_breakdown = (
    d.groupby(["batter","phase"])
     .agg(runs=("batsman_runs","sum"), balls=("batsman_runs","count"))
     .reset_index()
)
pb = phase_breakdown.pivot_table(index="batter", columns="phase",
                                  values=["runs","balls"], aggfunc="sum").fillna(0)
pb.columns = [f"{v}_{p}" for v,p in pb.columns]
pb = pb.reset_index()

batter_agg = batter_agg.merge(pb, on="batter", how="left")
batter_agg = batter_agg[batter_agg["balls_faced"] >= 30].copy()

jdump(batter_agg.to_dict(orient="records"), OUT / "stats_batters.json")

# ── 5b. BOWLER STATS ──────────────────────────────────────────────────────────
print("Building stats_bowlers.json ...")
d["is_dot"] = ((d["batsman_runs"] == 0) & (d["extras_type"].isna())).astype(int)

bowler_agg = (
    d.groupby("bowler")
     .agg(
         wickets       = ("is_wicket","sum"),
         runs_conceded = ("total_runs","sum"),
         balls_bowled  = ("total_runs","count"),
         dot_balls     = ("is_dot","sum"),
         matches       = ("match_id","nunique"),
     )
     .reset_index()
)
bowler_agg["overs"]   = (bowler_agg["balls_bowled"] / 6).round(2)
bowler_agg["economy"] = (bowler_agg["runs_conceded"] / bowler_agg["overs"]).replace([np.inf,-np.inf], np.nan).round(2)
bowler_agg["dot_pct"] = (bowler_agg["dot_balls"] / bowler_agg["balls_bowled"] * 100).round(2)
bowler_agg = bowler_agg[bowler_agg["balls_bowled"] >= 60].copy()

jdump(bowler_agg.to_dict(orient="records"), OUT / "stats_bowlers.json")

# ── 5c. HEAD-TO-HEAD ─────────────────────────────────────────────────────────
print("Building stats_h2h.json ...")
h2h = (
    d.groupby(["batter","bowler"])
     .agg(
         runs       = ("batsman_runs","sum"),
         balls      = ("batsman_runs","count"),
         dismissals = ("is_wicket","sum"),
     )
     .reset_index()
)
h2h["strike_rate"] = (h2h["runs"] / h2h["balls"] * 100).round(2)
h2h = h2h[h2h["balls"] >= 6].copy()

jdump(h2h.to_dict(orient="records"), OUT / "stats_h2h.json")

# ── 5d. VENUE STATS ──────────────────────────────────────────────────────────
print("Building stats_venues.json ...")
venue_matches = matches.groupby("venue").agg(
    total_matches  = ("id","count"),
    bat_first_wins = ("toss_decision", lambda x: ((x=="bat") & (matches.loc[x.index,"toss_winner"] == matches.loc[x.index,"winner"])).sum()),
    field_wins     = ("toss_decision", lambda x: ((x=="field") & (matches.loc[x.index,"toss_winner"] == matches.loc[x.index,"winner"])).sum()),
).reset_index()

inn1_scores = (
    merged[merged["inning"]==1]
    .groupby(["match_id","venue"])["total_runs"].sum().reset_index()
    .groupby("venue")["total_runs"].mean().round(1).reset_index()
    .rename(columns={"total_runs":"avg_1st_inn_score"})
)
venue_stats = venue_matches.merge(inn1_scores, on="venue", how="left")
venue_stats["bat_first_win_pct"] = (venue_stats["bat_first_wins"] / venue_stats["total_matches"] * 100).round(1)
venue_stats["field_win_pct"]     = (venue_stats["field_wins"]     / venue_stats["total_matches"] * 100).round(1)

jdump(venue_stats.to_dict(orient="records"), OUT / "stats_venues.json")

# ── 5e. SEASON STATS ─────────────────────────────────────────────────────────
print("Building stats_seasons.json ...")

seasons_out = []
for season_label, grp_m in matches.groupby("season"):
    year = int(season_label[:4])
    match_ids = grp_m["id"].tolist()
    d_season  = deliveries[deliveries["match_id"].isin(match_ids)]

    if len(d_season) > 0:
        orange_cap  = d_season.groupby("batter")["batsman_runs"].sum().idxmax()
        orange_runs = int(d_season.groupby("batter")["batsman_runs"].sum().max())
        purple_cap  = d_season.groupby("bowler")["is_wicket"].sum().idxmax()
        purple_wkts = int(d_season.groupby("bowler")["is_wicket"].sum().max())
    else:
        orange_cap = purple_cap = "N/A"
        orange_runs = purple_wkts = 0

    team_matches = {}
    for t, c in grp_m["team1"].value_counts().items():
        team_matches[t] = team_matches.get(t, 0) + int(c)
    for t, c in grp_m["team2"].value_counts().items():
        team_matches[t] = team_matches.get(t, 0) + int(c)

    champion = grp_m.sort_values("date").iloc[-1]["winner"] if not grp_m.empty else "N/A"

    seasons_out.append({
        "season"       : season_label,
        "year"         : year,
        "total_matches": int(len(grp_m)),
        "champion"     : champion,
        "orange_cap"   : {"player": orange_cap, "runs": orange_runs},
        "purple_cap"   : {"player": purple_cap, "wickets": purple_wkts},
        "team_matches" : team_matches,
    })

jdump(seasons_out, OUT / "stats_seasons.json")

# ─────────────────────────────────────────────────────────────────────────────
# 6. ALSO EXPORT TEAM & VENUE LISTS
# ─────────────────────────────────────────────────────────────────────────────
all_teams  = sorted(set(matches["team1"].dropna()) | set(matches["team2"].dropna()))
all_venues = sorted(matches["venue"].dropna().unique().tolist())
jdump(all_teams,  OUT / "teams.json")
jdump(all_venues, OUT / "venues.json")

print(f"\nPhase 1 Complete! All JSON files written to: {OUT}")
print("\nFiles generated:")
for f in sorted(OUT.iterdir()):
    print(f"  {f.name:35s}  {f.stat().st_size/1024:8.1f} KB")
