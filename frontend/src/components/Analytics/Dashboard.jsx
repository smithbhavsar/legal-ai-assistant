import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { analyticsAPI } from '../../services/api';

const Dashboard = () => {
  const [analytics, setAnalytics] = useState({
    totalQueries: 0,
    totalUsers: 0,
    avgResponseTime: 0,
    topQuestions: [],
    usageByDepartment: [],
    confidenceStats: {},
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const { user } = useAuth();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getUsageStats(timeRange);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, trend, color = "blue" }) => (
    <div className={`glass-card p-6 rounded-xl border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-300">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}% from last period
            </p>
          )}
        </div>
        <div className={`text-${color}-400 text-4xl`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Check if user has permission to view analytics
  if (!user || !['supervisor', 'admin'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-4 flex items-center justify-center">
        <div className="glass-card p-8 rounded-xl text-center">
          <div className="text-6xl text-red-400 mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-300">You need supervisor or admin privileges to view analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-card p-6 mb-6 rounded-xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
              <p className="text-blue-200">Legal AI Assistant Usage Statistics</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="input-field"
              >
                <option value="1d">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
              
              <button
                onClick={fetchAnalytics}
                className="btn-secondary"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Queries"
            value={formatNumber(analytics.totalQueries)}
            icon="💬"
            trend={12}
            color="blue"
          />
          <StatCard
            title="Active Users"
            value={formatNumber(analytics.totalUsers)}
            icon="👥"
            trend={8}
            color="green"
          />
          <StatCard
            title="Avg Response Time"
            value={`${analytics.avgResponseTime}s`}
            icon="⚡"
            trend={-5}
            color="yellow"
          />
          <StatCard
            title="System Uptime"
            value="99.8%"
            icon="✅"
            trend={0.2}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Questions */}
          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Most Common Questions</h2>
            <div className="space-y-3">
              {analytics.topQuestions.map((question, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800 bg-opacity-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-white text-sm">{question.query}</p>
                    <p className="text-gray-400 text-xs mt-1">{question.category}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-blue-400 font-medium">{question.count}</span>
                    <p className="text-xs text-gray-400">queries</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department Usage */}
          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Usage by Department</h2>
            <div className="space-y-3">
              {analytics.usageByDepartment.map((dept, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-white">{dept.name}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(dept.queries / analytics.totalQueries) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-blue-400 font-medium w-8 text-right">{dept.queries}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Confidence Statistics */}
        <div className="glass-card p-6 rounded-xl mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">AI Confidence Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">
                {analytics.confidenceStats.high || 0}%
              </div>
              <p className="text-sm text-gray-300">High Confidence (80%+)</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">
                {analytics.confidenceStats.medium || 0}%
              </div>
              <p className="text-sm text-gray-300">Medium Confidence (60-79%)</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">
                {analytics.confidenceStats.low || 0}%
              </div>
              <p className="text-sm text-gray-300">Low Confidence (&lt;60%)</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {analytics.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    activity.type === 'query' ? 'bg-blue-500' :
                    activity.type === 'login' ? 'bg-green-500' :
                    'bg-gray-500'
                  }`}></div>
                  <div>
                    <p className="text-white text-sm">{activity.description}</p>
                    <p className="text-gray-400 text-xs">{activity.user} • {activity.department}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;