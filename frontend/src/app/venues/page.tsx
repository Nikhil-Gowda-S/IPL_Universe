"use client";
import { useState, useEffect, useMemo } from "react";

interface Venue {
  venue: string;
  total_matches: number;
  bat_first_wins: number;
  field_wins: number;
  avg_1st_inn_score: number;
  bat_first_win_pct: number;
  field_win_pct: number;
}

const CITY_MAP: Record<string, string> = {
  "M Chinnaswamy Stadium": "Bengaluru",
  "Wankhede Stadium": "Mumbai",
  "Eden Gardens": "Kolkata",
  "Feroz Shah Kotla": "Delhi",
  "Arun Jaitley Stadium": "Delhi",
  "MA Chidambaram Stadium": "Chennai",
  "Rajiv Gandhi International Cricket Stadium": "Hyderabad",
  "Punjab Cricket Association Stadium, Mohali": "Chandigarh",
  "Sawai Mansingh Stadium": "Jaipur",
  "DY Patil Stadium": "Mumbai",
  "Narendra Modi Stadium": "Ahmedabad",
  "Brabourne Stadium": "Mumbai",
};

const getCity = (v: string) => {
  for (const [k, city] of Object.entries(CITY_MAP)) {
    if (v.includes(k.split(",")[0].split(" ").slice(0,2).join(" "))) return city;
  }
  return CITY_MAP[v] ?? "India";
};

const BarChart = ({ value, max, color }: { value: number; max: number; color: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
    <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: `${(value / max) * 100}%`, height: "100%", background: color, borderRadius: 4, transition: "width 1s ease" }} />
    </div>
    <span style={{ minWidth: 36, fontSize: "0.8rem", fontWeight: 700, color }}>{value.toFixed(0)}</span>
  </div>
);

