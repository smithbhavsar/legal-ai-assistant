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
  <Paper sx={{ p: 2, textAlign: 'center' }}>
    <Typography variant="h6" color="text.secondary">
      {title}
    </Typography>
    <Typography variant="h4" component="div" fontWeight="bold">
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
        const response = await analyticsAPI.getAnalytics();
        setAnalytics(response.data);
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Analytics Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <DataCard title="Total Users" value={analytics?.totalUsers} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DataCard title="Total Chats" value={analytics?.totalSessions} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DataCard
            title="Avg. Confidence"
            value={analytics?.averageConfidence?.toFixed(2)}
            unit="%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DataCard
            title="Avg. Response Time"
            value={analytics?.averageResponseTime?.toFixed(0)}
            unit="ms"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;