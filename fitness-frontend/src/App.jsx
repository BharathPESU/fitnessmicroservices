import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "react-oauth2-code-pkce";
import { useDispatch } from "react-redux";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  Link as RouterLink,
} from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  Container,
  Typography,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Avatar,
  Stack,
  Chip,
  GlobalStyles,
  Fade,
  Grow,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import ActivityOutlinedIcon from "@mui/icons-material/DirectionsRunOutlined";
import LogoutIcon from "@mui/icons-material/LogoutOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import DirectionsRunRoundedIcon from "@mui/icons-material/DirectionsRunRounded";
import DirectionsWalkRoundedIcon from "@mui/icons-material/DirectionsWalkRounded";
import DirectionsBikeRoundedIcon from "@mui/icons-material/DirectionsBikeRounded";
import FitnessCenterRoundedIcon from "@mui/icons-material/FitnessCenterRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import TerrainRoundedIcon from "@mui/icons-material/TerrainRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import WbSunnyRoundedIcon from "@mui/icons-material/WbSunnyRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import PlayCircleFilledRoundedIcon from "@mui/icons-material/PlayCircleFilledRounded";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";

import { logout, setCredentials } from "./store/authSlice";

import ActvityForm from "./components/ActvityForm";
import ActivityList from "./components/ActivityList";
import ActivityDetail from "./components/ActivityDetail";
import UserProfileMenu from "./components/UserProfileMenu";

// ---- Design Tokens -----------------------------------------------------
const TOKENS = {
  canvas: "#041613",
  canvasDeep: "#020D0B",
  surfaceDark: "#082520",
  surfaceCard: "rgba(9, 36, 31, 0.75)",
  borderDark: "rgba(16, 185, 129, 0.18)",
  ink: "#0F201B",
  inkSoft: "#536A63",
  teal900: "#064E3B",
  teal600: "#0D9488",
  teal400: "#14B8A6",
  teal300: "#2DD4BF",
  tealNeon: "#00F5D4",
  coral: "#FF5E3A",
  coralBright: "#FF785A",
  coralGlow: "rgba(255, 94, 58, 0.4)",
  gold: "#F59E0B",
  cyan: "#06B6D4",
  paper: "#FFFFFF",
  bg: "#F4F7F5",
};

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: TOKENS.teal600,
      dark: TOKENS.teal900,
      light: TOKENS.teal300,
    },
    secondary: { main: TOKENS.coral },
    background: { default: TOKENS.bg, paper: TOKENS.paper },
    text: { primary: TOKENS.ink, secondary: TOKENS.inkSoft },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Manrope", "Inter", sans-serif',
    h3: { fontWeight: 800, letterSpacing: "-0.035em" },
    h5: { fontWeight: 800, letterSpacing: "-0.02em" },
    h6: { fontWeight: 700, letterSpacing: "-0.02em" },
    button: { fontWeight: 700, textTransform: "none" },
  },
  shape: { borderRadius: 18 },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          color: TOKENS.ink,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 22,
          fontWeight: 700,
        },
      },
    },
  },
});

// ---- Global Styles & Animation Keyframes -------------------------------
const globalStyles = (
  <GlobalStyles
    styles={{
      "@import":
        "url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap')",
      "@keyframes drawLine": {
        to: { strokeDashoffset: 0 },
      },
      "@keyframes tracerGlide": {
        "0%": { offsetDistance: "0%" },
        "100%": { offsetDistance: "100%" },
      },
      "@keyframes beaconPulse": {
        "0%, 100%": { transform: "scale(1)", opacity: 0.8 },
        "50%": { transform: "scale(1.4)", opacity: 0.2 },
      },
      "@keyframes pulseGlow": {
        "0%, 100%": { opacity: 0.45, transform: "scale(1)" },
        "50%": { opacity: 0.9, transform: "scale(1.1)" },
      },
      "@keyframes auroraShift": {
        "0%": { transform: "translate3d(0%, 0%, 0) rotate(0deg)" },
        "50%": { transform: "translate3d(4%, 3%, 0) rotate(180deg)" },
        "100%": { transform: "translate3d(0%, 0%, 0) rotate(360deg)" },
      },
      "@keyframes floatBadge": {
        "0%, 100%": { transform: "translateY(0px)" },
        "50%": { transform: "translateY(-6px)" },
      },
      "@keyframes shimmerBar": {
        "0%": { backgroundPosition: "-200% 0" },
        "100%": { backgroundPosition: "200% 0" },
      },
      ".font-mono": {
        fontFamily: '"JetBrains Mono", monospace',
      },
    }}
  />
);

