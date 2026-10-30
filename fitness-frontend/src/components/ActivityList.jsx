import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  Grow,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DirectionsRunRoundedIcon from "@mui/icons-material/DirectionsRunRounded";
import DirectionsWalkRoundedIcon from "@mui/icons-material/DirectionsWalkRounded";
import DirectionsBikeRoundedIcon from "@mui/icons-material/DirectionsBikeRounded";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import ChecklistRtlRoundedIcon from "@mui/icons-material/ChecklistRtlRounded";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import { getActivities } from "../services/api";
import { RouteTrace, TOKENS, useCountUp } from "../Theme";

const TYPE_META = {
  RUNNING: { label: "Running", Icon: DirectionsRunRoundedIcon, color: TOKENS.teal600 },
  WALKING: { label: "Walking", Icon: DirectionsWalkRoundedIcon, color: TOKENS.teal300 },
  CYCLING: { label: "Cycling", Icon: DirectionsBikeRoundedIcon, color: TOKENS.coral },
};

const getActivityItems = (payload) => {
  const candidates = [
    payload,
    payload?.activities,
    payload?.content,
    payload?.data,
    payload?.data?.activities,
    payload?.data?.content,
  ];
  const activityItems = candidates.find(Array.isArray);
  if (activityItems) return activityItems;
  return [];
};