export default function VenuesPage() {
  const [venues,  setVenues]  = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [sortBy,  setSortBy]  = useState("total_matches");
  const [selected,setSelected]= useState<Venue | null>(null);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [tilt, setTilt] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    fetch("/data/stats_venues.json").then(r => r.json()).then((v: Venue[]) => {
      setVenues(v.filter(x => x.total_matches >= 5));
      setLoading(false);
    });
  }, []);

  const sorted = useMemo(() =>
    venues
      .filter(v => v.venue.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (b as unknown as Record<string, number>)[sortBy] - (a as unknown as Record<string, number>)[sortBy])
  , [venues, search, sortBy]);

  const maxMatches = Math.max(...sorted.map(v => v.total_matches), 1);
  const maxScore   = Math.max(...sorted.map(v => v.avg_1st_inn_score ?? 0), 1);

  return (
    <div style={{ minHeight: "100vh", paddingTop: "64px" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, rgba(255,107,0,0.08), transparent)", borderBottom: "1px solid rgba(255,107,0,0.1)", padding: "3rem 2rem", textAlign: "center" }}>
        <div className="badge badge-orange" style={{ marginBottom: "1rem" }}>🏟️ VENUE ANALYTICS</div>
        <h1 className="section-title"><span className="text-fire">PITCH &amp; VENUE</span> ANALYTICS</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", marginTop: "0.75rem" }}>Batting vs bowling conditions across every IPL venue</p>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2.5rem 2rem" }}>
        {/* Controls */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
          <input
            placeholder="🔍 Search venue…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "#fff", fontFamily: "Inter, sans-serif", fontSize: "0.9rem", padding: "0.6rem 1rem", outline: "none", maxWidth: 280 }}
          />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "#fff", fontFamily: "Inter, sans-serif", fontSize: "0.9rem", padding: "0.6rem 1rem", outline: "none" }}
          >
            <option value="total_matches">Sort: Most Matches</option>
            <option value="avg_1st_inn_score">Sort: Highest Scores</option>
            <option value="bat_first_win_pct">Sort: Bat-First Friendly</option>
            <option value="field_win_pct">Sort: Field-First Friendly</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: "2rem" }}>
          {/* Venue Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem", alignContent: "start" }}>
            {loading
              ? [...Array(9)].map((_, i) => <div key={i} className="shimmer" style={{ height: 220, borderRadius: 16 }} />)
              : sorted.map(v => {
                const isBatFriendly = (v.bat_first_win_pct ?? 0) > 55;
                const isFieldFriendly = (v.field_win_pct ?? 0) > 55;
                return (
                  <div
                    key={v.venue}
                    className="stat-card card-hover"
                    onClick={() => setSelected(v === selected ? null : v)}
                    onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setTilt(t => ({ ...t, [v.venue]: { x: ((e.clientY - r.top) / r.height - .5) * -8, y: ((e.clientX - r.left) / r.width - .5) * 8 } })); }}
                    onMouseLeave={() => setTilt(t => ({ ...t, [v.venue]: { x: 0, y: 0 } }))}
                    style={{
                      cursor: "pointer",
                      borderColor: selected?.venue === v.venue ? "#ff6b00" : "var(--ipl-border)",
                      background: selected?.venue === v.venue ? "rgba(255,107,0,0.08)" : "var(--ipl-glass)",
                      transform: `perspective(900px) rotateX(${tilt[v.venue]?.x ?? 0}deg) rotateY(${tilt[v.venue]?.y ?? 0}deg)`,
                      transition: "transform .16s ease, background .25s ease",
                      transformStyle: "preserve-3d",
                    }}
                  >
                    <button onClick={(e) => { e.stopPropagation(); setFlipped(f => ({ ...f, [v.venue]: !f[v.venue] })); }} style={{ float: "right", border: "1px solid rgba(245,166,35,.45)", borderRadius: 7, background: "rgba(245,166,35,.1)", color: "#f5a623", cursor: "pointer", padding: ".25rem .5rem", fontSize: ".7rem" }}>↻ 360°</button>
                    {flipped[v.venue] ? <div style={{ minHeight: 175, display: "flex", flexDirection: "column", justifyContent: "center", gap: ".8rem" }}><b style={{ color: "#f5a623" }}>STADIUM 360° VIEW</b><div style={{ fontSize: "1.7rem" }}>🏟️</div><span style={{ color: "rgba(255,255,255,.65)" }}>Boundary profile: {Math.round(62 + (v.avg_1st_inn_score ?? 150) / 12)}m average</span><span style={{ color: "#63b3ed" }}>Field-first trend: {(v.field_win_pct ?? 0).toFixed(0)}%</span><span style={{ color: "#ff6b00" }}>Bat-first trend: {(v.bat_first_win_pct ?? 0).toFixed(0)}%</span></div> : <>
                    {/* Venue name */}
                    <div style={{ marginBottom: "0.75rem" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.3, marginBottom: "0.25rem" }}>{v.venue}</div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>{getCity(v.venue)}</div>
                    </div></>}

                    {/* Badge row */}
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                      <span className="badge badge-blue">{v.total_matches} matches</span>
                      {isBatFriendly && <span className="badge badge-orange">🏏 BAT FRIENDLY</span>}
                      {isFieldFriendly && <span className="badge badge-green">🎳 BOWL FRIENDLY</span>}
                    </div>

                    {/* Stats */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                      <div style={{ background: "rgba(245,166,35,0.06)", borderRadius: 8, padding: "0.6rem 0.75rem" }}>
                        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.4rem", color: "#f5a623", lineHeight: 1 }}>{(v.avg_1st_inn_score ?? 0).toFixed(0)}</div>
                        <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em", fontFamily: "'Rajdhani', sans-serif" }}>AVG 1ST INN</div>
                      </div>
                      <div style={{ background: "rgba(255,107,0,0.06)", borderRadius: 8, padding: "0.6rem 0.75rem" }}>
                        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.4rem", color: "#ff6b00", lineHeight: 1 }}>{(v.bat_first_win_pct ?? 0).toFixed(0)}%</div>
                        <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em", fontFamily: "'Rajdhani', sans-serif" }}>BAT FIRST WIN</div>
                      </div>
                    </div>

                    {/* Win % bars */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>
                        <span>Bat first wins</span><span style={{ color: "#ff6b00" }}>{v.bat_first_wins}</span>
                      </div>
                      <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${((v.bat_first_wins ?? 0) / v.total_matches) * 100}%`, background: "linear-gradient(90deg, #ff6b00, #f5a623)", borderRadius: 3 }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>
                        <span>Field first wins</span><span style={{ color: "#1a78c2" }}>{v.field_wins}</span>
                      </div>
                      <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${((v.field_wins ?? 0) / v.total_matches) * 100}%`, background: "linear-gradient(90deg, #1a78c2, #63b3ed)", borderRadius: 3 }} />
                      </div>
                    </div>
                  </div>
                );
              })
            }
          </div>

          {/* Detail Panel */}
          {selected && (
            <div style={{ position: "sticky", top: 80 }}>
              <div className="glass gradient-border glow-orange" style={{ padding: "2rem" }}>
                <button onClick={() => setSelected(null)} style={{ float: "right", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.3rem", color: "#f5a623", marginBottom: "0.25rem", letterSpacing: "0.04em" }}>VENUE DEEP DIVE</div>
                <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1.5rem", color: "rgba(255,255,255,0.8)" }}>{selected.venue}</div>

                {/* Score distribution visual */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, marginBottom: "0.75rem" }}>SCORING PROFILE</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.3rem" }}>
                        <span style={{ color: "rgba(255,255,255,0.5)" }}>Avg 1st innings</span>
                        <span style={{ color: "#f5a623", fontWeight: 700 }}>{(selected.avg_1st_inn_score ?? 0).toFixed(1)}</span>
                      </div>
                      <BarChart value={selected.avg_1st_inn_score ?? 0} max={maxScore} color="#f5a623" />
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.3rem" }}>
                        <span style={{ color: "rgba(255,255,255,0.5)" }}>Total matches</span>
                        <span style={{ color: "#63b3ed", fontWeight: 700 }}>{selected.total_matches}</span>
                      </div>
                      <BarChart value={selected.total_matches} max={maxMatches} color="#63b3ed" />
                    </div>
                  </div>
                </div>

                {/* Toss analysis */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, marginBottom: "0.75rem" }}>TOSS DECISION ANALYSIS</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    {[
                      { label: "BAT FIRST", wins: selected.bat_first_wins, pct: selected.bat_first_win_pct, color: "#ff6b00" },
                      { label: "FIELD FIRST", wins: selected.field_wins, pct: selected.field_win_pct, color: "#1a78c2" },
                    ].map(t => (
                      <div key={t.label} style={{ background: `rgba(${t.color === "#ff6b00" ? "255,107,0" : "26,120,194"},0.08)`, border: `1px solid ${t.color}33`, borderRadius: 10, padding: "1rem", textAlign: "center" }}>
                        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.8rem", color: t.color, lineHeight: 1 }}>{(t.pct ?? 0).toFixed(0)}%</div>
                        <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.07em", fontFamily: "'Rajdhani', sans-serif", marginTop: "0.25rem" }}>WIN RATE</div>
                        <div style={{ fontSize: "0.7rem", color: t.color, marginTop: "0.5rem", fontWeight: 600 }}>{t.label}</div>
                        <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", marginTop: "0.2rem" }}>{t.wins} wins</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verdict */}
                <div style={{ padding: "1rem", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, marginBottom: "0.5rem" }}>TOSS VERDICT</div>
                  <div style={{ color: (selected.bat_first_win_pct ?? 0) > (selected.field_win_pct ?? 0) ? "#ff6b00" : "#1a78c2", fontWeight: 700, fontSize: "0.9rem" }}>
                    {(selected.bat_first_win_pct ?? 0) > (selected.field_win_pct ?? 0)
                      ? `🏏 Choose to BAT FIRST at ${selected.venue.split(",")[0]}`
                      : `🎳 Choose to FIELD FIRST at ${selected.venue.split(",")[0]}`
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
