# 🏏 IPL Universe

### **The IPL, turned into an interactive data playground.**

> **What if you could explore IPL history, inspect player matchups, understand venues, and ask an ML model who is more likely to win — all from one place?**
>
> **You can.**

## 🚀 Try IPL Universe

### 👉 **[LIVE DEMO — Open IPL Universe](https://ipl-universe.vercel.app/)**

Explore the full experience in your browser — no setup required.

---

## 🔥 What can you do?

### 🤖 Predict the winner

Put the model into a real IPL situation and see what it thinks.

**For example:**

```text
CSK vs RCB
Target: 196
Score: 154/4
Overs: 17.2

→ CSK win probability: ML prediction
```

The predictor uses the current match state — target, score, overs and wickets — and derives features such as **runs required, balls remaining, wickets in hand, current run rate and required run rate** before passing them to the trained XGBoost model.

### 🧑‍💻 Explore IPL players

Search players by full name, partial name or initials and explore career batting and bowling statistics.

### ⚔️ Batter vs Bowler

Ever wondered what happens when a batter faces a particular bowler?

Pick a matchup such as **Virat Kohli vs Jasprit Bumrah** and explore their head-to-head record. When an exact matchup isn't available, IPL Universe falls back to career-level comparison data instead of leaving you with an empty result.

### 🏟️ Discover IPL venues

Explore IPL venues through scoring patterns, toss trends and interactive stadium cards.

### 🥇 Experience the 3D IPL world

This isn't just another statistics dashboard.

IPL Universe uses **Three.js** to turn cricket data into an interactive visual experience featuring:

- 🏆 3D IPL trophy
- 🏟️ Interactive stadium scene
- 🏏 Procedural batting-shot trajectories
- 💥 Boundary arcs and impact effects
- 🎯 Bowling-length zones
- ✨ Glowing wickets, particles and themed lighting
- 🖱️ Orbit / 360° interactions

---

## 🧠 The idea

Most cricket analytics tools answer **one** question at a time.

IPL Universe brings multiple sides of the IPL into one experience:

```text
                 🏏 IPL UNIVERSE
                        │
        ┌───────────────┼───────────────┐
        │               │               │
    👤 Players      ⚔️ Matchups     🏟️ Venues
        │               │               │
        └───────────────┼───────────────┘
                        │
                  🤖 ML Predictor
                        │
                   🏏 3D World
```

The goal isn't just to display numbers. It's to make IPL data **interactive, visual and fun to explore**.

---

## 🤖 Machine Learning — Win Predictor

The predictor uses a trained **XGBoost classification model** to estimate the probability of the batting team winning a second-innings situation.

### Features used

- Batting team
- Bowling team
- Venue
- Target score
- Runs remaining
- Balls remaining
- Wickets remaining
- Current run rate (CRR)
- Required run rate (RRR)

The model is served through a **FastAPI backend**, while the Next.js frontend provides the interactive interface.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| 🎨 Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| 🎮 3D | Three.js, OrbitControls, procedural geometries |
| ⚡ API | FastAPI, Pydantic |
| 🤖 ML | XGBoost + scikit-learn |
| 📊 Data | JSON datasets, Pandas, NumPy |
| ☁️ Deployment | Vercel |

---

## 🗂️ Project Structure

```text
IPL_Universe/
│
├── frontend/                  # Next.js application
│   ├── src/app/               # Home, players, predictor, venues, history
│   ├── src/components/        # Reusable UI + Three.js components
│   └── public/data/            # IPL analytics datasets
│
├── api/
│   └── index.py               # Vercel → FastAPI entry point
│
├── server.py                  # FastAPI backend
├── train_model.py             # ML model training
├── build_pipeline.py          # Data preparation pipeline
├── ipl_win_predictor.pkl      # Trained model artifact
├── requirements.txt            # Backend dependencies
└── vercel.json                 # Deployment configuration
```

---

## 💻 Run it locally

### 1. Clone the repository

```bash
git clone https://github.com/Nikhil-Gowda-S/IPL_Universe.git
cd IPL_Universe
```

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**.

### 3. Start the API

From the project root:

```bash
pip install -r requirements.txt
python server.py
```

The API runs locally on **http://localhost:8000**.

---

## 🧪 Build check

```bash
cd frontend
npm run build
```

---

## 💡 Why this project?

IPL has an enormous amount of data — matches, players, venues, matchups and moments — but raw statistics don't always make that data exciting.

IPL Universe was built to explore what happens when **sports analytics + machine learning + modern web development + 3D graphics** are combined into a single product.

---

## 👨‍💻 Built by Nikhil Gowda S

If you find the project interesting:

- ⭐ **Star the repository**
- 🍴 **Fork it and experiment**
- 🐛 Open an issue with ideas or improvements
- 🚀 Try the **[live demo](https://ipl-universe.vercel.app/)**

### ⭐ If you like it, give the repo a star!

---

## 📌 Resume-ready summary

> **IPL Universe** — Built an interactive IPL analytics platform using Next.js, TypeScript, FastAPI, Three.js and XGBoost, featuring player analytics, batter-vs-bowler H2H comparisons, venue intelligence, procedural 3D cricket visualizations, and an ML-powered second-innings win predictor.

---

## 📊 Data

The repository contains compact aggregated datasets used by the application and the trained predictor artifact. Large raw training datasets are intentionally excluded from version control.

---

<div align="center">

### 🏏 **Don't just look at IPL numbers. Explore the universe behind them.**

**[🚀 OPEN IPL UNIVERSE](https://ipl-universe.vercel.app/)**

</div>
