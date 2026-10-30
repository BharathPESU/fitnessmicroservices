import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Fade,
  Grid,
  Grow,
  IconButton,
  LinearProgress,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import DirectionsRunRoundedIcon from "@mui/icons-material/DirectionsRunRounded";
import DirectionsWalkRoundedIcon from "@mui/icons-material/DirectionsWalkRounded";
import DirectionsBikeRoundedIcon from "@mui/icons-material/DirectionsBikeRounded";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import PsychologyOutlinedIcon from "@mui/icons-material/PsychologyOutlined";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import HealthAndSafetyOutlinedIcon from "@mui/icons-material/HealthAndSafetyOutlined";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";

import { getActivityDetail } from "../services/api";
import { TOKENS, RouteTrace } from "../Theme";

// Same palette + type mapping as ActivityList so both pages feel like one product
const TYPE_META = {
  RUNNING: { label: "Running", Icon: DirectionsRunRoundedIcon, color: TOKENS.teal600 },
  WALKING: { label: "Walking", Icon: DirectionsWalkRoundedIcon, color: TOKENS.teal300 },
  CYCLING: { label: "Cycling", Icon: DirectionsBikeRoundedIcon, color: TOKENS.coral },
};

const FALLBACK_META = { label: "Activity", Icon: DirectionsRunRoundedIcon, color: TOKENS.inkSoft };

// Section accent colors, drawn from the shared token set
const SECTION_COLORS = {
  improvements: TOKENS.coral,
  suggestions: TOKENS.teal300,
  safety: TOKENS.danger,
};

// The recommendation is generated asynchronously after the activity is
// saved (a queue/worker picks it up), so it may not exist yet the moment
// this page loads. Poll for it for a while before giving up.
const MAX_POLL_ATTEMPTS = 8;
const POLL_INTERVAL_MS = 3000;

const hasRecommendationData = (a) =>
  Boolean(
    a?.recommendation || a?.improvements?.length || a?.suggestions?.length || a?.safety?.length
  );