// ---- High-Impact Signature SVG Route & Heartbeat Telemetry --------------
const InteractiveTelemetryTrace = () => {
  const [activeNode, setActiveNode] = useState(1);

  const waypoints = [
    { id: 0, cx: 120, cy: 90, km: "1.2 km", pace: "4:32/km", bpm: 148, elev: "+18m" },
    { id: 1, cx: 275, cy: 35, km: "3.8 km", pace: "4:15/km", bpm: 168, elev: "+64m (Peak)" },
    { id: 2, cx: 470, cy: 110, km: "6.4 km", pace: "4:48/km", bpm: 154, elev: "+32m" },
    { id: 3, cx: 720, cy: 55, km: "9.1 km", pace: "4:08/km", bpm: 174, elev: "+48m (Sprint)" },
  ];

  return (
    <Box sx={{ position: "relative", width: "100%", maxWidth: 720, mx: "auto", my: 2 }}>
      {/* Dynamic Metric HUD Pill */}
      <Box
        sx={{
          position: "absolute",
          top: -24,
          right: { xs: 0, sm: 20 },
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          bgcolor: "rgba(4, 22, 19, 0.9)",
          border: `1px solid ${TOKENS.borderDark}`,
          backdropFilter: "blur(12px)",
          borderRadius: 4,
          py: 0.8,
          px: 1.8,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          zIndex: 4,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
            <TerrainRoundedIcon sx={{ fontSize: 16, color: TOKENS.tealNeon }} />
            <Typography variant="caption" sx={{ color: "#E2E8F0", fontWeight: 700 }} className="font-mono">
              {waypoints[activeNode].elev}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
            <FavoriteRoundedIcon sx={{ fontSize: 16, color: TOKENS.coral }} />
            <Typography variant="caption" sx={{ color: "#E2E8F0", fontWeight: 700 }} className="font-mono">
              {waypoints[activeNode].bpm} bpm
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
            <SpeedRoundedIcon sx={{ fontSize: 16, color: TOKENS.teal300 }} />
            <Typography variant="caption" sx={{ color: "#E2E8F0", fontWeight: 700 }} className="font-mono">
              {waypoints[activeNode].pace}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box
        component="svg"
        viewBox="0 0 850 160"
        sx={{ width: "100%", height: "auto", overflow: "visible", filter: "drop-shadow(0 14px 28px rgba(0,0,0,0.6))" }}
      >
        <defs>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={TOKENS.tealNeon} />
            <stop offset="40%" stopColor={TOKENS.teal300} />
            <stop offset="75%" stopColor={TOKENS.coral} />
            <stop offset="100%" stopColor="#FF8C42" />
          </linearGradient>

          <linearGradient id="areaGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={TOKENS.coral} stopOpacity="0.25" />
            <stop offset="50%" stopColor={TOKENS.teal600} stopOpacity="0.08" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid Background lines */}
        {[30, 75, 120].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="850"
            y2={y}
            stroke="rgba(45, 212, 191, 0.08)"
            strokeDasharray="4 6"
            strokeWidth="1"
          />
        ))}

        {/* Area under curve */}
        <path
          d="M 0 150 L 0 100 C 60 100, 90 90, 120 90 C 180 90, 210 35, 275 35 C 340 35, 410 110, 470 110 C 530 110, 580 80, 640 80 C 680 80, 700 55, 720 55 C 760 55, 800 100, 850 100 L 850 150 Z"
          fill="url(#areaGlow)"
        />

        {/* Main Route Line */}
        <path
          id="mainRoutePath"
          d="M 0 100 C 60 100, 90 90, 120 90 C 180 90, 210 35, 275 35 C 340 35, 410 110, 470 110 C 530 110, 580 80, 640 80 C 680 80, 700 55, 720 55 C 760 55, 800 100, 850 100"
          fill="none"
          stroke="url(#routeGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          filter="url(#glow)"
          pathLength="1"
          style={{
            strokeDasharray: 1,
            strokeDashoffset: 1,
            animation: "drawLine 2s cubic-bezier(0.65,0,0.35,1) 0.3s forwards",
          }}
        />

        {/* Interactive Waypoints */}
        {waypoints.map((wp) => {
          const isSelected = activeNode === wp.id;
          return (
            <g
              key={wp.id}
              onClick={() => setActiveNode(wp.id)}
              style={{ cursor: "pointer" }}
            >
              {/* Radar pulse around selected node */}
              {isSelected && (
                <circle
                  cx={wp.cx}
                  cy={wp.cy}
                  r="16"
                  fill="none"
                  stroke={TOKENS.coral}
                  strokeWidth="1.5"
                  style={{
                    animation: "beaconPulse 1.8s ease-out infinite",
                    transformOrigin: `${wp.cx}px ${wp.cy}px`,
                  }}
                />
              )}
              <circle
                cx={wp.cx}
                cy={wp.cy}
                r={isSelected ? "7" : "5"}
                fill={isSelected ? TOKENS.coral : TOKENS.canvas}
                stroke={isSelected ? "#FFF" : TOKENS.tealNeon}
                strokeWidth={isSelected ? "3" : "2"}
                style={{ transition: "all 0.2s ease" }}
              />
              <text
                x={wp.cx}
                y={wp.cy + 22}
                textAnchor="middle"
                fill="rgba(246,248,247,0.7)"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="600"
              >
                {wp.km}
              </text>
            </g>
          );
        })}
      </Box>
    </Box>
  );
};

