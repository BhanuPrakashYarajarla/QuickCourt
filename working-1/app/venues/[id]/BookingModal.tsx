'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Court {
  id: number;
  name: string;
  sport_type: string;
  hourly_rate: number;
  status: string;
}

interface TimeSlot {
  id: number;
  court_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  venueId: number;
  venueName: string;
  onReviewSubmitted?: () => void; // Callback to refresh reviews
}

export default function BookingModal({ isOpen, onClose, venueId, venueName, onReviewSubmitted }: BookingModalProps) {
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [selectedCourt, setSelectedCourt] = useState<number | null>(null);
  const [showSportDropdown, setShowSportDropdown] = useState(false);
  const [showCourtDropdown, setShowCourtDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  
  const [courts, setCourts] = useState<Court[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [availableSports, setAvailableSports] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Review state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');

  // Get available dates (next 30 days)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  useEffect(() => {
    if (isOpen && venueId) {
      fetchCourts();
      setSelectedDate(getAvailableDates()[0]);
      // Reset rating and review when modal opens
      setRating(0);
      setHoverRating(0);
      setReview('');
    }
  }, [isOpen, venueId]);

  useEffect(() => {
    if (selectedDate && selectedCourt) {
      fetchTimeSlots();
    }
  }, [selectedDate, selectedCourt]);

  const fetchCourts = async () => {
    try {
      const response = await fetch(`http://localhost:5001/courts?facility_id=${venueId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch courts');
      }
      
      const data = await response.json();
      setCourts(data.courts);
      
      // Extract unique sports from courts
      const sports = [...new Set(data.courts.map((court: Court) => court.sport_type))] as string[];
      setAvailableSports(sports);
      if (sports.length > 0) {
        setSelectedSport(sports[0]);
      }
      
    } catch (error: any) {
      setError(error.message);
    }
  };

  const fetchTimeSlots = async () => {
    if (!selectedCourt || !selectedDate) return;
    
    try {
      const dayOfWeek = new Date(selectedDate).getDay();
      const response = await fetch(`http://localhost:5001/time-slots?court_id=${selectedCourt}&day_of_week=${dayOfWeek}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch time slots');
      }
      
      const data = await response.json();
      setTimeSlots(data.time_slots);
      
    } catch (error: any) {
      setError(error.message);
    }
  };

  const getAvailableTimeSlots = () => {
    if (!selectedCourt || !selectedDate) return [];
    
    const dayOfWeek = new Date(selectedDate).getDay();
    const courtTimeSlots = timeSlots.filter(slot => 
      slot.court_id === selectedCourt && 
      slot.day_of_week === dayOfWeek && 
      slot.is_available
    );
    
    return courtTimeSlots;
  };

  const calculateTotal = () => {
    if (!selectedCourt) return 0;
    const court = courts.find(c => c.id === selectedCourt);
    return court ? court.hourly_rate * duration : 0;
  };

  const handleBooking = async () => {
    if (!selectedCourt || !selectedDate || !startTime || !duration) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Submit review if provided
      if (rating > 0 && review.trim()) {
        console.log('Submitting review with rating:', rating, 'and review:', review);
        const userData = localStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          
          const reviewResponse = await fetch('http://localhost:5001/reviews', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: user.id,
              facility_id: venueId,
              rating: rating,
              review_text: review.trim()
            }),
          });

          if (!reviewResponse.ok) {
            console.error('Failed to submit review');
          } else {
            console.log('Review submitted successfully');
            // Notify parent component to refresh reviews
            if (onReviewSubmitted) {
              onReviewSubmitted();
              // Wait a moment for the reviews to refresh
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }
      } else {
        console.log('No review submitted - rating:', rating, 'review length:', review.length);
      }

      // Create booking
      const userData = localStorage.getItem('userData');
      if (!userData) {
        throw new Error('User not authenticated');
      }

      const user = JSON.parse(userData);
      const endTime = new Date(`2000-01-01T${startTime}`);
      endTime.setHours(endTime.getHours() + duration);
      const endTimeStr = endTime.toTimeString().slice(0, 5);

      const bookingResponse = await fetch('http://localhost:5001/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          court_id: selectedCourt,
          booking_date: selectedDate,
          start_time: startTime,
          end_time: endTimeStr,
          duration: duration,
          total_amount: calculateTotal(),
          payment_method: 'pay_at_venue',
          status: 'confirmed'
        }),
      });

      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      // Show success message
      if (rating > 0 && review.trim()) {
        alert('Review submitted successfully! Your review will appear on the venue page.');
      }
      
      alert('Booking successful! You can pay at the venue.');
      
      // Close modal and redirect
      onClose();
      router.push('/profile');
      
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Book {venueName}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Sport Selection */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">Sport</label>
            <div className="relative">
              <button
                onClick={() => setShowSportDropdown(!showSportDropdown)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <i className="ri-ping-pong-line w-5 h-5 flex items-center justify-center text-gray-600"></i>
                  <span className="text-gray-900 font-medium">{selectedSport || 'Select Sport'}</span>
                </div>
                <i className="ri-arrow-down-s-line w-5 h-5 flex items-center justify-center text-gray-400"></i>
              </button>
              
              {showSportDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  {availableSports.map((sport) => (
                    <button
                      key={sport}
                      onClick={() => {
                        setSelectedSport(sport);
                        setShowSportDropdown(false);
                        setSelectedCourt(null);
                      }}
                      className="w-full text-left px-4 py-3 text-gray-900 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg cursor-pointer flex items-center gap-2"
                    >
                      <i className="ri-ping-pong-line w-4 h-4 flex items-center justify-center text-gray-600"></i>
                      {sport}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Court Selection */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">Court</label>
            <div className="relative">
              <button
                onClick={() => setShowCourtDropdown(!showCourtDropdown)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors duration-200 cursor-pointer"
                disabled={!selectedSport}
              >
                <span className="text-gray-500">
                  {selectedCourt ? courts.find(c => c.id === selectedCourt)?.name : 'Select Court'}
                </span>
                <i className="ri-arrow-down-s-line w-5 h-5 flex items-center justify-center text-gray-400"></i>
              </button>
              
              {showCourtDropdown && selectedSport && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                  {courts
                    .filter(court => court.sport_type === selectedSport && court.status === 'active')
                    .map((court) => (
                      <button
                        key={court.id}
                        onClick={() => {
                          setSelectedCourt(court.id);
                          setShowCourtDropdown(false);
                        }}
                        className="w-full text-left px-4 py-3 text-gray-900 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg cursor-pointer"
                      >
                        <div className="flex justify-between items-center">
                          <span>{court.name}</span>
                          <span className="text-green-600 font-medium">₹{court.hourly_rate}/hr</span>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">Date</label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getAvailableDates()[0]}
                max={getAvailableDates()[getAvailableDates().length - 1]}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-400 cursor-pointer"
              />
              <i className="ri-calendar-line absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 pointer-events-none"></i>
            </div>
          </div>

          {/* Time Selection */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">Start Time</label>
            <div className="relative">
              <button
                onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors duration-200 cursor-pointer"
                disabled={!selectedCourt || !selectedDate}
              >
                <span className="text-gray-500">
                  {startTime ? startTime : 'Select Time'}
                </span>
                <i className="ri-arrow-down-s-line w-5 h-5 flex items-center justify-center text-gray-400"></i>
              </button>
              
              {showTimeDropdown && selectedCourt && selectedDate && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                  {getAvailableTimeSlots().map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => {
                        setStartTime(slot.start_time);
                        setShowTimeDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 text-gray-900 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg cursor-pointer"
                    >
                      {slot.start_time} - {slot.end_time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">Duration</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setDuration(Math.max(1, duration - 1))}
                className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200"
              >
                <i className="ri-subtract-line w-5 h-5 flex items-center justify-center"></i>
              </button>
              <span className="text-xl font-semibold text-gray-900 min-w-[60px] text-center">
                {duration} Hr
              </span>
              <button
                onClick={() => setDuration(duration + 1)}
                className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200"
              >
                <i className="ri-add-line w-5 h-5 flex items-center justify-center"></i>
              </button>
            </div>
          </div>

          {/* Review Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review (Optional)</h3>
            <div className="space-y-4">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="space-y-3">
                  {/* Range Slider */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 min-w-[60px]">1</span>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={rating || 0}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        console.log('Rating changed to:', value);
                        setRating(value);
                      }}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${(rating || 0) * 20}%, #e5e7eb ${(rating || 0) * 20}%, #e5e7eb 100%)`
                      }}
                    />
                    <span className="text-sm text-gray-500 min-w-[60px]">5</span>
                  </div>
                  
                  {/* Rating Display */}
                  <div className="text-center">
                    <span className="text-2xl font-bold text-yellow-500">
                      {rating || '?'}
                    </span>
                    <span className="text-lg text-gray-600 ml-2">/ 5</span>
                    {rating > 0 && (
                      <div className="mt-1 text-sm text-gray-700">
                        {rating === 1 && 'Poor'}
                        {rating === 2 && 'Fair'}
                        {rating === 3 && 'Good'}
                        {rating === 4 && 'Very Good'}
                        {rating === 5 && 'Excellent'}
                      </div>
                    )}
                  </div>
                  
                  {/* Quick Rating Buttons */}
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => {
                          console.log('Quick rating clicked:', star);
                          setRating(star);
                        }}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                          rating === star
                            ? 'bg-yellow-400 text-white shadow-md scale-105'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {star}
                      </button>
                    ))}
                  </div>
                  
                  {/* Clear Rating Button */}
                  {rating > 0 && (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setRating(0);
                          setHoverRating(0);
                        }}
                        className="text-xs text-red-500 hover:text-red-700 underline"
                      >
                        Clear Rating
                      </button>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  Current rating: {rating > 0 ? `${rating}/5 stars` : 'No rating selected'}
                </p>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review</label>
                <textarea
                  value={review}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setReview(e.target.value);
                    }
                  }}
                  placeholder="Share your experience with this venue..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-400 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {review.length}/500 characters
                </p>
              </div>
            </div>
          </div>

          {/* Total and Payment */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
              <span className="text-2xl font-bold text-green-600">₹{calculateTotal().toFixed(2)}</span>
            </div>
            
            <div className="text-sm text-gray-600 mb-4">
              <p>Payment Method: <span className="font-medium text-gray-900">Pay at Venue</span></p>
              <p>You can pay the amount when you arrive at the venue.</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleBooking}
              disabled={!selectedCourt || !selectedDate || !startTime || isLoading}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
                selectedCourt && selectedDate && startTime && !isLoading
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? 'Processing...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 