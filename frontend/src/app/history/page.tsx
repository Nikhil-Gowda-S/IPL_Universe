"use client";
import { useState, useEffect, useMemo } from "react";

interface Season {
  season: string; year: number; total_matches: number;
  champion: string;
  orange_cap: { player: string; runs: number };
  purple_cap: { player: string; wickets: number };
  team_matches: Record<string, number>;
}
interface Batter { batter: string; total_runs: number; balls_faced: number; strike_rate: number; fours: number; sixes: number; matches: number; }
interface Bowler { bowler: string; wickets: number; economy: number; runs_conceded: number; matches: number; overs: number; }

const TEAM_COLORS: Record<string, string> = {
  "Mumbai Indians": "#004ba0", "Chennai Super Kings": "#ffcc00",
  "Royal Challengers Bengaluru": "#c1272d", "Kolkata Knight Riders": "#3a225d",
  "Sunrisers Hyderabad": "#f7500e", "Delhi Capitals": "#00458c",
  "Punjab Kings": "#c41e3a", "Rajasthan Royals": "#e91e8c",
  "Gujarat Titans": "#1d4e89", "Lucknow Super Giants": "#0057a8",
};
const tc = (team: string) => TEAM_COLORS[team] ?? "#ff6b00";

export default function HistoryPage() {
  const [seasons,  setSeasons]  = useState<Season[]>([]);
  const [batters,  setBatters]  = useState<Batter[]>([]);
  const [bowlers,  setBowlers]  = useState<Bowler[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selSeason, setSelSeason] = useState<string | null>(null);
  const [tab,      setTab]      = useState<"timeline"|"leaderboard">("timeline");

  useEffect(() => {
    Promise.all([
      fetch("/data/stats_seasons.json").then(r => r.json()),
      fetch("/data/stats_batters.json").then(r => r.json()),
      fetch("/data/stats_bowlers.json").then(r => r.json()),
    ]).then(([s, b, bwl]) => {
      const sorted = s.sort((a: Season, b: Season) => b.year - a.year);
      setSeasons(sorted);
      setSelSeason(sorted[0]?.season ?? null);
      setBatters(b);
      setBowlers(bwl);
      setLoading(false);
    });
  }, []);

  const selectedSeason = seasons.find(s => s.season === selSeason);

  const champions = useMemo(() => {
    const counts: Record<string, number> = {};
    seasons.forEach(s => { if (s.champion) counts[s.champion] = (counts[s.champion] ?? 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [seasons]);

  const tabStyle = (active: boolean) => ({
    padding: "0.6rem 1.5rem", border: "none", borderRadius: 10, cursor: "pointer",
    fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.06em", fontSize: "0.9rem",
    transition: "all 0.3s ease",
    background: active ? "linear-gradient(135deg, #ff6b00, #f5a623)" : "rgba(255,255,255,0.05)",
    color: active ? "#fff" : "rgba(255,255,255,0.5)",
  });

  return (
    <div style={{ minHeight: "100vh", paddingTop: "64px" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, rgba(255,107,0,0.08), transparent)", borderBottom: "1px solid rgba(255,107,0,0.1)", padding: "3rem 2rem", textAlign: "center" }}>
        <div className="badge badge-orange" style={{ marginBottom: "1rem" }}>📅 2008 – 2024</div>
        <h1 className="section-title"><span className="text-fire">HISTORICAL</span> EXPLORER</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", marginTop: "0.75rem" }}>Season-by-season records, leaderboards &amp; champions</p>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2.5rem 2rem" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem" }}>
          <button onClick={() => setTab("timeline")} style={tabStyle(tab === "timeline")}>📅 SEASON TIMELINE</button>
          <button onClick={() => setTab("leaderboard")} style={tabStyle(tab === "leaderboard")}>🏆 ALL-TIME LEADERS</button>
        </div>

        {/* ── TIMELINE TAB ──────────────────────────────────── */}
        {tab === "timeline" && (
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "2rem" }}>
            {/* Season selector */}
            <div className="glass" style={{ padding: "1.5rem", height: "fit-content", position: "sticky", top: 80, maxHeight: "80vh", overflowY: "auto" }}>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1rem", letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)", marginBottom: "1rem" }}>SELECT SEASON</div>
              {loading
                ? [...Array(8)].map((_, i) => <div key={i} className="shimmer" style={{ height: 48, marginBottom: 8, borderRadius: 8 }} />)
                : seasons.map(s => (
                  <button
                    key={s.season}
                    onClick={() => setSelSeason(s.season)}
                    style={{
                      width: "100%", textAlign: "left", padding: "0.75rem 1rem", marginBottom: "0.4rem",
                      background: selSeason === s.season ? "rgba(255,107,0,0.15)" : "transparent",
                      border: selSeason === s.season ? "1px solid rgba(255,107,0,0.4)" : "1px solid transparent",
                      borderRadius: 10, cursor: "pointer", transition: "all 0.2s",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}
                  >
                    <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.2rem", color: selSeason === s.season ? "#ff6b00" : "rgba(255,255,255,0.7)" }}>{s.season}</span>
                    <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", fontFamily: "'Rajdhani', sans-serif" }}>
                      {s.champion?.split(" ").slice(-1)[0]}
                    </span>
                  </button>
                ))
              }
            </div>

            {/* Season Detail */}
            {selectedSeason && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Title */}
                <div>
                  <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "3rem", lineHeight: 1, color: "#fff" }}>{selectedSeason.season}</h2>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Rajdhani', sans-serif", marginTop: "0.25rem" }}>{selectedSeason.total_matches} matches played</div>
                </div>

                {/* Champion banner */}
                <div
                  className="gradient-border"
                  style={{
                    background: `linear-gradient(135deg, ${tc(selectedSeason.champion)}18, rgba(245,166,35,0.05))`,
                    border: `1px solid ${tc(selectedSeason.champion)}33`,
                    borderRadius: 16, padding: "1.75rem 2rem",
                    display: "flex", alignItems: "center", gap: "1.5rem",
                  }}
                >
                  <div style={{ fontSize: "3rem", lineHeight: 1 }}>🏆</div>
                  <div>
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: "0.3rem" }}>SEASON CHAMPION</div>
                    <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "2rem", color: tc(selectedSeason.champion) === "#ffcc00" ? "#f5a623" : tc(selectedSeason.champion), letterSpacing: "0.04em" }}>
                      {selectedSeason.champion}
                    </div>
                  </div>
                </div>

                {/* Cap winners */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                  {[
                    { title: "🟠 ORANGE CAP", sub: "Most Runs", name: selectedSeason.orange_cap.player, stat: `${selectedSeason.orange_cap.runs} runs`, color: "#f5a623" },
                    { title: "🟣 PURPLE CAP", sub: "Most Wickets", name: selectedSeason.purple_cap.player, stat: `${selectedSeason.purple_cap.wickets} wickets`, color: "#b57bee" },
                  ].map(cap => (
                    <div key={cap.title} className="glass" style={{ padding: "1.5rem", textAlign: "center" }}>
                      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", marginBottom: "0.5rem" }}>{cap.title}</div>
                      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.8rem", color: cap.color, lineHeight: 1.1 }}>{cap.name.split(" ").slice(-1)[0]}</div>
                      <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", marginTop: "0.25rem" }}>{cap.name}</div>
                      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.2rem", color: cap.color, marginTop: "0.5rem" }}>{cap.stat}</div>
                    </div>
                  ))}
                </div>

                {/* Team match counts */}
                <div className="glass" style={{ padding: "1.75rem" }}>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1rem", letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)", marginBottom: "1.25rem" }}>MATCHES PER TEAM</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {Object.entries(selectedSeason.team_matches)
                      .sort((a, b) => b[1] - a[1])
                      .map(([team, matches]) => (
                        <div key={team} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                          <div style={{ width: 180, fontSize: "0.85rem", fontWeight: 600, flexShrink: 0 }}>{team.split(" ").slice(-2).join(" ")}</div>
                          <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${(matches / Math.max(...Object.values(selectedSeason.team_matches))) * 100}%`, background: tc(team) === "#ffcc00" ? "#f5a623" : tc(team), borderRadius: 4, transition: "width 0.8s ease" }} />
                          </div>
                          <span style={{ minWidth: 28, fontSize: "0.8rem", fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>{matches}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── LEADERBOARD TAB ───────────────────────────────── */}
        {tab === "leaderboard" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2rem" }}>
            {/* All-time champions */}
            <div className="glass" style={{ padding: "1.75rem" }}>
              <h3 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.2rem", color: "#f5a623", marginBottom: "1.5rem", letterSpacing: "0.05em" }}>🏆 MOST TITLES</h3>
              {champions.map(([team, count], i) => (
                <div key={team} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.2rem", color: i < 3 ? "#f5a623" : "rgba(255,255,255,0.25)", width: 24 }}>{i+1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{team}</div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginTop: "0.3rem" }}>
                      <div style={{ height: "100%", width: `${(count / champions[0][1]) * 100}%`, background: tc(team) === "#ffcc00" ? "#f5a623" : tc(team), borderRadius: 2 }} />
                    </div>
                  </div>
                  <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.6rem", color: tc(team) === "#ffcc00" ? "#f5a623" : tc(team) }}>{count}</span>
                </div>
              ))}
            </div>

            {/* All-time run scorers */}
            <div className="glass" style={{ padding: "1.75rem" }}>
              <h3 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.2rem", color: "#ff6b00", marginBottom: "1.5rem", letterSpacing: "0.05em" }}>🏏 ALL-TIME RUN SCORERS</h3>
              {loading
                ? [...Array(10)].map((_, i) => <div key={i} className="shimmer" style={{ height: 36, marginBottom: 8 }} />)
                : batters.sort((a, b) => b.total_runs - a.total_runs).slice(0, 15).map((b, i) => (
                  <div key={b.batter} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.1rem", color: i < 3 ? "#f5a623" : "rgba(255,255,255,0.25)", width: 20 }}>{i+1}</span>
                    <span style={{ flex: 1, fontSize: "0.88rem", fontWeight: 600 }}>{b.batter}</span>
                    <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.2rem", color: "#f5a623" }}>{b.total_runs.toLocaleString()}</span>
                  </div>
                ))
              }
            </div>

            {/* All-time wicket takers */}
            <div className="glass" style={{ padding: "1.75rem" }}>
              <h3 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.2rem", color: "#e63946", marginBottom: "1.5rem", letterSpacing: "0.05em" }}>🎳 ALL-TIME WICKET TAKERS</h3>
              {loading
                ? [...Array(10)].map((_, i) => <div key={i} className="shimmer" style={{ height: 36, marginBottom: 8 }} />)
                : bowlers.sort((a, b) => b.wickets - a.wickets).slice(0, 15).map((b, i) => (
                  <div key={b.bowler} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.1rem", color: i < 3 ? "#f5a623" : "rgba(255,255,255,0.25)", width: 20 }}>{i+1}</span>
                    <span style={{ flex: 1, fontSize: "0.88rem", fontWeight: 600 }}>{b.bowler}</span>
                    <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.2rem", color: "#e63946" }}>{b.wickets}</span>
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