// ---- Radial Progress & Biometric Ring Widget ----------------------------
const BiometricRingsCard = () => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
      gap: 2,
      mt: 3,
      width: "100%",
    }}
  >
    {[
      { label: "Weekly Mileage", val: "42.8", unit: "km", target: "50 km", pct: 85, color: TOKENS.tealNeon, icon: DirectionsRunRoundedIcon },
      { label: "Active Calories", val: "3,840", unit: "kcal", target: "4,000", pct: 96, color: TOKENS.coral, icon: LocalFireDepartmentRoundedIcon },
      { label: "Vo2 Max Index", val: "54.2", unit: "Superior", target: "Top 5%", pct: 92, color: TOKENS.gold, icon: BoltRoundedIcon },
    ].map((item, idx) => (
      <Box
        key={idx}
        sx={{
          p: 2.2,
          borderRadius: 3,
          bgcolor: "rgba(6, 32, 27, 0.7)",
          border: `1px solid ${TOKENS.borderDark}`,
          backdropFilter: "blur(14px)",
          position: "relative",
          overflow: "hidden",
          transition: "transform 0.2s ease, border-color 0.2s ease",
          "&:hover": {
            transform: "translateY(-3px)",
            borderColor: item.color,
          },
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="caption" sx={{ color: "rgba(246,248,247,0.6)", fontWeight: 600 }}>
              {item.label}
            </Typography>
            <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mt: 0.5 }}>
              <Typography variant="h6" sx={{ color: "#FFF", fontWeight: 800 }} className="font-mono">
                {item.val}
              </Typography>
              <Typography variant="caption" sx={{ color: item.color, fontWeight: 700 }}>
                {item.unit}
              </Typography>
            </Stack>
          </Box>
          <Avatar sx={{ bgcolor: `${item.color}22`, color: item.color, width: 34, height: 34 }}>
            <item.icon sx={{ fontSize: 18 }} />
          </Avatar>
        </Stack>

        <Box sx={{ mt: 2 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: "rgba(246,248,247,0.45)", fontSize: "0.7rem" }}>
              Goal: {item.target}
            </Typography>
            <Typography variant="caption" sx={{ color: item.color, fontWeight: 700, fontSize: "0.7rem" }}>
              {item.pct}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={item.pct}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: "rgba(255,255,255,0.08)",
              "& .MuiLinearProgress-bar": {
                bgcolor: item.color,
                borderRadius: 3,
              },
            }}
          />
        </Box>
      </Box>
    ))}
  </Box>
);

