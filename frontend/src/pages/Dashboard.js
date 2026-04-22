import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import API from '../api/axios';
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/dashboard/').then(res => {
      setStats(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    API.get(`/revenue/?period=${period}`).then(res => setRevenueData(res.data));
  }, [period]);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">🚗</div>
          <div className="stat-info">
            <h3>{stats?.total_vehicles || 0}</h3>
            <p>Total Vehicles</p>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">🔧</div>
          <div className="stat-info">
            <h3>{stats?.total_components || 0}</h3>
            <p>Components</p>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">🛠️</div>
          <div className="stat-info">
            <h3>{stats?.active_services || 0}</h3>
            <p>Active Services</p>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>₹{(stats?.total_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-header">
          <h2>Revenue Overview</h2>
          <div className="period-tabs">
            {['daily', 'monthly', 'yearly'].map(p => (
              <button
                key={p}
                className={period === p ? 'active' : ''}
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="chart-container">
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              {period === 'daily' ? (
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1a73e8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${v}`} />
                  <Tooltip formatter={(v) => [`₹${v.toFixed(2)}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#1a73e8" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                </AreaChart>
              ) : (
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${v}`} />
                  <Tooltip formatter={(v) => [`₹${v.toFixed(2)}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#1a73e8" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No revenue data available for this period.</div>
          )}
        </div>
      </div>
    </div>
  );
}
