import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { analyticsAPI } from '../../services/api';

const DataCard = ({ title, value, unit }) => (
  <Paper
    elevation={3}
    sx={{
      p: { xs: 2, md: 2.5 },
      textAlign: 'center',
      height: { xs: 120, sm: 140 },
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 2,
      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      minWidth: 0,
      width: '100%',
      maxWidth: 320,
      mx: 'auto',
      bgcolor: 'background.paper',
    }}
  >
    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 600, letterSpacing: 0.2 }}>
      {title}
    </Typography>
    <Typography variant="h4" component="div" fontWeight={700} sx={{ mb: 0.5, fontSize: { xs: '2rem', sm: '2.2rem' }, lineHeight: 1.1 }}>
      {value}
      {unit && (
        <Typography variant="body2" component="span" sx={{ ml: 0.5, fontWeight: 500, color: 'text.secondary' }}>
          {unit}
        </Typography>
      )}
    </Typography>
  </Paper>
);

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const analytics = await analyticsAPI.getUsage();
        setAnalytics(analytics);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Defensive: If analytics is null, show all cards as '-'
  const totalUsers = analytics?.totalUsers ?? '-';
  const totalSessions = analytics?.totalSessions ?? '-';
  const averageConfidence = analytics?.averageConfidence !== undefined && analytics?.averageConfidence !== null ? (analytics.averageConfidence * 100).toFixed(1) : '-';
  const averageResponseTime = analytics?.averageResponseTime !== undefined && analytics?.averageResponseTime !== null ? analytics.averageResponseTime.toFixed(0) : '-';

  return (
    <Box
      sx={{
        maxWidth: 1100,
        mx: 'auto',
        p: { xs: 1, md: 3 },
        width: '100%',
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 2, md: 3 },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
          Analytics Dashboard
        </Typography>
        <Tooltip title="Filter (coming soon)">
          <IconButton size="small" sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 2, ml: 1 }}>
            <FilterListIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <DataCard title="Total Users" value={totalUsers} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DataCard title="Total Chats" value={totalSessions} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DataCard title="Avg. Confidence" value={averageConfidence} unit="%" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DataCard title="Avg. Response Time" value={averageResponseTime} unit="ms" />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;