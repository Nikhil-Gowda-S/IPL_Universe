"""
train_model.py  ─  Phase 2a: Train XGBoost Win Predictor
=========================================================
Reads inn2_tracking.parquet (output of build_pipeline.py) and trains an
XGBoost classifier that predicts 2nd-innings win probability from match state.
Saves model + label encoders to ipl_win_predictor.pkl
"""

import json
import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report
import xgboost as xgb

warnings.filterwarnings("ignore")

BASE = Path(__file__).parent

# ─────────────────────────────────────────────────────────────────────────────
# 1. LOAD TRAINING DATA
# ─────────────────────────────────────────────────────────────────────────────
print("Loading inn2_tracking.parquet ...")
df = pd.read_parquet(BASE / "inn2_tracking.parquet")
print(f"  Rows: {len(df):,}")

# Drop rows with missing target or winner
df = df.dropna(subset=["target","winner","batting_team","bowling_team","venue"])
df = df[df["target"] > 0].copy()

# ─────────────────────────────────────────────────────────────────────────────
# 2. FEATURE ENGINEERING
# ─────────────────────────────────────────────────────────────────────────────
FEATURES   = ["batting_team","bowling_team","venue","runs_left","balls_left",
              "wickets_left","target","crr","rrr"]
TARGET_COL = "is_winner"

# Label-encode categorical columns
le_team   = LabelEncoder()
le_bowl   = LabelEncoder()
le_venue  = LabelEncoder()

all_teams  = sorted(set(df["batting_team"]) | set(df["bowling_team"]))
all_venues = sorted(df["venue"].unique())

le_team.fit(all_teams)
le_bowl.fit(all_teams)
le_venue.fit(all_venues)

df["batting_team_enc"] = le_team.transform(df["batting_team"])
df["bowling_team_enc"] = le_bowl.transform(df["bowling_team"])
df["venue_enc"]        = le_venue.transform(df["venue"])

FEAT_COLS = ["batting_team_enc","bowling_team_enc","venue_enc",
             "runs_left","balls_left","wickets_left","target","crr","rrr"]

X = df[FEAT_COLS].values
y = df[TARGET_COL].values

# ─────────────────────────────────────────────────────────────────────────────
# 3. TRAIN / TEST SPLIT (by match_id to prevent leakage)
# ─────────────────────────────────────────────────────────────────────────────
unique_matches = df["match_id"].unique()
train_ids, test_ids = train_test_split(unique_matches, test_size=0.15, random_state=42)

train_mask = df["match_id"].isin(train_ids)
test_mask  = df["match_id"].isin(test_ids)

X_train, y_train = X[train_mask], y[train_mask]
X_test,  y_test  = X[test_mask],  y[test_mask]

print(f"  Train: {len(X_train):,} | Test: {len(X_test):,}")

# ─────────────────────────────────────────────────────────────────────────────
# 4. TRAIN XGBOOST
# ─────────────────────────────────────────────────────────────────────────────
print("Training XGBoost classifier ...")
model = xgb.XGBClassifier(
    n_estimators      = 300,
    max_depth         = 6,
    learning_rate     = 0.05,
    subsample         = 0.8,
    colsample_bytree  = 0.8,
    use_label_encoder = False,
    eval_metric       = "logloss",
    random_state      = 42,
    n_jobs            = -1,
)
model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=50,
)

# ─────────────────────────────────────────────────────────────────────────────
# 5. EVALUATE
# ─────────────────────────────────────────────────────────────────────────────
y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:,1]

acc = accuracy_score(y_test, y_pred)
auc = roc_auc_score(y_test, y_prob)
print(f"\n  Accuracy : {acc:.4f}")
print(f"  ROC-AUC  : {auc:.4f}")
print(classification_report(y_test, y_pred, target_names=["Lose","Win"]))

# ─────────────────────────────────────────────────────────────────────────────
# 6. SAVE MODEL + ENCODERS
# ─────────────────────────────────────────────────────────────────────────────
artifact = {
    "model"     : model,
    "le_team"   : le_team,
    "le_venue"  : le_venue,
    "feat_cols" : FEAT_COLS,
    "all_teams" : all_teams,
    "all_venues": all_venues,
    "metrics"   : {"accuracy": float(acc), "roc_auc": float(auc)},
}
save_path = BASE / "ipl_win_predictor.pkl"
joblib.dump(artifact, save_path)
print(f"\n  Saved model to: {save_path}  ({save_path.stat().st_size/1024:.1f} KB)")
print("Phase 2a complete!")
