# IPL Universe

An interactive IPL analytics platform that combines all-time player data, batter-vs-bowler matchups, venue intelligence, an ML win predictor, and immersive Three.js visualizations.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![React](https://img.shields.io/badge/React-19-149eca?logo=react) ![Three.js](https://img.shields.io/badge/Three.js-3D-000000?logo=three.js) ![Python](https://img.shields.io/badge/Python-FastAPI-3776ab?logo=python)

## Highlights

- Explore IPL career statistics for the complete batting and bowling datasets.
- Fuzzy player search supports initial and full-name variants such as `A Raghuvanshi` and `Angkrish Raghuvanshi`.
- Compare batter-vs-bowler records with a graceful career-stat fallback for players who never faced each other.
- Inspect procedural 3D shot trajectories, boundary arcs, wicket impacts, and bowling-length zones.
- Experience an interactive golden IPL trophy and stadium scene with orbit controls, themed lighting, glowing wickets, and particles.
- Review venue scoring profiles, toss trends, hover tilt, and 360-degree stadium cards.
- Estimate second-innings win probability through a FastAPI-served ML model.

## Tech stack

| Area | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| 3D graphics | Three.js, OrbitControls, procedural geometries |
| Backend | FastAPI, Pydantic, Uvicorn |
| ML/data | scikit-learn/XGBoost model artifact, Pandas, NumPy |

## Run locally

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Predictor API (optional)

Use Python 3.10+ and install the backend dependencies used by `server.py`:

```bash
pip install fastapi uvicorn joblib numpy scikit-learn xgboost
python server.py
```

The API starts at [http://localhost:8000](http://localhost:8000). It provides `/health`, `/predict`, `/players/search`, and `/players/h2h`.

## Quality checks

```bash
cd frontend
npm run build
```

## Repository layout

```text
frontend/                 Next.js user interface and browser-ready stats
  src/app/                Routes: home, players, predictor, venues, history
  src/components/         Three.js scenes and reusable UI components
  public/data/            Curated IPL analytics JSON datasets
server.py                 FastAPI predictor and player-data endpoints
train_model.py            Win-prediction model training script
build_pipeline.py         Data preparation pipeline
ipl_win_predictor.pkl     Trained model artifact
```

## Resume-ready project summary

> Built an IPL analytics platform with Next.js, TypeScript, FastAPI, and Three.js. Implemented fuzzy player search across 700+ records, H2H analytics with career-stat fallbacks, procedural 3D visualizations, venue trend interactions, and an ML-powered win predictor.

## Data note

The repository ships compact aggregated JSON files required by the UI and the trained predictor artifact. Large, reproducible raw training datasets are intentionally excluded from version control.