// ---- A stat card, styled like ActivityList's Card/CardActionArea ----
const StatCard = ({ Icon, label, value, color, delay }) => (
  <Grow in timeout={500} style={{ transitionDelay: delay }}>
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        borderColor: `${color}30`,
        height: "100%",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 8px 20px -8px ${color}40`,
        },
      }}
    >
      <CardContent sx={{ p: 2.25, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "10px",
            display: "grid",
            placeItems: "center",
            bgcolor: `${color}1A`,
            color,
            flexShrink: 0,
            animation: "softPulse 2.6s ease infinite",
            animationDelay: delay,
          }}
        >
          <Icon fontSize="small" />
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, letterSpacing: 0.4 }}>
            {label.toUpperCase()}
          </Typography>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  </Grow>
);

// ---- Collapsible recommendation section with its own icon + accent color ----
const InsightSection = ({ icon: Icon, title, color, items, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  if (!items?.length) return null;

  return (
    <Box sx={{ mb: 1 }}>
      <CardActionRow onClick={() => setOpen((o) => !o)} color={color} title={title} Icon={Icon} count={items.length} open={open} />
      <Collapse in={open} timeout={300} unmountOnExit>
        <Stack spacing={1} sx={{ mt: 1, mb: 2 }}>
          {items.map((text, i) => (
            <Fade in key={i} timeout={400} style={{ transitionDelay: `${i * 60}ms` }}>
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="flex-start"
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: `${color}0D`,
                  border: `1px solid ${color}22`,
                  transition: "background-color 0.15s ease, transform 0.15s ease",
                  "&:hover": { bgcolor: `${color}1A`, transform: "translateX(2px)" },
                }}
              >
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: "6px",
                    bgcolor: `${color}26`,
                    color,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                    mt: 0.1,
                  }}
                >
                  {i + 1}
                </Box>
                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                  {text}
                </Typography>
              </Stack>
            </Fade>
          ))}
        </Stack>
      </Collapse>
    </Box>
  );
};

const CardActionRow = ({ onClick, color, title, Icon, count, open }) => (
  <Stack
    direction="row"
    alignItems="center"
    onClick={onClick}
    sx={{
      cursor: "pointer",
      py: 1,
      userSelect: "none",
      "&:hover .expand-icon": { bgcolor: `${color}26` },
    }}
  >
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: "8px",
        bgcolor: `${color}1F`,
        color,
        display: "grid",
        placeItems: "center",
        mr: 1.25,
      }}
    >
      <Icon fontSize="small" />
    </Box>
    <Typography
      variant="subtitle2"
      sx={{ color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, flexGrow: 1 }}
    >
      {title}
    </Typography>
    <Chip
      label={count}
      size="small"
      sx={{ bgcolor: `${color}1A`, color, fontWeight: 700, height: 22, mr: 0.5 }}
    />
    <IconButton
      className="expand-icon"
      size="small"
      sx={{
        transition: "transform 0.25s ease, background-color 0.15s ease",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        color,
      }}
    >
      <ExpandMoreRoundedIcon fontSize="small" />
    </IconButton>
  </Stack>
);

// ---- Animated "still generating" card, shown while the recommendation
// worker hasn't produced anything yet, with a fallback once we give up
// polling automatically ----
const GeneratingCard = ({ exhausted, onRetry }) => (
  <Grow in timeout={500}>
    <Card variant="outlined" sx={{ borderRadius: 3, borderColor: "rgba(15,107,92,0.12)", overflow: "hidden" }}>
      {!exhausted && (
        <LinearProgress
          sx={{
            height: 3,
            bgcolor: "transparent",
            "& .MuiLinearProgress-bar": {
              background: `linear-gradient(90deg, ${TOKENS.teal600}, ${TOKENS.coral})`,
            },
          }}
        />
      )}
      <CardContent sx={{ p: { xs: 2.5, sm: 3 }, textAlign: "center" }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            bgcolor: "rgba(15,107,92,0.1)",
            color: TOKENS.teal600,
            display: "grid",
            placeItems: "center",
            mx: "auto",
            mb: 2,
            animation: exhausted ? "none" : "softPulse 2s ease infinite",
          }}
        >
          <PsychologyOutlinedIcon />
        </Box>

        {!exhausted ? (
          <>
            <Stack direction="row" spacing={0.6} justifyContent="center" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Generating your recommendation
              </Typography>
              <Stack direction="row" spacing={0.4}>
                {[0, 1, 2].map((i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      bgcolor: TOKENS.teal600,
                      animation: "dotBounce 1.2s ease infinite",
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </Stack>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Our AI is reviewing this activity — this usually takes a few seconds.
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
              Still working on it
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              This is taking longer than usual. You can check again in a moment.
            </Typography>
            <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={onRetry}>
              Check again
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  </Grow>
);

const ActivityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [pollAttempts, setPollAttempts] = useState(0);
  const retryKeyRef = useRef(0);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let alive = true;
    let timer;
    let attempts = 0;

    const fetchOnce = async (isPoll) => {
      if (!isPoll) {
        setLoading(true);
        setError(null);
      }
      try {
        const response = await getActivityDetail(id);
        if (!alive) return;
        setActivity(response.data);

        if (!hasRecommendationData(response.data) && attempts < MAX_POLL_ATTEMPTS) {
          attempts += 1;
          setPollAttempts(attempts);
          timer = setTimeout(() => fetchOnce(true), POLL_INTERVAL_MS);
        } else {
          setPollAttempts(attempts);
        }
      } catch (err) {
        console.error("Error fetching activity detail:", err);
        if (alive && !isPoll) setError("Unable to load this activity. Please try again.");
      } finally {
        if (alive && !isPoll) setLoading(false);
      }
    };

    fetchOnce(false);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [id, retryKey]);

  const meta = useMemo(() => {
    if (!activity) return FALLBACK_META;
    return TYPE_META[activity.type] ?? { ...FALLBACK_META, label: activity.type };
  }, [activity]);

  const hasRecommendation = hasRecommendationData(activity);

  // Real, computed-from-real-data pace stat — not fabricated telemetry.
  const paceValue = useMemo(() => {
    if (!activity?.duration) return null;
    return (activity.caloriesBurned / activity.duration).toFixed(1);
  }, [activity]);

  // ---- Loading ----
  if (loading) {
    return (
      <Box>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
          <Skeleton variant="circular" width={44} height={44} />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width="30%" height={16} />
            <Skeleton variant="text" width="50%" height={28} />
          </Box>
        </Stack>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid size={{ xs: 6, sm: 3 }} key={i}>
              <Skeleton variant="rounded" height={88} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={260} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  // ---- Error ----
  if (error) {
    return (
      <Stack alignItems="center" spacing={1.5} sx={{ py: 8, color: "text.secondary" }}>
        <ErrorOutlineRoundedIcon sx={{ fontSize: 42, color: TOKENS.danger, opacity: 0.8 }} />
        <Typography variant="body2">{error}</Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshRoundedIcon />}
          onClick={() => {
            retryKeyRef.current += 1;
            setRetryKey(retryKeyRef.current);
          }}
        >
          Try again
        </Button>
      </Stack>
    );
  }

  if (!activity) return null;

  const { Icon: TypeIcon, color, label } = meta;

  return (
    <Fade in timeout={400}>
      <Box>
        {/* ── Header ── */}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <Tooltip title="Back to activities">
            <IconButton
              onClick={() => navigate(-1)}
              sx={{
                bgcolor: "rgba(15,107,92,0.08)",
                "&:hover": { bgcolor: "rgba(15,107,92,0.16)" },
              }}
            >
              <ArrowBackRoundedIcon />
            </IconButton>
          </Tooltip>

          <Avatar
            sx={{
              width: 44,
              height: 44,
              bgcolor: `${color}1A`,
              color,
              animation: "softPulse 2.6s ease infinite",
            }}
          >
            <TypeIcon />
          </Avatar>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, letterSpacing: 0.6 }}>
              ACTIVITY REPORT
            </Typography>
            <Typography variant="h5" fontWeight={800} lineHeight={1.2}>
              {label}
            </Typography>
          </Box>

          <Tooltip title={saved ? "Saved" : "Save activity"}>
            <IconButton
              onClick={() => setSaved((s) => !s)}
              sx={{ color: saved ? TOKENS.coral : "text.secondary" }}
            >
              {saved ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Share">
            <IconButton sx={{ color: "text.secondary" }}>
              <ShareRoundedIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* ── Stat cards — only fields the API actually returns, plus one
             value computed directly from them (pace) ── */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard Icon={TimerOutlinedIcon} label="Duration" value={`${activity.duration} min`} color={TOKENS.teal600} delay="0.05s" />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard Icon={LocalFireDepartmentOutlinedIcon} label="Calories" value={`${activity.caloriesBurned} kcal`} color={TOKENS.coral} delay="0.1s" />
          </Grid>
          {paceValue && (
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard Icon={SpeedRoundedIcon} label="Pace" value={`${paceValue} kcal/min`} color={TOKENS.teal300} delay="0.15s" />
            </Grid>
          )}
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard
              Icon={CalendarMonthOutlinedIcon}
              label="Date"
              value={new Date(activity.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              color={TOKENS.teal900}
              delay="0.2s"
            />
          </Grid>
        </Grid>

        {/* ── Recommendation card ── */}
        {hasRecommendation ? (
          <Grow in timeout={550} style={{ transitionDelay: "0.15s" }}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: "rgba(15,107,92,0.12)",
                overflow: "visible",
              }}
            >
              <LinearProgress
                variant="determinate"
                value={100}
                sx={{
                  height: 3,
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                  bgcolor: "transparent",
                  "& .MuiLinearProgress-bar": {
                    background: `linear-gradient(90deg, ${TOKENS.teal600}, ${TOKENS.coral})`,
                  },
                }}
              />
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: "10px",
                      bgcolor: "rgba(15,107,92,0.1)",
                      color: TOKENS.teal600,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <PsychologyOutlinedIcon fontSize="small" />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <AutoAwesomeRoundedIcon sx={{ fontSize: 13, color: TOKENS.teal600 }} />
                      <Typography variant="caption" sx={{ color: TOKENS.teal600, fontWeight: 700, letterSpacing: 0.6 }}>
                        POWERED BY AI
                      </Typography>
                    </Stack>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Personalized Recommendation
                    </Typography>
                  </Box>
                </Stack>

                {activity.recommendation && (
                  <Fade in timeout={500}>
                    <Typography
                      variant="body2"
                      sx={{
                        lineHeight: 1.75,
                        mb: 2.5,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "rgba(15,107,92,0.05)",
                        borderLeft: `3px solid ${TOKENS.teal600}`,
                      }}
                    >
                      {activity.recommendation}
                    </Typography>
                  </Fade>
                )}

                <InsightSection
                  icon={TrendingUpRoundedIcon}
                  title="Improvements"
                  color={SECTION_COLORS.improvements}
                  items={activity.improvements}
                />
                <InsightSection
                  icon={EmojiEventsOutlinedIcon}
                  title="Suggestions"
                  color={SECTION_COLORS.suggestions}
                  items={activity.suggestions}
                />
                <InsightSection
                  icon={HealthAndSafetyOutlinedIcon}
                  title="Safety Guidelines"
                  color={SECTION_COLORS.safety}
                  items={activity.safety}
                  defaultOpen={false}
                />
              </CardContent>
            </Card>
          </Grow>
        ) : (
          <GeneratingCard
            exhausted={pollAttempts >= MAX_POLL_ATTEMPTS}
            onRetry={() => {
              retryKeyRef.current += 1;
              setRetryKey(retryKeyRef.current);
            }}
          />
        )}

        {hasRecommendation && (
          <Box sx={{ opacity: 0.4, mt: 3 }}>
            <RouteTrace tone="quiet" height={24} />
          </Box>
        )}
      </Box>
    </Fade>
  );
};

export default ActivityDetail;