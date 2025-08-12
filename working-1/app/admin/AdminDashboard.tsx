
'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/admin/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch admin stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-black">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Loading dashboard data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-black">Admin Dashboard</h1>
          <p className="text-red-600 mt-1">Error: {error}</p>
          <button 
            onClick={fetchAdminStats}
            className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-black">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">No data available</p>
        </div>
      </div>
    );
  }

  const kpiData = [
    { title: 'Total Users', value: stats.kpi_data.total_users.toLocaleString(), change: '+0%', icon: 'ri-user-line', color: 'bg-black' },
    { title: 'Facility Owners', value: stats.kpi_data.total_facility_owners.toLocaleString(), change: '+0', icon: 'ri-building-line', color: 'bg-black' },
    { title: 'Total Bookings', value: stats.kpi_data.total_bookings.toLocaleString(), change: '+0%', icon: 'ri-calendar-check-line', color: 'bg-black' },
    { title: 'Active Courts', value: stats.kpi_data.total_courts.toLocaleString(), change: '+0', icon: 'ri-table-line', color: 'bg-black' },
  ];

  // Transform monthly data for charts
  const monthlyData = stats.monthly_registrations.map((item: any) => ({
    name: item.month,
    users: item.count,
    bookings: stats.monthly_bookings.find((b: any) => b.month === item.month)?.count || 0
  }));

  const mostActiveSportsData = stats.most_active_sports.map((sport: any, index: number) => ({
    name: sport.sport,
    bookings: sport.bookings,
    color: ['#000000', '#374151', '#6b7280', '#9ca3af', '#d1d5db'][index] || '#000000'
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-black">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Complete platform analytics and management overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                <p className="text-2xl font-bold text-black mt-2">{kpi.value}</p>
                <p className="text-sm text-green-600 mt-1">{kpi.change} from last month</p>
              </div>
              <div className={`${kpi.color} p-3 rounded-lg`}>
                <i className={`${kpi.icon} text-white text-xl`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Registration & Bookings Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-black mb-4">User Activity Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#000000" strokeWidth={2} name="New Users" />
              <Line type="monotone" dataKey="bookings" stroke="#6b7280" strokeWidth={2} name="Bookings" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Most Active Sports */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-black mb-4">Most Active Sports</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mostActiveSportsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="bookings"
              >
                {mostActiveSportsData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Bookings Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-black mb-4">Monthly Bookings</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="bookings" fill="#000000" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Registration Area Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-black mb-4">User Registration Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="users" stroke="#000000" fill="#000000" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-black mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <i className="ri-user-add-line text-3xl text-black mb-2"></i>
            <p className="font-medium text-black">Manage Users</p>
            <p className="text-sm text-gray-600">View and manage all users</p>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <i className="ri-building-line text-3xl text-black mb-2"></i>
            <p className="font-medium text-black">Facility Approval</p>
            <p className="text-sm text-gray-600">{stats.kpi_data.pending_approvals} pending approvals</p>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <i className="ri-bar-chart-line text-3xl text-black mb-2"></i>
            <p className="font-medium text-black">View Reports</p>
            <p className="text-sm text-gray-600">Detailed analytics and reports</p>
          </div>
        </div>
      </div>
    </div>
  );
}
