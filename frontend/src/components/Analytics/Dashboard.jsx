import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { analyticsAPI } from '../../services/api';

const DataCard = ({ title, value, unit }) => (
  <Paper sx={{
    p: 2,
    textAlign: 'center',
    height: 140,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    minWidth: 180,
  }}>
    <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
      {title}
    </Typography>
    <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 0.5 }}>
      {value}
      {unit && (
        <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>
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
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
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
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 1, md: 3 } }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Analytics Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <DataCard title="Total Users" value={totalUsers} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DataCard title="Total Chats" value={totalSessions} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DataCard
            title="Avg. Confidence"
            value={averageConfidence}
            unit="%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DataCard
            title="Avg. Response Time"
            value={averageResponseTime}
            unit="ms"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;