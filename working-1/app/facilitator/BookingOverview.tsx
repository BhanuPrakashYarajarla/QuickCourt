
'use client';

import { useState, useEffect } from 'react';

interface Booking {
  id: number;
  user_id: number;
  court_id: number;
  facility_id: number;
  user_name: string;
  user_email: string;
  court_name: string;
  sport_type: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
}

interface BookingStats {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
  revenue: number;
}

export default function BookingOverview() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats>({
    total: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0,
    revenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentFacilityId, setCurrentFacilityId] = useState<number | null>(null);

  // Fetch user's facilities and bookings on component mount
  useEffect(() => {
    fetchUserFacilities();
  }, []);

  const fetchUserFacilities = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Get user data from localStorage
      const userData = localStorage.getItem('userData');
      if (!userData) {
        setError('User not authenticated');
        return;
      }
      
      const user = JSON.parse(userData);
      
      const response = await fetch(`http://localhost:5001/facilities/my?user_id=${user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch facilities');
      }
      
      const data = await response.json();
      
      if (data.facilities.length > 0) {
        const facilityId = data.facilities[0].id;
        setCurrentFacilityId(facilityId);
        await fetchBookings(facilityId);
        await fetchBookingStats(facilityId);
      } else {
        setError('No facilities found. Please create a facility first.');
      }
      
    } catch (error: any) {
      setError(error.message || 'Failed to fetch facilities');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookings = async (facilityId: number) => {
    try {
      const response = await fetch(`http://localhost:5001/bookings?facility_id=${facilityId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const data = await response.json();
      setBookings(data.bookings);
      
    } catch (error: any) {
      setError(error.message || 'Failed to fetch bookings');
    }
  };

  const fetchBookingStats = async (facilityId: number) => {
    try {
      const response = await fetch(`http://localhost:5001/bookings/stats?facility_id=${facilityId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch booking stats');
      }
      
      const data = await response.json();
      setStats(data);
      
    } catch (error: any) {
      console.error('Failed to fetch booking stats:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filterBookings = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = bookings;

    // Filter by tab
    if (activeTab === 'upcoming') {
      filtered = filtered.filter(booking => new Date(booking.booking_date) >= today && booking.status === 'confirmed');
    } else if (activeTab === 'past') {
      filtered = filtered.filter(booking => new Date(booking.booking_date) < today || booking.status === 'completed');
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(booking => booking.status.toLowerCase() === selectedStatus);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.court_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.sport_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const handleStatusChange = async (bookingId: number, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:5001/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update booking status');
      }

      // Refresh bookings and stats
      if (currentFacilityId) {
        await fetchBookings(currentFacilityId);
        await fetchBookingStats(currentFacilityId);
      }
      
    } catch (error: any) {
      setError(error.message || 'Failed to update booking status');
    }
  };

  const handleCancelBooking = (bookingId: number) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      handleStatusChange(bookingId, 'cancelled');
    }
  };

  const filteredBookings = filterBookings();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Booking Overview</h1>
            <p className="text-gray-600 mt-1">Loading...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentFacilityId) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Booking Overview</h1>
            <p className="text-gray-600 mt-1">No facilities available</p>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <i className="ri-building-line text-4xl text-yellow-400"></i>
          </div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Facilities Found</h3>
          <p className="text-yellow-700 mb-4">You need to create a facility before you can view bookings.</p>
          <button
            onClick={() => window.location.href = '/facilitator'}
            className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors duration-200 font-medium"
          >
            Go to Facility Management
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Booking Overview</h1>
          <p className="text-gray-600 mt-1">Monitor and manage all court bookings</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <i className="ri-calendar-line text-white text-xl"></i>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">{stats.upcoming}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <i className="ri-time-line text-white text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-900 mt-2">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <i className="ri-check-line text-white text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-red-900 mt-2">{stats.cancelled}</p>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <i className="ri-close-line text-white text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-purple-900 mt-2">${stats.revenue}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-white text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'all', name: 'All Bookings' },
              { id: 'upcoming', name: 'Upcoming' },
              { id: 'past', name: 'Past' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="pending">Pending</option>
            </select>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              />
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      {bookings.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <i className="ri-calendar-line text-4xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Found</h3>
          <p className="text-gray-600 mb-6">You haven't received any bookings yet. This is normal for new facilities.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Court & Sport
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{booking.user_name}</div>
                        <div className="text-sm text-gray-500">{booking.user_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{booking.court_name}</div>
                        <div className="text-sm text-gray-500">{booking.sport_type}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(booking.booking_date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">{booking.start_time} - {booking.end_time}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">${booking.total_amount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(booking.payment_status)}`}>
                        {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {booking.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(booking.id, 'completed')}
                              className="text-green-600 hover:text-green-900 whitespace-nowrap"
                            >
                              Mark Complete
                            </button>
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="text-red-600 hover:text-red-900 whitespace-nowrap"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        <button className="text-blue-600 hover:text-blue-900 whitespace-nowrap">
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <i className="ri-calendar-line text-gray-300 text-6xl mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
