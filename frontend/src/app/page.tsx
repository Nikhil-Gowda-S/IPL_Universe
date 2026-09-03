"use client";
import Link from "next/link";
import { Suspense, lazy, useEffect, useState } from "react";

const StadiumScene = lazy(() => import("@/components/StadiumScene"));

interface Season { season: string; year: number; total_matches: number; champion: string; orange_cap: { player: string; runs: number }; purple_cap: { player: string; wickets: number }; }
interface Batter  { batter: string; total_runs: number; strike_rate: number; fours: number; sixes: number; matches: number; }
interface Bowler  { bowler: string; wickets: number; economy: number; matches: number; }

const TEAM_COLORS: Record<string, string> = {
  "Mumbai Indians"             : "#004ba0",
  "Chennai Super Kings"        : "#ffcc00",
  "Royal Challengers Bengaluru": "#c1272d",
  "Kolkata Knight Riders"      : "#3a225d",
  "Sunrisers Hyderabad"        : "#f7500e",
  "Delhi Capitals"             : "#00458c",
  "Punjab Kings"               : "#c41e3a",
  "Rajasthan Royals"           : "#e91e8c",
  "Gujarat Titans"             : "#1d4e89",
  "Lucknow Super Giants"       : "#0057a8",
  "Rising Pune Supergiant"     : "#8b1a4a",
  "Kochi Tuskers Kerala"       : "#9c27b0",
};

const getTeamColor = (team: string) => TEAM_COLORS[team] ?? "#ff6b00";

