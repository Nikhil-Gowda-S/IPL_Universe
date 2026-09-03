"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/",          label: "HOME",      icon: "🏠" },
  { href: "/predictor", label: "PREDICTOR", icon: "🔮" },
  { href: "/players",   label: "PLAYERS",   icon: "🏏" },
  { href: "/venues",    label: "VENUES",    icon: "🏟️" },
  { href: "/history",   label: "HISTORY",   icon: "📅" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: "rgba(15,15,26,0.85)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: 38,
              height: 38,
              background: "linear-gradient(135deg, #ff6b00, #f5a623)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              boxShadow: "0 4px 16px rgba(255,107,0,0.4)",
            }}
          >
            🏏
          </div>
          <span
            style={{
              fontFamily: "'Bebas Neue', cursive",
              fontSize: "1.5rem",
              letterSpacing: "0.1em",
              background: "linear-gradient(135deg, #ff6b00, #f5a623)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            IPL UNIVERSE
          </span>
        </Link>

        {/* Desktop links */}
        <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }} className="hidden-mobile">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link ${pathname === l.href ? "active" : ""}`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/predictor">
            <button className="btn-fire" style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}>
              PREDICT NOW
            </button>
          </Link>
          {/* Hamburger */}
          <button
            onClick={() => setOpen(!open)}
            style={{
              display: "none",
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: "1.5rem",
              cursor: "pointer",
            }}
            className="hamburger"
            aria-label="Open menu"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          style={{
            background: "rgba(15,15,26,0.97)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: "1rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link ${pathname === l.href ? "active" : ""}`}
              onClick={() => setOpen(false)}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem" }}
            >
              <span>{l.icon}</span> {l.label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .hamburger { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
