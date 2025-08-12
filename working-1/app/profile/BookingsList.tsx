'use client';
import { useState } from 'react';

interface Booking {
  id: number;
  venueName: string;
  sport: string;
  date: string;
  time: string;
  location: string;
  status: string;
  hasReview: boolean;
}

interface BookingsListProps {
  bookings: Booking[];
  onWriteReview: (booking: Booking) => void;
  onCancelBooking: (bookingId: number) => void;
  isLoading: boolean;
  error: string;
}

export default function BookingsList({ bookings, onWriteReview, onCancelBooking, isLoading, error }: BookingsListProps) {
  const [filter, setFilter] = useState('all');

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return { bg: 'bg-green-100', text: 'text-green-600', icon: 'ri-checkbox-circle-fill text-green-500' };
      case 'cancelled':
        return { bg: 'bg-red-100', text: 'text-red-600', icon: 'ri-close-circle-fill text-red-500' };
      case 'completed':
        return { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'ri-check-double-line text-blue-500' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600', icon: 'ri-time-line text-gray-500' };
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'cancelled') return booking.status === 'Cancelled';
    return true;
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <i className="ri-error-warning-line text-4xl text-red-400"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error loading bookings</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header with Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 rounded-full p-1 w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap ${
              filter === 'all'
                ? 'bg-green-500 text-white'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            All Bookings
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap ${
              filter === 'cancelled'
                ? 'bg-green-500 text-white'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.map((booking) => (
          <div key={booking.id} className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <div className="w-6 h-6 flex items-center justify-center mr-2">
                    <i className="ri-gamepad-line text-lg text-orange-600"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-black">
                    {booking.venueName} ({booking.sport})
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center">
                    <div className="w-5 h-5 flex items-center justify-center mr-2">
                      <i className="ri-calendar-line text-base text-red-500"></i>
                    </div>
                    <span className="text-sm text-gray-600">{booking.date}</span>
                  </div>

                  <div className="flex items-center">
                    <div className="w-5 h-5 flex items-center justify-center mr-2">
                      <i className="ri-time-line text-base text-red-500"></i>
                    </div>
                    <span className="text-sm text-gray-600">{booking.time}</span>
                  </div>

                  <div className="flex items-center">
                    <div className="w-5 h-5 flex items-center justify-center mr-2">
                      <i className="ri-map-pin-line text-base text-red-500"></i>
                    </div>
                    <span className="text-sm text-gray-600">{booking.location}</span>
                  </div>

                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-2">Status:</span>
                    <div className="flex items-center">
                      <div className={`w-4 h-4 flex items-center justify-center mr-1 ${getStatusColor(booking.status).bg} rounded-full`}>
                        <i className={`${getStatusColor(booking.status).icon} text-sm`}></i>
                      </div>
                      <span className={`text-sm font-medium ${getStatusColor(booking.status).text}`}>{booking.status}</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  {booking.status === 'Confirmed' && (
                    <button 
                      onClick={() => onCancelBooking(booking.id)}
                      className="px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors duration-200 cursor-pointer whitespace-nowrap"
                    >
                      Cancel Booking
                    </button>
                  )}
                  
                  {booking.hasReview ? (
                    <button className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed whitespace-nowrap">
                      Review Submitted
                    </button>
                  ) : (
                    <button
                      onClick={() => onWriteReview(booking)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200 cursor-pointer whitespace-nowrap"
                    >
                      Write Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 flex items-center justify-center">
                <i className="ri-calendar-line text-2xl text-gray-400"></i>
              </div>
            </div>
            <p className="text-gray-500">No bookings found</p>
          </div>
        )}
      </div>
    </div>
  );
}