"use client";
import { useState, useEffect, lazy, Suspense } from "react";

const WinGauge = lazy(() => import("@/components/WinGauge"));

interface PredictRequest {
  batting_team: string;
  bowling_team: string;
  venue: string;
  target: number;
  current_score: number;
  overs_done: number;
  wickets_down: number;
}

interface PredictResponse {
  win_probability: number;
  lose_probability: number;
  runs_left: number;
  balls_left: number;
  wickets_left: number;
  crr: number;
  rrr: number;
  batting_team: string;
  bowling_team: string;
}

const API = "http://localhost:8000";

export default function PredictorPage() {
  const [teams,  setTeams]  = useState<string[]>([]);
  const [venues, setVenues] = useState<string[]>([]);
  const [form, setForm] = useState<PredictRequest>({
    batting_team: "",
    bowling_team: "",
    venue: "",
    target: 180,
    current_score: 80,
    overs_done: 10,
    wickets_down: 3,
  });
  const [result,   setResult]  = useState<PredictResponse | null>(null);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState<string | null>(null);
  const [history,  setHistory] = useState<Array<{ form: PredictRequest; result: PredictResponse }>>([]);
  const [apiReady, setApiReady] = useState<boolean | null>(null);

  // Load teams & venues from static JSON (fallback if API not running)
  useEffect(() => {
    fetch("/data/teams.json").then(r => r.json()).then(setTeams);
    fetch("/data/venues.json").then(r => r.json()).then(setVenues);
    // Check API health
    fetch(`${API}/health`, { signal: AbortSignal.timeout(3000) })
      .then(r => r.ok ? setApiReady(true) : setApiReady(false))
      .catch(() => setApiReady(false));
  }, []);

  const set = (k: keyof PredictRequest, v: string | number) =>
    setForm(f => ({ ...f, [k]: v }));

  const predict = async () => {
    if (!form.batting_team || !form.bowling_team || !form.venue) {
      setError("Please fill in all required fields."); return;
    }
    if (form.batting_team === form.bowling_team) {
      setError("Batting and bowling teams must be different."); return;
    }
    setError(null); setLoading(true);
    try {
      const res = await fetch(`${API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        const detail = await res.json();
        throw new Error(detail.detail ?? "Prediction failed");
      }
      const data: PredictResponse = await res.json();
      setResult(data);
      setHistory(h => [{ form: { ...form }, result: data }, ...h].slice(0, 5));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Prediction failed";
      setError(apiReady === false
        ? "⚠️ API server not running. Start it with: python server.py"
        : msg
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    color: "#fff",
    fontFamily: "Inter, sans-serif",
    fontSize: "0.95rem",
    padding: "0.75rem 1rem",
    width: "100%",
    outline: "none",
    transition: "border-color 0.3s, box-shadow 0.3s",
  };

  const labelStyle = {
    display: "block",
    fontSize: "0.75rem",
    letterSpacing: "0.1em",
    color: "rgba(255,255,255,0.4)",
    marginBottom: "0.4rem",
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
  };

  return (
    <div style={{ minHeight: "100vh", paddingTop: "64px" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(255,107,0,0.1), rgba(245,166,35,0.05))",
          borderBottom: "1px solid rgba(255,107,0,0.15)",
          padding: "3rem 2rem",
          textAlign: "center",
        }}
      >
        <div className="badge badge-orange" style={{ marginBottom: "1rem" }}>🔮 AI-POWERED</div>
        <h1 className="section-title">
          <span className="text-fire">WIN</span> PREDICTOR
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", marginTop: "0.75rem", fontSize: "1rem" }}>
          XGBoost ML model trained on 125K+ ball-by-ball 2nd innings deliveries (2008–2024)
        </p>
        {apiReady === false && (
          <div
            style={{
              marginTop: "1rem",
              display: "inline-block",
              background: "rgba(230,57,70,0.12)",
              border: "1px solid rgba(230,57,70,0.3)",
              borderRadius: 10,
              padding: "0.5rem 1.25rem",
              color: "#e63946",
              fontSize: "0.85rem",
              fontFamily: "'Rajdhani', sans-serif",
            }}
          >
            ⚠️ API offline — start with: <code style={{ color: "#f5a623" }}>python server.py</code>
          </div>
        )}
        {apiReady === true && (
          <div style={{ marginTop: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "#48bb78", fontSize: "0.85rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#48bb78", display: "inline-block", boxShadow: "0 0 6px #48bb78" }} />
            API connected
          </div>
        )}
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", alignItems: "start" }}>

          {/* ── INPUT FORM ───────────────────────────────────── */}
          <div className="glass" style={{ padding: "2.5rem" }}>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.5rem", letterSpacing: "0.05em", marginBottom: "2rem", color: "#f5a623" }}>
              MATCH STATE
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              {/* Batting Team */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>BATTING TEAM</label>
                <select
                  id="batting_team"
                  className="ipl-input"
                  value={form.batting_team}
                  onChange={e => set("batting_team", e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select batting team…</option>
                  {teams.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Bowling Team */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>BOWLING TEAM</label>
                <select
                  id="bowling_team"
                  className="ipl-input"
                  value={form.bowling_team}
                  onChange={e => set("bowling_team", e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select bowling team…</option>
                  {teams.filter(t => t !== form.batting_team).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Venue */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>VENUE</label>
                <select
                  id="venue"
                  className="ipl-input"
                  value={form.venue}
                  onChange={e => set("venue", e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select venue…</option>
                  {venues.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              {/* Target */}
              <div>
                <label style={labelStyle}>TARGET RUNS</label>
                <input id="target" type="number" min={1} max={500}
                  value={form.target} onChange={e => set("target", +e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Current Score */}
              <div>
                <label style={labelStyle}>CURRENT SCORE</label>
                <input id="current_score" type="number" min={0} max={500}
                  value={form.current_score} onChange={e => set("current_score", +e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Overs Done */}
              <div>
                <label style={labelStyle}>OVERS DONE (e.g. 12.3)</label>
                <input id="overs_done" type="number" min={0} max={20} step={0.1}
                  value={form.overs_done} onChange={e => set("overs_done", +e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Wickets Down */}
              <div>
                <label style={labelStyle}>WICKETS DOWN</label>
                <input id="wickets_down" type="number" min={0} max={10}
                  value={form.wickets_down} onChange={e => set("wickets_down", +e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {error && (
              <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "rgba(230,57,70,0.12)", border: "1px solid rgba(230,57,70,0.3)", borderRadius: 10, color: "#e63946", fontSize: "0.85rem" }}>
                {error}
              </div>
            )}

            <button
              id="predict-btn"
              className="btn-fire"
              onClick={predict}
              disabled={loading}
              style={{ width: "100%", padding: "1rem", marginTop: "1.5rem", fontSize: "1.05rem", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "⏳ PREDICTING…" : "🔮 PREDICT WIN PROBABILITY"}
            </button>
          </div>

          {/* ── RESULT PANEL ─────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {result ? (
              <>
                {/* Gauge */}
                <div className="glass glow-orange" style={{ padding: "2rem" }}>
                  <h3 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.3rem", textAlign: "center", marginBottom: "1.5rem", color: "#f5a623", letterSpacing: "0.05em" }}>
                    WIN PROBABILITY
                  </h3>
                  <Suspense fallback={<div className="shimmer" style={{ height: 220 }} />}>
                    <WinGauge
                      batWinProb={result.win_probability}
                      bowlWinProb={result.lose_probability}
                      batTeam={result.batting_team}
                      bowlTeam={result.bowling_team}
                    />
                  </Suspense>
                  {/* Probability bars */}
                  <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {[
                      { team: result.batting_team, prob: result.win_probability,  color: "#ff6b00" },
                      { team: result.bowling_team,  prob: result.lose_probability, color: "#1a78c2" },
                    ].map(({ team, prob, color }) => (
                      <div key={team}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem", fontSize: "0.85rem" }}>
                          <span style={{ fontWeight: 600 }}>{team}</span>
                          <span style={{ color, fontWeight: 700 }}>{(prob * 100).toFixed(1)}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${prob * 100}%`, background: color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Match Stats */}
                <div className="glass" style={{ padding: "1.75rem" }}>
                  <h3 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.2rem", marginBottom: "1.25rem", letterSpacing: "0.05em" }}>
                    MATCH SITUATION
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                    {[
                      { label: "RUNS LEFT", value: result.runs_left, color: "#e63946" },
                      { label: "BALLS LEFT", value: result.balls_left, color: "#f5a623" },
                      { label: "WICKETS LEFT", value: result.wickets_left, color: "#48bb78" },
                      { label: "CRR", value: result.crr.toFixed(2), color: "#63b3ed" },
                      { label: "RRR", value: result.rrr.toFixed(2), color: result.rrr > result.crr ? "#e63946" : "#48bb78" },
                      { label: "REQ/OVER", value: (result.rrr).toFixed(1), color: "#b57bee" },
                    ].map((s) => (
                      <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "0.75rem", textAlign: "center" }}>
                        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.5rem", color: s.color, lineHeight: 1 }}>{s.value}</div>
                        <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", marginTop: "0.25rem", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="glass" style={{ padding: "3rem", textAlign: "center", minHeight: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔮</div>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.5rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em" }}>
                  AWAITING PREDICTION
                </div>
                <p style={{ color: "rgba(255,255,255,0.3)", marginTop: "0.75rem", fontSize: "0.9rem" }}>
                  Fill in the match state and click Predict
                </p>
              </div>
            )}

            {/* History */}
            {history.length > 0 && (
              <div className="glass" style={{ padding: "1.5rem" }}>
                <h3 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1rem", marginBottom: "1rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>
                  RECENT PREDICTIONS
                </h3>
                {history.map((h, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: i < history.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", fontSize: "0.83rem" }}>
                    <span style={{ color: "rgba(255,255,255,0.6)" }}>
                      {h.form.batting_team.split(" ").slice(-1)[0]} vs {h.form.bowling_team.split(" ").slice(-1)[0]}
                    </span>
                    <span style={{ color: h.result.win_probability > 0.5 ? "#48bb78" : "#e63946", fontWeight: 700 }}>
                      {(h.result.win_probability * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .grid-2 { grid-template-columns: 1fr !important; }
        }
        select option { background: #1a1a2e; color: #fff; }
        input:focus, select:focus {
          border-color: #ff6b00 !important;
          box-shadow: 0 0 0 3px rgba(255,107,0,0.15) !important;
        }
      `}</style>
    </div>
  );
}
