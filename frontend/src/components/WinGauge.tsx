"use client";
import { useEffect, useRef } from "react";

interface WinGaugeProps {
  batWinProb: number;    // 0-1
  bowlWinProb: number;   // 0-1
  batTeam: string;
  bowlTeam: string;
  animated?: boolean;
}

export default function WinGauge({ batWinProb, bowlWinProb, batTeam, bowlTeam, animated = true }: WinGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const progRef   = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width  = 420;
    const H = canvas.height = 220;
    const cx = W / 2, cy = H - 20;
    const R = 170;
    const startAngle = Math.PI;
    const endAngle   = 2 * Math.PI;

    const drawGauge = (progress: number) => {
      ctx.clearRect(0, 0, W, H);

      // Background arc
      ctx.beginPath();
      ctx.arc(cx, cy, R, startAngle, endAngle);
      ctx.lineWidth = 28;
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineCap = "round";
      ctx.stroke();

      // Bat team arc (left, orange)
      const batAngle = startAngle + batWinProb * progress * Math.PI;
      const grad1 = ctx.createLinearGradient(cx - R, cy, cx, cy);
      grad1.addColorStop(0, "#e63946");
      grad1.addColorStop(1, "#ff6b00");
      ctx.beginPath();
      ctx.arc(cx, cy, R, startAngle, batAngle);
      ctx.lineWidth = 28;
      ctx.strokeStyle = grad1;
      ctx.lineCap = "round";
      ctx.stroke();

      // Bowl team arc (right, blue)
      const bowlAngle = endAngle - bowlWinProb * progress * Math.PI;
      const grad2 = ctx.createLinearGradient(cx, cy, cx + R, cy);
      grad2.addColorStop(0, "#1a78c2");
      grad2.addColorStop(1, "#63b3ed");
      ctx.beginPath();
      ctx.arc(cx, cy, R, bowlAngle, endAngle);
      ctx.lineWidth = 28;
      ctx.strokeStyle = grad2;
      ctx.lineCap = "round";
      ctx.stroke();

      // Center text
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 36px 'Bebas Neue', cursive";
      ctx.fillText(`${Math.round(batWinProb * progress * 100)}%`, cx, cy - 14);
      ctx.font = "500 13px Inter";
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText("WIN PROB", cx, cy + 6);

      // Team labels
      ctx.font = "bold 14px 'Rajdhani', sans-serif";
      ctx.fillStyle = "#ff6b00";
      ctx.textAlign = "left";
      ctx.fillText(batTeam.split(" ").slice(-1)[0].toUpperCase(), 10, cy - 5);

      ctx.fillStyle = "#63b3ed";
      ctx.textAlign = "right";
      ctx.fillText(bowlTeam.split(" ").slice(-1)[0].toUpperCase(), W - 10, cy - 5);
    };

    if (animated) {
      progRef.current = 0;
      const step = () => {
        progRef.current = Math.min(progRef.current + 0.025, 1);
        drawGauge(progRef.current);
        if (progRef.current < 1) animRef.current = requestAnimationFrame(step);
      };
      animRef.current = requestAnimationFrame(step);
    } else {
      drawGauge(1);
    }

    return () => cancelAnimationFrame(animRef.current);
  }, [batWinProb, bowlWinProb, batTeam, bowlTeam, animated]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }}
    />
  );
}
