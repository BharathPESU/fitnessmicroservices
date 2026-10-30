import {
  Avatar,
  Box,
  Divider,
  Fade,
  IconButton,
  Popover,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { getUserProfile } from "../services/api";
import { TOKENS } from "../Theme";

/**
 * Clickable username -> popover with the user's details, fetched from
 * GET /api/v1/{userId} (UserController#getUserProfile).
 *
 * Adjust the field list below once you confirm the exact shape of
 * UserResponse — this assumes firstName / lastName / email / id, the
 * common fields for this kind of DTO.
 */
const UserProfileMenu = ({ userId, displayName, sx }) => {
  const resolvedUserId = userId || localStorage.getItem("userId");

  const [anchorEl, setAnchorEl] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const open = Boolean(anchorEl);

  const handleOpen = async (e) => {
    setAnchorEl(e.currentTarget);

    // fetch once per mount; a profile popover doesn't need to re-fetch
    // every time it's reopened
    if (profile || loading) return;

    setLoading(true);
    setError(null);
    try {
      const response = await getUserProfile(resolvedUserId);
      setProfile(response.data);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError("Couldn't load user details.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => setAnchorEl(null);

  const handleCopyId = (idStr) => {
    if (!idStr) return;
    navigator.clipboard.writeText(idStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fullName =
    profile && (profile.firstName || profile.lastName)
      ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim()
      : displayName;

  return (
    <>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        onClick={handleOpen}
        sx={{
          cursor: "pointer",
          px: 1,
          py: 0.5,
          borderRadius: 2,
          transition: "background-color 0.15s ease",
          "&:hover": { bgcolor: "rgba(15,107,92,0.08)" },
          ...sx,
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: "rgba(15,107,92,0.14)",
            color: TOKENS.teal600,
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {displayName?.[0]?.toUpperCase() ?? <PersonOutlineRoundedIcon fontSize="small" />}
        </Avatar>
        <Typography variant="body2" fontWeight={600} sx={{ color: "text.primary" }}>
          {displayName}
        </Typography>
      </Stack>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slots={{ transition: Fade }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 270,
              borderRadius: 3,
              border: "1px solid rgba(15,107,92,0.12)",
              boxShadow: "0 12px 32px -12px rgba(15,107,92,0.35)",
            },
          },
        }}
      >
        <Box sx={{ p: 2.5 }}>
          {loading && (
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton variant="text" width="70%" />
                  <Skeleton variant="text" width="50%" />
                </Box>
              </Stack>
              <Skeleton variant="rounded" height={36} sx={{ borderRadius: 2 }} />
              <Skeleton variant="rounded" height={36} sx={{ borderRadius: 2 }} />
            </Stack>
          )}

          {!loading && error && (
            <Stack alignItems="center" spacing={1} sx={{ py: 1.5, color: "text.secondary" }}>
              <ErrorOutlineRoundedIcon sx={{ color: TOKENS.danger }} />
              <Typography variant="body2">{error}</Typography>
            </Stack>
          )}

          {!loading && !error && profile && (
            <Fade in timeout={300}>
              <Box>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Avatar
                    sx={{
                      width: 44,
                      height: 44,
                      bgcolor: "rgba(15,107,92,0.14)",
                      color: TOKENS.teal600,
                      fontWeight: 700,
                    }}
                  >
                    {fullName?.[0]?.toUpperCase() ?? <PersonOutlineRoundedIcon />}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
                      {fullName || "—"}
                    </Typography>
                    {profile.email && (
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {profile.email}
                      </Typography>
                    )}
                  </Box>
                </Stack>

                <Divider sx={{ mb: 1.5 }} />

                <Stack spacing={1.25}>
                  {profile.email && (
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <EmailOutlinedIcon fontSize="small" sx={{ color: TOKENS.teal300 }} />
                      <Typography variant="body2">{profile.email}</Typography>
                    </Stack>
                  )}
                  {(resolvedUserId || profile.id) && (
                    <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="space-between">
                      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                        <BadgeOutlinedIcon fontSize="small" sx={{ color: TOKENS.teal300, flexShrink: 0 }} />
                        <Typography
                          variant="body2"
                          sx={{
                            wordBreak: "break-all",
                            color: "text.secondary",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {resolvedUserId || profile.id}
                        </Typography>
                      </Stack>
                      <Tooltip title={copied ? "Copied!" : "Copy user ID"}>
                        <IconButton
                          size="small"
                          onClick={() => handleCopyId(resolvedUserId || profile.id)}
                          sx={{ color: copied ? TOKENS.teal600 : "text.secondary", flexShrink: 0 }}
                        >
                          {copied ? <CheckRoundedIcon fontSize="small" /> : <ContentCopyRoundedIcon sx={{ fontSize: 15 }} />}
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  )}
                </Stack>
              </Box>
            </Fade>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default UserProfileMenu;