// ---- One overview pill: icon, count-up value, label ----
const OverviewStat = ({ Icon, value, suffix, label, color, delay }) => {
  const count = useCountUp(value);
  return (
    <Grow in timeout={450} style={{ transitionDelay: delay }}>
      <Stack
        direction="row"
        spacing={1.25}
        alignItems="center"
        sx={{
          flex: "1 1 150px",
          p: 1.5,
          borderRadius: 2.5,
          bgcolor: `${color}0D`,
          border: `1px solid ${color}22`,
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: "9px",
            bgcolor: `${color}1F`,
            color,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Icon fontSize="small" />
        </Box>
        <Box>
          <Typography variant="subtitle2" fontWeight={800} lineHeight={1.15}>
            {count}
            {suffix}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
            {label}
          </Typography>
        </Box>
      </Stack>
    </Grow>
  );
};

const ActivityList = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [newIds, setNewIds] = useState(new Set());
  const activitiesRef = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    activitiesRef.current = activities;
  }, [activities]);

  // silent=true is used for background refreshes (e.g. right after saving
  // a new activity) so the whole grid doesn't flash back to skeletons —
  // just a slim progress bar up top.
  const fetchActivities = async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      const response = await getActivities();
      const activityItems = getActivityItems(response.data);

      if (silent) {
        const prevIds = new Set(activitiesRef.current.map((a) => a.id));
        const added = activityItems.filter((a) => !prevIds.has(a.id)).map((a) => a.id);
        if (added.length) {
          setNewIds(new Set(added));
          setTimeout(() => setNewIds(new Set()), 4000);
        }
      }

      setActivities(activityItems);
    } catch (error) {
      setError(true);
      console.error("Error fetching activities:", error);
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  // ActvityForm dispatches this once the new activity is saved to the
  // database, so the list updates in place instead of a full page reload.
  useEffect(() => {
    const onAdded = () => fetchActivities({ silent: true });
    window.addEventListener("activity:added", onAdded);
    return () => window.removeEventListener("activity:added", onAdded);
  }, []);

  const filtered = useMemo(
    () => (filter === "ALL" ? activities : activities.filter((a) => a.type === filter)),
    [activities, filter]
  );

  const typesPresent = useMemo(
    () => [...new Set(activities.map((a) => a.type))],
    [activities]
  );

  const totals = useMemo(
    () => ({
      count: activities.length,
      duration: activities.reduce((sum, a) => sum + (a.duration || 0), 0),
      calories: activities.reduce((sum, a) => sum + (a.caloriesBurned || 0), 0),
    }),
    [activities]
  );

  // ---- Loading skeleton ----
  if (loading) {
    return (
      <Grid container spacing={{ xs: 2, md: 2.5 }} columns={{ xs: 4, sm: 8, md: 12 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Grid size={{ xs: 4, sm: 4, md: 4 }} key={i}>
            <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: "rgba(15,107,92,0.1)" }}>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: "10px" }} />
                  <Skeleton variant="text" width="42%" height={28} />
                </Stack>
                <Skeleton variant="text" width="65%" />
                <Skeleton variant="text" width="55%" />
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) {
    return (
      <Stack alignItems="center" spacing={1.25} sx={{ py: 5, textAlign: "center" }}>
        <InboxOutlinedIcon sx={{ fontSize: 40, color: "secondary.main", opacity: 0.8 }} />
        <Typography variant="subtitle1" fontWeight={800}>Activity feed unavailable</Typography>
        <Typography variant="body2" color="text.secondary">
          Check that the fitness gateway is running, then try again.
        </Typography>
        <Chip label="Try again" onClick={() => fetchActivities()} color="primary" clickable />
      </Stack>
    );
  }

  // ---- Empty state ----
  if (!activities.length) {
    return (
      <Stack alignItems="center" spacing={1.5} sx={{ py: 6, color: "text.secondary" }}>
        <InboxOutlinedIcon sx={{ fontSize: 40, opacity: 0.5 }} />
        <Typography variant="body2">No activities logged yet.</Typography>
      </Stack>
    );
  }

  return (
    <Box>
      {/* Slim progress bar while a background refresh is in flight */}
      <Box sx={{ height: 3, mb: refreshing ? 2 : 0, borderRadius: 1, overflow: "hidden" }}>
        {refreshing && (
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
      </Box>

      {/* Overview strip — the actual "more informatic" ask: totals at a
          glance before scrolling the individual cards */}
      <Stack direction="row" spacing={1.25} sx={{ mb: 2.5, flexWrap: "wrap", gap: 1.25 }}>
        <OverviewStat
          Icon={ChecklistRtlRoundedIcon}
          value={totals.count}
          suffix=""
          label={totals.count === 1 ? "Activity logged" : "Activities logged"}
          color={TOKENS.teal600}
          delay="0s"
        />
        <OverviewStat
          Icon={TimerOutlinedIcon}
          value={totals.duration}
          suffix=" min"
          label="Total time"
          color={TOKENS.teal300}
          delay="0.06s"
        />
        <OverviewStat
          Icon={LocalFireDepartmentOutlinedIcon}
          value={totals.calories}
          suffix=" kcal"
          label="Total burned"
          color={TOKENS.coral}
          delay="0.12s"
        />
      </Stack>

      <Box sx={{ opacity: 0.5, my: 2 }}>
        <RouteTrace tone="quiet" height={28} />
      </Box>

      {/* Interactive type filter, only shown once there's more than one type to split by */}
      {typesPresent.length > 1 && (
        <Stack direction="row" spacing={1} sx={{ mb: 2.5, flexWrap: "wrap", gap: 1 }}>
          <Chip
            label="All"
            size="small"
            onClick={() => setFilter("ALL")}
            sx={{
              fontWeight: 600,
              bgcolor: filter === "ALL" ? "primary.main" : "rgba(15,107,92,0.08)",
              color: filter === "ALL" ? "#fff" : "primary.main",
              "&:hover": { bgcolor: filter === "ALL" ? "primary.dark" : "rgba(15,107,92,0.14)" },
            }}
          />
          {typesPresent.map((type) => {
            const meta = TYPE_META[type] ?? { label: type, color: "#5B6E68" };
            const active = filter === type;
            return (
              <Chip
                key={type}
                label={meta.label}
                size="small"
                onClick={() => setFilter(type)}
                sx={{
                  fontWeight: 600,
                  bgcolor: active ? meta.color : "rgba(15,107,92,0.08)",
                  color: active ? "#fff" : meta.color,
                  "&:hover": { opacity: 0.9 },
                }}
              />
            );
          })}
        </Stack>
      )}

      <Grid container spacing={{ xs: 2, md: 2.5 }} columns={{ xs: 4, sm: 8, md: 12 }}>
        {filtered.map((activity, index) => {
          const meta = TYPE_META[activity.type] ?? {
            label: activity.type,
            Icon: DirectionsRunRoundedIcon,
            color: "#5B6E68",
          };
          const { Icon, color, label } = meta;
          const isNew = newIds.has(activity.id);

          return (
            <Grow in timeout={400} style={{ transitionDelay: `${Math.min(index, 8) * 40}ms` }} key={activity.id}>
              <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                <Card
                  variant="outlined"
                  sx={{
                    position: "relative",
                    borderRadius: 3,
                    borderColor: isNew ? "rgba(255,107,74,0.45)" : "rgba(15,107,92,0.12)",
                    boxShadow: isNew ? "0 0 0 4px rgba(255,107,74,0.12)" : "none",
                    transition:
                      "transform 0.15s ease, box-shadow 0.4s ease, border-color 0.4s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: `0 8px 20px -8px ${color}55`,
                    },
                  }}
                >
                  {isNew && (
                    <Chip
                      label="New"
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        height: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        bgcolor: TOKENS.coral,
                        color: "#fff",
                      }}
                    />
                  )}
                  <CardActionArea onClick={() => navigate(`/activities/${activity.id}`)}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: "10px",
                            display: "grid",
                            placeItems: "center",
                            bgcolor: `${color}1A`,
                            color,
                          }}
                        >
                          <Icon fontSize="small" />
                        </Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {label}
                        </Typography>
                      </Stack>

                      <Stack spacing={0.75}>
                        <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
                          <TimerOutlinedIcon sx={{ fontSize: 18 }} />
                          <Typography variant="body2">{activity.duration} min</Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
                          <LocalFireDepartmentOutlinedIcon sx={{ fontSize: 18 }} />
                          <Typography variant="body2">{activity.caloriesBurned} kcal</Typography>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            </Grow>
          );
        })}
      </Grid>
    </Box>
  );
};

export default ActivityList;