export default function HomePage() {
  const [seasons, setSeasons]   = useState<Season[]>([]);
  const [batters, setBatters]   = useState<Batter[]>([]);
  const [bowlers, setBowlers]   = useState<Bowler[]>([]);
  const [loading, setLoading]   = useState(true);
  const [clientMounted, setClientMounted] = useState(false);

  useEffect(() => { setClientMounted(true); }, []);

  useEffect(() => {
    Promise.all([
      fetch("/data/stats_seasons.json").then((r) => r.json()),
      fetch("/data/stats_batters.json").then((r) => r.json()),
      fetch("/data/stats_bowlers.json").then((r) => r.json()),
    ]).then(([s, b, bwl]) => {
      setSeasons(s.sort((a: Season, b: Season) => b.year - a.year));
      setBatters(b.sort((x: Batter, y: Batter) => y.total_runs - x.total_runs).slice(0, 10));
      setBowlers(bwl.sort((x: Bowler, y: Bowler) => y.wickets - x.wickets).slice(0, 10));
      setLoading(false);
    });
  }, []);

  const totalMatches = seasons.reduce((a, s) => a + s.total_matches, 0);
  const latestSeason = seasons[0];

  return (
    <div style={{ minHeight: "100vh", paddingTop: "64px" }}>
      {/* ── HERO SECTION ─────────────────────────────────────── */}
      <section
        id="hero"
        style={{
          position: "relative",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {/* 3D Stadium */}
        {clientMounted && (
          <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
            <Suspense fallback={null}>
              <StadiumScene />
            </Suspense>
          </div>
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to right, rgba(15,15,26,0.95) 40%, rgba(15,15,26,0.3) 100%)",
            zIndex: 1,
          }}
        />

        {/* Hero content */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: 700,
            padding: "0 2.5rem",
          }}
        >
          <div className="badge badge-orange anim-fade-in" style={{ marginBottom: "1.5rem", fontSize: "0.85rem" }}>
            🏆 SEASONS 2008 – 2024
          </div>
          <h1
            className="section-title anim-slide-left"
            style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)", marginBottom: "1rem" }}
          >
            <span className="text-fire">THE ULTIMATE</span>
            <br />
            <span style={{ color: "#fff" }}>IPL UNIVERSE</span>
          </h1>
          <p
            className="anim-slide-up"
            style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: "1.1rem",
              lineHeight: 1.7,
              marginBottom: "2rem",
              maxWidth: 520,
            }}
          >
            Explore {totalMatches.toLocaleString()}+ matches, predict match outcomes with
            AI, compare legends head-to-head, and dive into venue analytics with
            stunning 3D visuals.
          </p>
          <div className="anim-slide-up" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link href="/predictor">
              <button className="btn-fire" style={{ padding: "0.9rem 2rem", fontSize: "1rem" }}>
                🔮 WIN PREDICTOR
              </button>
            </Link>
            <Link href="/players">
              <button className="btn-ghost" style={{ padding: "0.9rem 2rem", fontSize: "1rem" }}>
                🏏 EXPLORE PLAYERS
              </button>
            </Link>
          </div>

          {/* Quick stats bar */}
          {!loading && (
            <div
              className="anim-fade-in"
              style={{
                display: "flex",
                gap: "2rem",
                marginTop: "3rem",
                flexWrap: "wrap",
              }}
            >
              {[
                { label: "MATCHES", value: totalMatches.toLocaleString() },
                { label: "SEASONS", value: seasons.length },
                { label: "LATEST CHAMP", value: latestSeason?.champion?.split(" ").slice(-1)[0] ?? "—" },
              ].map((s) => (
                <div key={s.label}>
                  <div
                    style={{
                      fontFamily: "'Bebas Neue', cursive",
                      fontSize: "1.8rem",
                      color: "#f5a623",
                      lineHeight: 1,
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: "0.75rem",
                      letterSpacing: "0.1em",
                      color: "rgba(255,255,255,0.4)",
                      marginTop: "0.25rem",
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── ALL-TIME STATS ────────────────────────────────────── */}
      <section id="alltime" style={{ padding: "5rem 2rem", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div className="badge badge-gold" style={{ marginBottom: "1rem" }}>🏆 ALL-TIME RECORDS</div>
          <h2 className="section-title">
            <span className="text-fire">LEGENDS OF</span> THE TOURNAMENT
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          {/* Top Batters */}
          <div className="glass" style={{ padding: "2rem", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "1.5rem" }}>🏏</span>
              <h3 className="font-rajdhani" style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "0.05em" }}>
                ALL-TIME RUN SCORERS
              </h3>
            </div>
            {loading ? (
              <div>{[...Array(5)].map((_, i) => <div key={i} className="shimmer" style={{ height: 40, marginBottom: 8 }} />)}</div>
            ) : (
              <table className="ipl-table" style={{ tableLayout: "fixed" }}>
                <thead>
                  <tr><th>#</th><th>BATTER</th><th>RUNS</th><th>SR</th><th>6s</th></tr>
                </thead>
                <tbody>
                  {batters.map((b, i) => (
                    <tr key={b.batter}>
                      <td>
                        <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.1rem", color: i < 3 ? "#f5a623" : "rgba(255,255,255,0.4)" }}>
                          {i + 1}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{b.batter}</td>
                      <td>
                        <span style={{ color: "#f5a623", fontWeight: 700, fontFamily: "'Bebas Neue', cursive", fontSize: "1.1rem" }}>
                          {b.total_runs.toLocaleString()}
                        </span>
                      </td>
                      <td style={{ color: "rgba(255,255,255,0.6)" }}>{b.strike_rate}</td>
                      <td style={{ color: "#ff6b00" }}>{b.sixes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Top Bowlers */}
          <div className="glass" style={{ padding: "2rem", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "1.5rem" }}>🎳</span>
              <h3 className="font-rajdhani" style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "0.05em" }}>
                ALL-TIME WICKET TAKERS
              </h3>
            </div>
            {loading ? (
              <div>{[...Array(5)].map((_, i) => <div key={i} className="shimmer" style={{ height: 40, marginBottom: 8 }} />)}</div>
            ) : (
              <table className="ipl-table" style={{ tableLayout: "fixed" }}>
                <thead>
                  <tr><th>#</th><th>BOWLER</th><th>WKTS</th><th>ECO</th><th>M</th></tr>
                </thead>
                <tbody>
                  {bowlers.map((b, i) => (
                    <tr key={b.bowler}>
                      <td>
                        <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.1rem", color: i < 3 ? "#f5a623" : "rgba(255,255,255,0.4)" }}>
                          {i + 1}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{b.bowler}</td>
                      <td>
                        <span style={{ color: "#e63946", fontWeight: 700, fontFamily: "'Bebas Neue', cursive", fontSize: "1.1rem" }}>
                          {b.wickets}
                        </span>
                      </td>
                      <td style={{ color: "rgba(255,255,255,0.6)" }}>{b.economy}</td>
                      <td style={{ color: "rgba(255,255,255,0.6)" }}>{b.matches}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      {/* ── SEASON CHAMPIONS TIMELINE ─────────────────────────── */}
      <section id="champions" style={{ padding: "4rem 2rem 6rem", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div className="badge badge-orange" style={{ marginBottom: "1rem" }}>📅 CHAMPIONS TIMELINE</div>
          <h2 className="section-title">
            <span className="text-fire">SEASON</span> BY SEASON
          </h2>
        </div>

        {loading ? (
          <div className="shimmer" style={{ height: 200, borderRadius: 16 }} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {seasons.map((s) => (
              <div
                key={s.season}
                className="stat-card card-hover"
                style={{
                  borderTop: `3px solid ${getTeamColor(s.champion)}`,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <span
                    style={{
                      fontFamily: "'Bebas Neue', cursive",
                      fontSize: "2.5rem",
                      color: "rgba(255,255,255,0.2)",
                      lineHeight: 1,
                    }}
                  >
                    {s.year}
                  </span>
                  <span className="badge" style={{ background: `${getTeamColor(s.champion)}22`, color: getTeamColor(s.champion) === "#ffcc00" ? "#b8860b" : getTeamColor(s.champion), border: `1px solid ${getTeamColor(s.champion)}44` }}>
                    🏆 CHAMPION
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.75rem" }}>
                  {s.champion}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div style={{ background: "rgba(245,166,35,0.08)", borderRadius: 8, padding: "0.5rem 0.75rem" }}>
                    <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", marginBottom: "0.2rem" }}>🟠 ORANGE CAP</div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#f5a623" }}>{s.orange_cap.player.split(" ").slice(-1)[0]}</div>
                    <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>{s.orange_cap.runs} runs</div>
                  </div>
                  <div style={{ background: "rgba(138,43,226,0.08)", borderRadius: 8, padding: "0.5rem 0.75rem" }}>
                    <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", marginBottom: "0.2rem" }}>🟣 PURPLE CAP</div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#b57bee" }}>{s.purple_cap.player.split(" ").slice(-1)[0]}</div>
                    <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>{s.purple_cap.wickets} wkts</div>
                  </div>
                </div>
                <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>
                  {s.total_matches} matches played
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── QUICK LINKS ───────────────────────────────────────── */}
      <section
        style={{
          background: "linear-gradient(135deg, rgba(255,107,0,0.08), rgba(245,166,35,0.04))",
          borderTop: "1px solid rgba(255,107,0,0.1)",
          padding: "5rem 2rem",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <h2 className="section-title" style={{ marginBottom: "3rem" }}>
            EXPLORE THE <span className="text-fire">UNIVERSE</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
            {[
              { href: "/predictor", icon: "🔮", title: "WIN PREDICTOR", desc: "Real-time ML predictions with XGBoost" },
              { href: "/players",   icon: "🏏", title: "PLAYER H2H",    desc: "Batter vs Bowler duel analytics" },
              { href: "/venues",    icon: "🏟️", title: "VENUE STATS",   desc: "Stadium characteristics & trends" },
              { href: "/history",   icon: "📅", title: "HISTORY",       desc: "Season-by-season leaderboards" },
            ].map((card) => (
              <Link key={card.href} href={card.href} style={{ textDecoration: "none" }}>
                <div className="glass card-hover gradient-border" style={{ padding: "2rem 1.5rem", textAlign: "center", height: "100%" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>{card.icon}</div>
                  <div
                    style={{
                      fontFamily: "'Bebas Neue', cursive",
                      fontSize: "1.3rem",
                      letterSpacing: "0.08em",
                      color: "#f5a623",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {card.title}
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{card.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
