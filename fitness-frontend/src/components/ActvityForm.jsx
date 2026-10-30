import {
  Box,
  Button,
  Card,
  CircularProgress,
  Grid,
  InputAdornment,
  LinearProgress,
  Snackbar,
  Alert,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Fade,
} from "@mui/material";
import { useMemo, useState } from "react";
import DirectionsRunRoundedIcon from "@mui/icons-material/DirectionsRunRounded";
import DirectionsWalkRoundedIcon from "@mui/icons-material/DirectionsWalkRounded";
import DirectionsBikeRoundedIcon from "@mui/icons-material/DirectionsBikeRounded";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { addActivity } from "../services/api";

const ACTIVITY_TYPES = [
  { value: "RUNNING", label: "Running", Icon: DirectionsRunRoundedIcon },
  { value: "WALKING", label: "Walking", Icon: DirectionsWalkRoundedIcon },
  { value: "CYCLING", label: "Cycling", Icon: DirectionsBikeRoundedIcon },
];

const INITIAL_STATE = {
  type: "RUNNING",
  duration: "",
  caloriesBurned: "",
  additionalMetrics: {},
};

const ActvityForm = ({ onActivitiesAdded }) => {
  const [activity, setActivity] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [toast, setToast] = useState({ open: false, severity: "success", message: "" });

  const handleField = (field) => (e) => {
    setActivity({ ...activity, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: null });
  };

  const handleType = (_e, value) => {
    if (value) setActivity({ ...activity, type: value });
  };

  // Live-computed intensity readout — calories per minute.
  const caloriesPerMin = useMemo(() => {
    const d = Number(activity.duration);
    const c = Number(activity.caloriesBurned);
    if (!d || !c) return null;
    return (c / d).toFixed(1);
  }, [activity.duration, activity.caloriesBurned]);

  const validate = () => {
    const next = {};
    if (!activity.duration || Number(activity.duration) <= 0)
      next.duration = "Enter a duration greater than 0";
    if (!activity.caloriesBurned || Number(activity.caloriesBurned) <= 0)
      next.caloriesBurned = "Enter calories greater than 0";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await addActivity({
        ...activity,
        duration: Number(activity.duration),
        caloriesBurned: Number(activity.caloriesBurned),
      });

      // Let ActivityList (and anything else listening) know a new activity
      // just landed in the database, so it can refresh itself in place.
      window.dispatchEvent(new CustomEvent("activity:added"));
      onActivitiesAdded?.();

      setActivity(INITIAL_STATE);
      setToast({ open: true, severity: "success", message: "Activity added." });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1800);
    } catch (err) {
      console.error("Error adding activity:", err);
      setToast({ open: true, severity: "error", message: "Couldn't add activity. Try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card
        component="form"
        onSubmit={handleSubmit}
        noValidate
        variant="outlined"
        sx={{
          position: "relative",
          overflow: "hidden",
          p: { xs: 2.5, sm: 3 },
          borderRadius: 3,
          borderColor: "rgba(15,107,92,0.12)",
        }}
      >
        {/* In-progress save indicator, pinned to the card's top edge */}
        {submitting && (
          <LinearProgress
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              bgcolor: "transparent",
              "& .MuiLinearProgress-bar": {
                background: "linear-gradient(90deg, #0F6B5C, #FF6B4A)",
              },
            }}
          />
        )}

        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          Log an activity
        </Typography>

        {/* Icon-based type picker */}
        <ToggleButtonGroup
          value={activity.type}
          exclusive
          onChange={handleType}
          fullWidth
          disabled={submitting}
          sx={{
            mb: 3,
            gap: 1.5,
            opacity: submitting ? 0.6 : 1,
            transition: "opacity 0.2s ease",
            "& .MuiToggleButtonGroup-grouped": {
              border: "1px solid rgba(15,107,92,0.15) !important",
              borderRadius: "12px !important",
            },
          }}
        >
          {ACTIVITY_TYPES.map(({ value, label, Icon }) => (
            <ToggleButton
              key={value}
              value={value}
              sx={{
                flexDirection: "column",
                gap: 0.5,
                py: 1.5,
                textTransform: "none",
                color: "text.secondary",
                transition: "all 0.18s ease",
                "&.Mui-selected": {
                  color: "primary.main",
                  bgcolor: "rgba(15,107,92,0.08)",
                  "&:hover": { bgcolor: "rgba(15,107,92,0.12)" },
                },
                "&:hover": { bgcolor: "rgba(15,107,92,0.04)" },
              }}
            >
              <Icon fontSize="small" />
              <Typography variant="caption" fontWeight={600}>
                {label}
              </Typography>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Grid container spacing={2}>
          <Grid size={6}>
            <TextField
              fullWidth
              label="Duration"
              type="number"
              value={activity.duration}
              onChange={handleField("duration")}
              error={Boolean(errors.duration)}
              helperText={errors.duration}
              disabled={submitting}
              slotProps={{
                htmlInput: { min: 0 },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <TimerOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  endAdornment: <InputAdornment position="end">min</InputAdornment>,
                },
              }}
            />
          </Grid>

          <Grid size={6}>
            <TextField
              fullWidth
              label="Calories burned"
              type="number"
              value={activity.caloriesBurned}
              onChange={handleField("caloriesBurned")}
              error={Boolean(errors.caloriesBurned)}
              helperText={errors.caloriesBurned}
              disabled={submitting}
              slotProps={{
                htmlInput: { min: 0 },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocalFireDepartmentOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  endAdornment: <InputAdornment position="end">kcal</InputAdornment>,
                },
              }}
            />
          </Grid>
        </Grid>

        {/* Live intensity readout, only shows once both fields are valid */}
        <Fade in={Boolean(caloriesPerMin)} unmountOnExit>
          <Box
            sx={{
              mt: 2.5,
              px: 2,
              py: 1,
              borderRadius: 2,
              bgcolor: "rgba(255,107,74,0.08)",
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <LocalFireDepartmentOutlinedIcon fontSize="small" sx={{ color: "secondary.main" }} />
            <Typography variant="body2" fontWeight={600} color="secondary.dark">
              {caloriesPerMin} kcal/min
            </Typography>
          </Box>
        </Fade>

        <Box sx={{ mt: 3 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            color={justSaved ? "success" : "primary"}
            sx={{
              minWidth: 170,
              transition: "background-color 0.2s ease",
            }}
          >
            {submitting ? (
              <CircularProgress size={20} sx={{ color: "common.white" }} />
            ) : justSaved ? (
              <Fade in timeout={250}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <CheckRoundedIcon fontSize="small" />
                  Saved
                </Box>
              </Fade>
            ) : (
              "Add activity"
            )}
          </Button>
        </Box>
      </Card>

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          onClose={() => setToast({ ...toast, open: false })}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ActvityForm;