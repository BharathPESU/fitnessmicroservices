import { useEffect, useRef, useState } from "react";
import { createTheme, GlobalStyles, Box } from "@mui/material";

// ---- Design tokens -------------------------------------------------------
// Deep teal = structure/trust, coral = action/energy. The near-black teal
// canvas is reserved for the sign-in hero so that moment keeps real
// atmosphere; every other page stays on the light paper/bg pair.
export const TOKENS = {
  canvas: "#06201B",
  canvasDeep: "#03110D",
  ink: "#152420",
  inkSoft: "#5B6E68",
  teal900: "#0B5045",
  teal600: "#0F6B5C",
  teal300: "#3E8B7E",
  coral: "#FF6B4A",
  coralSoft: "#FF7C5F",
  danger: "#C0392B",
  paper: "#FFFFFF",
  bg: "#F6F8F7",
};

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: TOKENS.teal600, dark: TOKENS.teal900, light: TOKENS.teal300 },
    secondary: { main: TOKENS.coral },
    background: { default: TOKENS.bg, paper: TOKENS.paper },
    text: { primary: TOKENS.ink, secondary: TOKENS.inkSoft },
  },
  typography: {
    fontFamily: '"Manrope", "Inter", "Segoe UI", sans-serif',
    h6: { fontWeight: 700, letterSpacing: "-0.02em" },
    button: { fontWeight: 600, textTransform: "none" },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          color: TOKENS.ink,
          boxShadow: "0 1px 0 rgba(15,107,92,0.08)",
        },
      },
    },
    MuiButton: { styleOverrides: { root: { borderRadius: 10, paddingInline: 18 } } },
    MuiPaper: { styleOverrides: { root: { border: "1px solid rgba(15,107,92,0.08)" } } },
  },
});

// ---- Global keyframes ----------------------------------------------------
// One registry for every animation used across pages, so nothing drifts
// out of sync and reduced-motion is honored everywhere at once.
export const AppGlobalStyles = () => (
  <GlobalStyles
    styles={{
      "@import":
        "url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap')",
      "@keyframes drawLine": { to: { strokeDashoffset: 0 } },
      "@keyframes waypointIn": {
        from: { opacity: 0, transform: "scale(0.4)" },
        to: { opacity: 1, transform: "scale(1)" },
      },
      "@keyframes ringPulse": {
        "0%, 100%": { opacity: 0.55, transform: "scale(1)" },
        "50%": { opacity: 1, transform: "scale(1.08)" },
      },
      "@keyframes softPulse": {
        "0%, 100%": { boxShadow: "0 0 0 0 rgba(15,107,92,0.25)" },
        "50%": { boxShadow: "0 0 0 8px rgba(15,107,92,0)" },
      },
      "@keyframes dotBounce": {
        "0%, 80%, 100%": { opacity: 0.25, transform: "translateY(0)" },
        "40%": { opacity: 1, transform: "translateY(-3px)" },
      },
      "@keyframes driftGlow": {
        "0%, 100%": { transform: "translate3d(-2%, -2%, 0) scale(1)" },
        "50%": { transform: "translate3d(2%, 2%, 0) scale(1.06)" },
      },
      "@keyframes riseIn": {
        from: { opacity: 0, transform: "translateY(14px)" },
        to: { opacity: 1, transform: "translateY(0)" },
      },
      "@keyframes countUp": {
        from: { opacity: 0, transform: "translateY(4px)" },
        to: { opacity: 1, transform: "translateY(0)" },
      },
      "@media (prefers-reduced-motion: reduce)": {
        "*": {
          animationDuration: "0.001ms !important",
          animationIterationCount: "1 !important",
          transitionDuration: "0.001ms !important",
        },
      },
    }}
  />
);

// ---- Signature motif: a route trace that reads as a heartbeat ----------
// Used at full size on the sign-in hero, and at a small, quiet scale as a
// section divider elsewhere — same mark, different volume, never repeated
// at full intensity outside the hero.
export const RouteTrace = ({ tone = "loud", height = 140 }) => {
  const stroke = tone === "loud" ? TOKENS.coral : `${TOKENS.teal600}66`;
  const glow = tone === "loud" ? "drop-shadow(0 0 6px rgba(255,107,74,0.55))" : "none";
  const showWaypoints = tone === "loud";

  return (
    <Box
      component="svg"
      viewBox="0 0 900 140"
      sx={{ width: "100%", maxWidth: tone === "loud" ? 640 : 360, height, display: "block" }}
      aria-hidden="true"
    >
      <path
        d="M0,90 C60,90 90,90 130,90 C160,90 170,20 190,20 C210,20 215,130 235,130 C250,130 255,60 275,60 C310,60 330,90 380,90 C480,90 520,90 620,90 C680,90 700,50 740,50 C780,50 800,90 900,90"
        fill="none"
        stroke={stroke}
        strokeWidth={tone === "loud" ? 3 : 2}
        strokeLinecap="round"
        pathLength="1"
        style={{
          strokeDasharray: 1,
          strokeDashoffset: 1,
          animation: "drawLine 1.7s cubic-bezier(0.65,0,0.35,1) 0.3s forwards",
          filter: glow,
        }}
      />
      {showWaypoints &&
        [
          { cx: 130, cy: 90, delay: "1.0s" },
          { cx: 235, cy: 130, delay: "1.5s" },
          { cx: 740, cy: 50, delay: "2.0s" },
        ].map((p, i) => (
          <circle
            key={i}
            cx={p.cx}
            cy={p.cy}
            r="6"
            fill={TOKENS.canvas}
            stroke={TOKENS.coral}
            strokeWidth="2.5"
            style={{
              opacity: 0,
              transformOrigin: `${p.cx}px ${p.cy}px`,
              animation: `waypointIn 0.5s cubic-bezier(0.34,1.56,0.64,1) ${p.delay} forwards`,
            }}
          />
        ))}
    </Box>
  );
};

// ---- Small hook for animated stat counters (overview strips) ------------
export const useCountUp = (target, duration = 700) => {
  const [value, setValue] = useState(0);
  const frame = useRef();

  useEffect(() => {
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);

  return value;
};