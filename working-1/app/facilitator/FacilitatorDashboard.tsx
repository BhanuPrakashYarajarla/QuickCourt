
'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

export default function FacilitatorDashboard() {
  const kpiData = [
    { title: 'Total Bookings', value: '1,247', change: '+12%', icon: 'ri-calendar-check-line', color: 'bg-black' },
    { title: 'Active Courts', value: '18', change: '+2', icon: 'ri-table-line', color: 'bg-black' },
    { title: 'Monthly Earnings', value: '$24,580', change: '+8.5%', icon: 'ri-money-dollar-circle-line', color: 'bg-black' },
    { title: 'Occupancy Rate', value: '78%', change: '+5%', icon: 'ri-pie-chart-line', color: 'bg-black' },
  ];

  const bookingTrendsData = [
    { name: 'Jan', bookings: 245, earnings: 6800 },
    { name: 'Feb', bookings: 282, earnings: 7400 },
    { name: 'Mar', bookings: 318, earnings: 8300 },
    { name: 'Apr', bookings: 361, earnings: 9650 },
    { name: 'May', bookings: 395, earnings: 11100 },
    { name: 'Jun', bookings: 428, earnings: 12450 },
    { name: 'Jul', bookings: 467, earnings: 13800 },
    { name: 'Aug', bookings: 445, earnings: 12900 },
    { name: 'Sep', bookings: 412, earnings: 11200 },
    { name: 'Oct', bookings: 378, earnings: 10100 },
    { name: 'Nov', bookings: 356, earnings: 9800 },
    { name: 'Dec', bookings: 389, earnings: 10650 },
  ];

  const earningsData = [
    { name: 'Tennis Courts', value: 85000, color: '#000000' },
    { name: 'Basketball Courts', value: 62000, color: '#374151' },
    { name: 'Badminton Courts', value: 48000, color: '#6b7280' },
    { name: 'Football Fields', value: 51000, color: '#9ca3af' },
  ];

  const peakHoursData = [
    { hour: '6 AM', bookings: 120 },
    { hour: '7 AM', bookings: 280 },
    { hour: '8 AM', bookings: 450 },
    { hour: '9 AM', bookings: 380 },
    { hour: '10 AM', bookings: 520 },
    { hour: '11 AM', bookings: 480 },
    { hour: '12 PM', bookings: 350 },
    { hour: '1 PM', bookings: 410 },
    { hour: '2 PM', bookings: 560 },
    { hour: '3 PM', bookings: 620 },
    { hour: '4 PM', bookings: 750 },
    { hour: '5 PM', bookings: 890 },
    { hour: '6 PM', bookings: 950 },
    { hour: '7 PM', bookings: 820 },
    { hour: '8 PM', bookings: 670 },
    { hour: '9 PM', bookings: 430 },
    { hour: '10 PM', bookings: 250 },
  ];

  const upcomingBookings = [
    { id: 1, court: 'Tennis Court 1', time: '10:00 AM - 11:00 AM', user: 'John Smith', sport: 'Tennis', bookingDate: '2024-01-10', bookingTime: '3:45 PM' },
    { id: 2, court: 'Basketball Court A', time: '2:00 PM - 3:00 PM', user: 'Mike Johnson', sport: 'Basketball', bookingDate: '2024-01-12', bookingTime: '11:20 AM' },
    { id: 3, court: 'Badminton Court 3', time: '4:00 PM - 5:00 PM', user: 'Sarah Wilson', sport: 'Badminton', bookingDate: '2024-01-11', bookingTime: '9:15 AM' },
    { id: 4, court: 'Football Field 1', time: '6:00 PM - 7:00 PM', user: 'Team Alpha', sport: 'Football', bookingDate: '2024-01-13', bookingTime: '7:30 PM' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-black">Dashboard</h1>
        <p className="text-gray-600 mt-1">Complete yearly analytics overview for your sports complex</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                <p className="text-2xl font-bold text-black mt-2">{kpi.value}</p>
                <p className="text-sm text-green-600 mt-1">{kpi.change} from last year</p>
              </div>
              <div className={`w-12 h-12 ${kpi.color} rounded-lg flex items-center justify-center`}>
                <i className={`${kpi.icon} text-white text-xl`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Booking Trends */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-black">Yearly Booking Trends</h3>
            <div className="flex space-x-2">
              <span className="flex items-center text-sm text-gray-600">
                <div className="w-3 h-3 bg-black rounded-full mr-2"></div>
                Bookings
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={bookingTrendsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#000000' }}
              />
              <Line type="monotone" dataKey="bookings" stroke="#000000" strokeWidth={3} dot={{ fill: '#000000', strokeWidth: 2, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Earnings Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-black mb-6">Annual Earnings by Sport</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={earningsData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelStyle={{ fill: '#000000', fontSize: '12px' }}
              >
                {earningsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`$${value}`, 'Earnings']} 
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#000000' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Peak Hours Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-black mb-6">Peak Booking Hours (Annual Average)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={peakHoursData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="hour" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#000000' }}
            />
            <Area type="monotone" dataKey="bookings" stroke="#000000" fill="#000000" fillOpacity={0.1} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-black">Today's Upcoming Bookings</h3>
            <button className="text-black hover:text-gray-700 font-medium">View All</button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                    <i className="ri-time-line text-white"></i>
                  </div>
                  <div>
                    <p className="font-medium text-black">{booking.court}</p>
                    <p className="text-sm text-gray-600">{booking.time}</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-medium text-black">{booking.user}</p>
                  <p className="text-sm text-gray-600">{booking.sport}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-black">Booked on: {booking.bookingDate}</p>
                  <p className="text-sm text-gray-600">at {booking.bookingTime}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}