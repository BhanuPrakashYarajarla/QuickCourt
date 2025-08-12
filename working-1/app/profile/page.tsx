'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProfileSidebar from './ProfileSidebar';
import BookingsList from './BookingsList';
import EditProfile from './EditProfile';
import WriteReview from './WriteReview';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

interface User {
  name: string;
  phone: string;
  email: string;
  profilePic: string;
}

interface Booking {
  id: number;
  venueName: string;
  sport: string;
  date: string;
  time: string;
  location: string;
  status: string;
  hasReview: boolean;
  review?: any;
}

export default function ProfilePage() {
  const router = useRouter();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('bookings');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // User data from localStorage
  const [user, setUser] = useState({
    name: '',
    phone: '',
    email: '',
    profilePic: ''
  });
  
  // Dynamic bookings data from backend
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is signed in and get user role
    const userSignedIn = localStorage.getItem('userSignedIn') === 'true';
    const userData = localStorage.getItem('userData');
    
    if (!userSignedIn) {
      router.push('/login');
    } else {
      // Check if user is a facilitator and redirect them
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.role === 'facility_owner') {
            router.push('/facilitator');
            return;
          }
          
          // Set real user data
          setUser({
            name: user.full_name || 'User',
            phone: user.phone || '',
            email: user.email || '',
            profilePic: user.avatar_url || ''
          });
          
          // Fetch user's bookings from backend
          fetchUserBookings(user.id);
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
      
      setIsSignedIn(true);
    }
  }, [router]);

  const fetchUserBookings = async (userId: number) => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch(`http://localhost:5001/bookings?user_id=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const data = await response.json();
      
      // Transform backend data to match original frontend format
      const transformedBookings: Booking[] = data.bookings.map((booking: any) => ({
        id: booking.id,
        venueName: booking.facility_name,
        sport: booking.sport_type,
        date: new Date(booking.booking_date).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        time: `${booking.start_time} - ${booking.end_time}`,
        location: booking.facility_location,
        status: booking.status.charAt(0).toUpperCase() + booking.status.slice(1),
        hasReview: false // We'll implement review checking later
      }));
      
      setBookings(transformedBookings);
      
    } catch (error: any) {
      setError(error.message || 'Failed to fetch bookings');
      // Fallback to empty array if backend fails
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWriteReview = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowReviewModal(true);
  };

  const handleReviewSubmit = (reviewData: any) => {
    // Update booking with review
    setBookings(prev => prev.map(booking => 
      booking.id === selectedBooking?.id 
        ? { ...booking, hasReview: true, review: reviewData }
        : booking
    ));
    setShowReviewModal(false);
    setSelectedBooking(null);
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const userData = localStorage.getItem('userData');
      if (!userData) {
        alert('User not authenticated');
        return;
      }

      const user = JSON.parse(userData);
      
      const response = await fetch(`http://localhost:5001/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel booking');
      }

      alert('Booking cancelled successfully!');
      
      // Refresh bookings
      fetchUserBookings(user.id);
      
    } catch (error: any) {
      alert(error.message || 'Failed to cancel booking');
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <i className="ri-loader-4-line text-4xl text-gray-400 animate-spin"></i>
          </div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 flex items-center justify-center">
                <i className="ri-calendar-line text-xl text-black"></i>
              </div>
              <span className="text-black font-medium">Book</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <i className="ri-user-line text-xl text-gray-600"></i>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-black">{user.name}</p>
                <p className="text-xs text-gray-500">User</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <ProfileSidebar 
            user={user}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          {/* Main Content Area */}
          <div className="flex-1">
            {activeTab === 'bookings' && (
              <BookingsList 
                bookings={bookings}
                onWriteReview={handleWriteReview}
                onCancelBooking={handleCancelBooking}
                isLoading={isLoading}
                error={error}
              />
            )}
            
            {activeTab === 'edit-profile' && (
              <EditProfile 
                user={user}
                setUser={setUser}
                setActiveTab={setActiveTab}
              />
            )}
          </div>
        </div>
      </div>

      {/* Write Review Modal */}
      {showReviewModal && selectedBooking && (
        <WriteReview
          booking={selectedBooking}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleReviewSubmit}
        />
      )}
      
      <Footer />
    </div>
  );
}