// ---- Spectacular Sign-in Hero -------------------------------------------
const WelcomeHero = ({ onLogin }) => {
  const [selectedSport, setSelectedSport] = useState("Running");

  const sports = [
    { label: "Running", icon: DirectionsRunRoundedIcon, stat: "5:12 min/km avg" },
    { label: "Cycling", icon: DirectionsBikeRoundedIcon, stat: "28.4 km/h pace" },
    { label: "Walking", icon: DirectionsWalkRoundedIcon, stat: "7,800 steps/day" },
    { label: "Cross-Train", icon: FitnessCenterRoundedIcon, stat: "Zone 4 Cardio" },
  ];

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        bgcolor: TOKENS.canvas,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        px: { xs: 2, sm: 4 },
        py: 6,
      }}
    >
      {/* Multi-Layer Ambient Aurora Canvas */}
      <Box
        sx={{
          position: "absolute",
          top: "-25%",
          left: "-15%",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${TOKENS.teal600}44 0%, transparent 65%)`,
          filter: "blur(60px)",
          animation: "auroraShift 22s ease-in-out infinite alternate",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "-20%",
          right: "-10%",
          width: 650,
          height: 650,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${TOKENS.coral}28 0%, transparent 70%)`,
          filter: "blur(70px)",
          animation: "auroraShift 18s ease-in-out infinite alternate-reverse",
          pointerEvents: "none",
        }}
      />

      {/* Hero Container */}
      <Stack
        spacing={3.5}
        alignItems="center"
        sx={{ maxWidth: 840, width: "100%", textAlign: "center", position: "relative", zIndex: 1 }}
      >
        {/* Floating Top Pill */}
        <Fade in timeout={500}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1.2,
              bgcolor: "rgba(246, 248, 247, 0.06)",
              border: `1px solid ${TOKENS.borderDark}`,
              borderRadius: 30,
              py: 0.7,
              px: 2,
              backdropFilter: "blur(12px)",
              animation: "floatBadge 4s ease-in-out infinite",
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: TOKENS.tealNeon,
                boxShadow: `0 0 10px ${TOKENS.tealNeon}`,
              }}
            />
            <Typography variant="caption" sx={{ color: "#F6F8F7", fontWeight: 700, letterSpacing: "0.1em" }}>
              PRECISION TELEMETRY & BIO-ANALYTICS 2.0
            </Typography>
          </Box>
        </Fade>

        {/* Title */}
        <Box>
          <Typography
            variant="h3"
            sx={{
              color: "#F6F8F7",
              fontSize: { xs: "2.3rem", sm: "3.4rem", md: "3.8rem" },
              lineHeight: 1.08,
            }}
          >
            Transform Every Step into
            <br />
            <Box
              component="span"
              sx={{
                background: `linear-gradient(135deg, ${TOKENS.tealNeon} 10%, ${TOKENS.teal300} 50%, ${TOKENS.coral} 90%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Actionable Intelligence.
            </Box>
          </Typography>
          <Typography
            sx={{
              color: "rgba(246,248,247,0.72)",
              fontSize: { xs: "1rem", sm: "1.15rem" },
              maxWidth: 580,
              mx: "auto",
              mt: 2,
              lineHeight: 1.6,
            }}
          >
            Log activities with instant pace breakdowns, elevation tracking, heart rate zones,
            and AI-driven recovery insights.
          </Typography>
        </Box>

        {/* Interactive SVG Trace Graphic */}
        <InteractiveTelemetryTrace />

        {/* Action Button & Live Mode Switchers */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" sx={{ width: "100%", justifyContent: "center" }}>
          <Button
            variant="contained"
            size="large"
            onClick={onLogin}
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{
              bgcolor: TOKENS.coral,
              color: "#FFF",
              px: 4.5,
              py: 1.6,
              fontSize: "1.05rem",
              boxShadow: `0 10px 30px -6px ${TOKENS.coralGlow}`,
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: TOKENS.coralBright,
                transform: "translateY(-2px) scale(1.02)",
                boxShadow: `0 14px 36px -4px ${TOKENS.coralGlow}`,
              },
            }}
          >
            Start Tracking Free
          </Button>

          <Button
            variant="outlined"
            onClick={onLogin}
            startIcon={<PlayCircleFilledRoundedIcon sx={{ color: TOKENS.tealNeon }} />}
            sx={{
              borderColor: TOKENS.borderDark,
              color: "#F6F8F7",
              bgcolor: "rgba(255,255,255,0.04)",
              px: 3,
              py: 1.6,
              fontSize: "0.95rem",
              "&:hover": {
                borderColor: TOKENS.teal300,
                bgcolor: "rgba(255,255,255,0.08)",
              },
            }}
          >
            View Live Demo
          </Button>
        </Stack>

        {/* Sport Telemetry Switch Chips */}
        <Stack
          direction="row"
          spacing={1.2}
          sx={{ flexWrap: "wrap", justifyContent: "center", mt: 1 }}
        >
          {sports.map((s) => {
            const isSelected = selectedSport === s.label;
            const IconComp = s.icon;
            return (
              <Chip
                key={s.label}
                icon={<IconComp sx={{ color: isSelected ? `${TOKENS.tealNeon} !important` : "rgba(246,248,247,0.5) !important" }} fontSize="small" />}
                label={`${s.label} • ${s.stat}`}
                onClick={() => setSelectedSport(s.label)}
                sx={{
                  bgcolor: isSelected ? "rgba(16, 185, 129, 0.15)" : "rgba(246,248,247,0.04)",
                  border: `1px solid ${isSelected ? TOKENS.teal300 : "rgba(246,248,247,0.1)"}`,
                  color: isSelected ? "#FFF" : "rgba(246,248,247,0.7)",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: "rgba(16, 185, 129, 0.22)",
                  },
                }}
              />
            );
          })}
        </Stack>

        {/* Biometric KPIs */}
        <BiometricRingsCard />
      </Stack>
    </Box>
  );
};

// ---- Top Bar -----------------------------------------------------------
const TopBar = ({ user, onLogout }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backdropFilter: scrolled ? "blur(14px)" : "none",
        backgroundColor: scrolled ? "rgba(255,255,255,0.92)" : "#FFFFFF",
        borderBottom: "1px solid rgba(15,107,92,0.08)",
        boxShadow: scrolled ? "0 10px 30px -15px rgba(15,107,92,0.25)" : "none",
        transition: "all 0.25s ease",
      }}
    >
      <Toolbar sx={{ gap: 2, px: { xs: 2, md: 4 } }}>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          component={RouterLink}
          to="/activities"
          sx={{ textDecoration: "none", color: "inherit", flexGrow: 1 }}
        >
          <Box sx={{ position: "relative", width: 38, height: 38 }}>
            <Box
              sx={{
                position: "absolute",
                inset: -3,
                borderRadius: "50%",
                bgcolor: "rgba(15,107,92,0.18)",
                animation: "pulseGlow 2.5s ease-in-out infinite",
              }}
            />
            <Avatar
              sx={{
                bgcolor: "primary.main",
                width: 38,
                height: 38,
                position: "relative",
                boxShadow: "0 4px 12px rgba(15,107,92,0.3)",
              }}
            >
              <ActivityOutlinedIcon fontSize="small" sx={{ color: "#FFF" }} />
            </Avatar>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
              PulseTracker
            </Typography>
            <Stack direction="row" spacing={0.8} alignItems="center">
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#10B981" }} />
              <Typography variant="caption" sx={{ color: TOKENS.inkSoft, fontWeight: 700, fontSize: "0.68rem" }}>
                GPS LOCK ACTIVE
              </Typography>
            </Stack>
          </Box>
        </Stack>

        {/* 7-Day Streak Badge */}
        <Tooltip title="7-day activity streak! Keep it going.">
          <Chip
            icon={<LocalFireDepartmentRoundedIcon sx={{ color: `${TOKENS.coral} !important` }} />}
            label="7-Day Streak"
            size="small"
            sx={{
              bgcolor: "rgba(255, 94, 58, 0.1)",
              border: `1px solid rgba(255, 94, 58, 0.25)`,
              color: TOKENS.coral,
              fontWeight: 800,
              display: { xs: "none", sm: "flex" },
            }}
          />
        </Tooltip>

        {user?.name && (
          <UserProfileMenu
            displayName={user.name}
            userId={localStorage.getItem("userId")}
            sx={{ display: { xs: "none", sm: "flex" } }}
          />
        )}

        <Button
          variant="outlined"
          color="secondary"
          size="small"
          startIcon={<LogoutIcon />}
          onClick={onLogout}
          sx={{
            borderRadius: 2.5,
            borderWidth: "1.5px",
            transition: "all 0.18s ease",
            "&:hover": {
              borderWidth: "1.5px",
              transform: "translateY(-1px)",
              boxShadow: "0 4px 12px rgba(255,94,58,0.2)",
            },
          }}
        >
          Sign Out
        </Button>
      </Toolbar>
    </AppBar>
  );
};

// ---- Enhanced Activities Dashboard -------------------------------------
const SectionCard = ({ eyebrow, title, icon: IconComponent, delay, children }) => (
  <Grow in timeout={500} style={{ transitionDelay: delay }}>
    <Box
      sx={{
        p: { xs: 2.5, sm: 3.5 },
        borderRadius: 4,
        bgcolor: "background.paper",
        border: "1px solid rgba(15,107,92,0.08)",
        boxShadow: "0 4px 20px -4px rgba(0,0,0,0.03)",
        transition: "all 0.25s ease",
        "&:hover": {
          borderColor: "rgba(15,107,92,0.2)",
          boxShadow: "0 16px 40px -12px rgba(15,107,92,0.12)",
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: TOKENS.teal600, fontWeight: 800, letterSpacing: "0.14em" }}
          >
            {eyebrow}
          </Typography>
          <Typography variant="h6" fontWeight={800} sx={{ color: TOKENS.ink }}>
            {title}
          </Typography>
        </Box>
        {IconComponent && (
          <Avatar sx={{ bgcolor: "rgba(15,107,92,0.08)", color: TOKENS.teal600, width: 40, height: 40 }}>
            <IconComponent fontSize="small" />
          </Avatar>
        )}
      </Stack>
      {children}
    </Box>
  </Grow>
);

const PerformancePulse = () => {
  const pulsePoints = "0,104 52,92 104,98 156,62 208,74 260,38 312,48 364,20 416,34";

  return (
    <Fade in timeout={700}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.45fr) minmax(230px, 0.8fr)" },
          gap: 2,
          p: { xs: 2, sm: 2.5 },
          borderRadius: 4,
          background: "linear-gradient(110deg, #062C24 0%, #0A4036 58%, #12352D 100%)",
          color: "#FFF",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 18px 36px -20px rgba(6,78,59,0.7)",
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            opacity: 0.16,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage: "linear-gradient(90deg, black, transparent 78%)",
            pointerEvents: "none",
          },
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1, minWidth: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Box>
              <Typography variant="overline" sx={{ color: TOKENS.tealNeon, fontWeight: 800, letterSpacing: "0.16em", lineHeight: 1 }}>
                PERFORMANCE PULSE
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.75, fontWeight: 800, color: "#FFF" }}>
                Your momentum is building
              </Typography>
            </Box>
            <Chip
              icon={<ShowChartRoundedIcon sx={{ color: `${TOKENS.tealNeon} !important` }} />}
              label="+12%"
              size="small"
              sx={{ bgcolor: "rgba(0,245,212,0.12)", color: TOKENS.tealNeon, fontWeight: 800, flexShrink: 0 }}
            />
          </Stack>

          <Box sx={{ mt: 2, height: { xs: 112, sm: 132 }, position: "relative" }}>
            <svg viewBox="0 0 416 124" width="100%" height="100%" preserveAspectRatio="none" aria-label="Weekly performance trend">
              <defs>
                <linearGradient id="pulseFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={TOKENS.tealNeon} stopOpacity="0.28" />
                  <stop offset="1" stopColor={TOKENS.tealNeon} stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline points={`0,124 ${pulsePoints} 416,124`} fill="url(#pulseFill)" stroke="none" />
              <polyline points={pulsePoints} fill="none" stroke={TOKENS.tealNeon} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {[104, 208, 312].map((x) => <line key={x} x1={x} y1="8" x2={x} y2="116" stroke="rgba(255,255,255,0.12)" strokeDasharray="3 6" />)}
              <circle cx="364" cy="20" r="6" fill={TOKENS.coral} stroke="#FFF" strokeWidth="3" />
            </svg>
            <Stack direction="row" justifyContent="space-between" sx={{ position: "absolute", inset: "auto 0 0" }}>
              {['MON', 'WED', 'FRI', 'SUN'].map((day) => (
                <Typography key={day} variant="caption" sx={{ color: "rgba(255,255,255,0.52)", fontSize: "0.65rem", fontWeight: 700 }}>{day}</Typography>
              ))}
            </Stack>
          </Box>
        </Box>

        <Stack spacing={1.2} sx={{ position: "relative", zIndex: 1 }}>
          {[
            { icon: DirectionsRunRoundedIcon, label: "Best streak", value: "7 days", color: TOKENS.coral },
            { icon: TimerOutlinedIcon, label: "Weekly time", value: "2h 48m", color: TOKENS.tealNeon },
            { icon: BoltRoundedIcon, label: "Readiness", value: "Excellent", color: TOKENS.gold },
          ].map(({ icon: Icon, label, value, color }) => (
            <Stack key={label} direction="row" spacing={1.25} alignItems="center" sx={{ p: 1.2, borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Box sx={{ width: 32, height: 32, borderRadius: "10px", display: "grid", placeItems: "center", bgcolor: `${color}22`, color, flexShrink: 0 }}><Icon sx={{ fontSize: 18 }} /></Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ display: "block", color: "rgba(255,255,255,0.58)", fontWeight: 600 }}>{label}</Typography>
                <Typography variant="subtitle2" sx={{ color: "#FFF", fontWeight: 800 }}>{value}</Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Fade>
  );
};

const ActivitiesPage = ({ firstName }) => {
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <Stack spacing={3}>
      {/* Header Banner */}
      <Fade in timeout={450}>
        <Box
          sx={{
            p: { xs: 2.5, sm: 4 },
            borderRadius: 4,
            background: `linear-gradient(135deg, ${TOKENS.teal900} 0%, #082520 60%, ${TOKENS.surfaceDark} 100%)`,
            color: "#FFF",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 16px 36px -10px rgba(6,78,59,0.35)",
          }}
        >
          {/* Subtle decorative glow */}
          <Box
            sx={{
              position: "absolute",
              right: -50,
              top: -50,
              width: 220,
              height: 220,
              borderRadius: "50%",
              bgcolor: `${TOKENS.teal300}22`,
              filter: "blur(40px)",
            }}
          />

          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={3} sx={{ position: "relative", zIndex: 1 }}>
            <Box sx={{ maxWidth: 570 }}>
              <Typography variant="h5" fontWeight={800}>
                {greeting()}{firstName ? `, ${firstName}` : ""} 👋
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", mt: 0.5 }}>
                Ready to push your limits? Today's condition is <strong>Optimal (68°F • Low Humidity)</strong>.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <Chip
                icon={<WbSunnyRoundedIcon sx={{ color: `${TOKENS.gold} !important` }} fontSize="small" />}
                label="Clear • 68°F"
                sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "#FFF", fontWeight: 700 }}
              />
              <Chip
                icon={<ShowChartRoundedIcon sx={{ color: `${TOKENS.tealNeon} !important` }} fontSize="small" />}
                label="+12% vs last week"
                sx={{ bgcolor: "rgba(0, 245, 212, 0.15)", color: TOKENS.tealNeon, fontWeight: 700 }}
              />
            </Stack>
          </Stack>

          <Box
            sx={{
              position: "absolute",
              right: { xs: -84, md: -34 },
              bottom: -94,
              width: 260,
              height: 260,
              borderRadius: "50%",
              border: `1px solid ${TOKENS.tealNeon}35`,
              boxShadow: `0 0 0 24px ${TOKENS.tealNeon}0B, 0 0 0 48px ${TOKENS.tealNeon}08`,
              pointerEvents: "none",
            }}
          />
        </Box>
      </Fade>

      <PerformancePulse />

      {/* Log Activity Card */}
      <SectionCard eyebrow="TELEMETRY INPUT" title="Log an activity" icon={DirectionsRunRoundedIcon} delay="0.05s">
        <ActvityForm />
      </SectionCard>

      {/* Activity History Card */}
      <SectionCard eyebrow="HISTORICAL DATA & SPLITS" title="Your activity feed" icon={ShowChartRoundedIcon} delay="0.15s">
        <ActivityList />
      </SectionCard>
    </Stack>
  );
};

// ---- App Root Component -------------------------------------------------
function App() {
  const { token, tokenData, logIn, logOut } = useContext(AuthContext);
  const dispatch = useDispatch();

  useEffect(() => {
    if (token && tokenData) {
      dispatch(setCredentials({ token, user: tokenData }));
    }
  }, [token, tokenData, dispatch]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    dispatch(logout());
    logOut({ postLogoutRedirectUri: window.location.origin });
  };

  const handleLogin = () => {
    // Clear any previous error query params from the URL if present
    if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    logIn();
  };

  const loggedIn = useMemo(() => Boolean(token), [token]);
  const firstName = tokenData?.given_name || tokenData?.name?.split(" ")?.[0];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {globalStyles}
      <Router>
        {!loggedIn ? (
          <WelcomeHero onLogin={handleLogin} />
        ) : (
          <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
            <TopBar user={tokenData} onLogout={handleLogout} />
            <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
              <Routes>
                <Route path="/activities" element={<ActivitiesPage firstName={firstName} />} />
                <Route path="/activities/:id" element={<ActivityDetail />} />
                <Route path="/" element={<Navigate to="/activities" replace />} />
              </Routes>
            </Container>
          </Box>
        )}
      </Router>
    </ThemeProvider>
  );
}

export default App;