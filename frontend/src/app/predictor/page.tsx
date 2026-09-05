"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const WinGauge = dynamic(() => import("@/components/WinGauge"), { ssr: false });

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

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function PredictorPage() {
  const [teams, setTeams] = useState<string[]>([]);
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
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ form: PredictRequest; result: PredictResponse }>>([]);
  const [apiReady, setApiReady] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/data/teams.json")
      .then(r => r.json())
      .then(setTeams)
      .catch(() => setError("Unable to load teams."));

    fetch("/data/venues.json")
      .then(r => r.json())
      .then(setVenues)
      .catch(() => setError("Unable to load venues."));

    fetch(`${API}/health`, { signal: AbortSignal.timeout(8000) })
      .then(r => setApiReady(r.ok))
      .catch(() => setApiReady(false));
  }, []);

  const set = (key: keyof PredictRequest, value: string | number) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const validateForm = (): string | null => {
    if (!form.batting_team || !form.bowling_team || !form.venue) {
      return "Please fill in all required fields.";
    }
    if (form.batting_team === form.bowling_team) {
      return "Batting and bowling teams must be different.";
    }
    if (!Number.isInteger(form.target) || form.target < 1 || form.target > 500) {
      return "Target must be between 1 and 500 runs.";
    }
    if (!Number.isInteger(form.current_score) || form.current_score < 0) {
      return "Current score cannot be negative.";
    }
    if (form.current_score >= form.target) {
      return "Current score must be less than the target for an ongoing chase.";
    }
    if (!Number.isFinite(form.overs_done) || form.overs_done < 0 || form.overs_done >= 20) {
      return "Overs completed must be between 0 and 19.5.";
    }
    const ballsPart = Math.round((form.overs_done - Math.trunc(form.overs_done)) * 10);
    if (ballsPart > 5 || Math.abs(form.overs_done - (Math.trunc(form.overs_done) + ballsPart / 10)) > 1e-6) {
      return "Overs must use cricket notation, e.g. 12.3 (maximum 19.5).";
    }
    if (!Number.isInteger(form.wickets_down) || form.wickets_down < 0 || form.wickets_down > 10) {
      return "Wickets down must be between 0 and 10.";
    }
    return null;
  };

  const predict = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        signal: AbortSignal.timeout(12000),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(typeof payload.detail === "string" ? payload.detail : "Prediction failed");
      }

      const data = payload as PredictResponse;
      setApiReady(true);
      setResult(data);
      setHistory(current => [{ form: { ...form }, result: data }, ...current].slice(0, 5));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Prediction failed";
      setError(message);
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
      <div style={{ background: "linear-gradient(135deg, rgba(255,107,0,0.1), rgba(245,166,35,0.05))", borderBottom: "1px solid rgba(255,107,0,0.15)", padding: "3rem 2rem", textAlign: "center" }}>
        <div className="badge badge-orange" style={{ marginBottom: "1rem" }}>🔮 AI-POWERED</div>
        <h1 className="section-title"><span className="text-fire">WIN</span> PREDICTOR</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", marginTop: "0.75rem", fontSize: "1rem" }}>
          XGBoost ML model trained on 125K+ ball-by-ball 2nd innings deliveries (2008–2024)
        </p>
        {apiReady === false && (
          <div style={{ marginTop: "1rem", display: "inline-block", background: "rgba(230,57,70,0.12)", border: "1px solid rgba(230,57,70,0.3)", borderRadius: 10, padding: "0.5rem 1.25rem", color: "#e63946", fontSize: "0.85rem", fontFamily: "'Rajdhani', sans-serif" }}>
            ⚠️ API health check unavailable — you can still try a prediction; validation/API errors will be shown below.
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
          <div className="glass" style={{ padding: "2.5rem" }}>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.5rem", letterSpacing: "0.05em", marginBottom: "2rem", color: "#f5a623" }}>MATCH STATE</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>BATTING TEAM</label><select value={form.batting_team} onChange={e => set("batting_team", e.target.value)} style={inputStyle}><option value="">Select batting team…</option>{teams.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>BOWLING TEAM</label><select value={form.bowling_team} onChange={e => set("bowling_team", e.target.value)} style={inputStyle}><option value="">Select bowling team…</option>{teams.filter(t => t !== form.batting_team).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>VENUE</label><select value={form.venue} onChange={e => set("venue", e.target.value)} style={inputStyle}><option value="">Select venue…</option>{venues.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
              <div><label style={labelStyle}>TARGET RUNS</label><input type="number" min={1} max={500} value={form.target} onChange={e => set("target", Number(e.target.value))} style={inputStyle} /></div>
              <div><label style={labelStyle}>CURRENT SCORE</label><input type="number" min={0} max={500} value={form.current_score} onChange={e => set("current_score", Number(e.target.value))} style={inputStyle} /></div>
              <div><label style={labelStyle}>OVERS DONE (e.g. 12.3)</label><input type="number" min={0} max={19.5} step={0.1} value={form.overs_done} onChange={e => set("overs_done", Number(e.target.value))} style={inputStyle} /></div>
              <div><label style={labelStyle}>WICKETS DOWN</label><input type="number" min={0} max={10} step={1} value={form.wickets_down} onChange={e => set("wickets_down", Number(e.target.value))} style={inputStyle} /></div>
            </div>

            {error && <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "rgba(230,57,70,0.12)", border: "1px solid rgba(230,57,70,0.3)", borderRadius: 10, color: "#e63946", fontSize: "0.85rem" }}>{error}</div>}

            <button className="btn-fire" onClick={predict} disabled={loading} style={{ width: "100%", padding: "1rem", marginTop: "1.5rem", fontSize: "1.05rem", opacity: loading ? 0.7 : 1 }}>
              {loading ? "⏳ PREDICTING…" : "🔮 PREDICT WIN PROBABILITY"}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {result ? (
              <>
                <div className="glass glow-orange" style={{ padding: "2rem" }}>
                  <h3 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.3rem", textAlign: "center", marginBottom: "1.5rem", color: "#f5a623" }}>WIN PROBABILITY</h3>
                  <WinGauge batWinProb={result.win_probability} bowlWinProb={result.lose_probability} batTeam={result.batting_team} bowlTeam={result.bowling_team} />
                  <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {[{ team: result.batting_team, prob: result.win_probability, color: "#ff6b00" }, { team: result.bowling_team, prob: result.lose_probability, color: "#1a78c2" }].map(({ team, prob, color }) => (
                      <div key={team}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem", fontSize: "0.85rem" }}><span style={{ fontWeight: 600 }}>{team}</span><span style={{ color, fontWeight: 700 }}>{(prob * 100).toFixed(1)}%</span></div><div className="progress-bar"><div className="progress-fill" style={{ width: `${prob * 100}%`, background: color }} /></div></div>
                    ))}
                  </div>
                </div>

                <div className="glass" style={{ padding: "1.75rem" }}>
                  <h3 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.2rem", marginBottom: "1.25rem" }}>MATCH SITUATION</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                    {[{ label: "RUNS LEFT", value: result.runs_left, color: "#e63946" }, { label: "BALLS LEFT", value: result.balls_left, color: "#f5a623" }, { label: "WICKETS LEFT", value: result.wickets_left, color: "#48bb78" }, { label: "CRR", value: result.crr.toFixed(2), color: "#63b3ed" }, { label: "RRR", value: result.rrr.toFixed(2), color: result.rrr > result.crr ? "#e63946" : "#48bb78" }, { label: "REQ/OVER", value: result.rrr.toFixed(1), color: "#b57bee" }].map(s => (
                      <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "0.75rem", textAlign: "center" }}><div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.5rem", color: s.color }}>{s.value}</div><div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", marginTop: "0.25rem" }}>{s.label}</div></div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="glass" style={{ padding: "3rem", textAlign: "center", minHeight: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}><div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔮</div><div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.8rem", color: "rgba(255,255,255,0.35)" }}>AWAITING PREDICTION</div><p style={{ color: "rgba(255,255,255,0.3)", marginTop: "0.75rem" }}>Fill in the match state and click Predict</p></div>
            )}

            {history.length > 0 && <div className="glass" style={{ padding: "1.5rem" }}><h3 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.1rem", marginBottom: "1rem", color: "#f5a623" }}>RECENT PREDICTIONS</h3>{history.map((h, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: ".65rem 0", borderBottom: i < history.length - 1 ? "1px solid rgba(255,255,255,.07)" : "none", fontSize: ".8rem" }}><span>{h.form.batting_team} vs {h.form.bowling_team}</span><b style={{ color: "#f5a623" }}>{(h.result.win_probability * 100).toFixed(1)}%</b></div>)}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
