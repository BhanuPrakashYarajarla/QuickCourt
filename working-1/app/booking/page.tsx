
'use client';
import Header from '../../components/Header';
import { useState } from 'react';

export default function BookingPage() {
  const [selectedSport, setSelectedSport] = useState('Badminton');
  const [selectedDate, setSelectedDate] = useState('2025-05-06');
  const [startTime, setStartTime] = useState('01:00 PM');
  const [duration, setDuration] = useState(2);
  const [selectedCourts, setSelectedCourts] = useState<string[]>([]);
  const [showSportDropdown, setShowSportDropdown] = useState(false);
  const [showCourtDropdown, setShowCourtDropdown] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');

  const sports = ['Badminton', 'Table Tennis', 'Box Cricket'];
  const courts = ['Table 1', 'Table 2', 'Court A', 'Court B', 'Court C'];

  const toggleCourt = (court: string) => {
    setSelectedCourts(prev => 
      prev.includes(court) 
        ? prev.filter(c => c !== court)
        : [...prev, court]
    );
  };

  const removeCourt = (court: string) => {
    setSelectedCourts(prev => prev.filter(c => c !== court));
  };

  const calculateTotal = () => {
    const basePrice = 600;
    return basePrice * duration * selectedCourts.length;
  };

  const handleContinueToPayment = async () => {
    if (selectedCourts.length === 0) {
      alert('Please select at least one court');
      return;
    }

    // Submit review if provided
    if (rating > 0 && review.trim()) {
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          
          // For demo purposes, using facility ID 1
          const reviewResponse = await fetch('http://localhost:5001/reviews', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: user.id,
              facility_id: 1, // This should come from the venue data
              rating: rating,
              review_text: review.trim()
            }),
          });

          if (reviewResponse.ok) {
            console.log('Review submitted successfully');
          }
        }
      } catch (error) {
        console.error('Failed to submit review:', error);
      }
    }

    // Continue with payment logic
    alert('Proceeding to payment...');
    // Here you would typically redirect to payment page or process payment
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">Court Booking</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Venue Info */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-2">SBR Badminton</h2>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-1">
                <i className="ri-map-pin-line w-4 h-4 flex items-center justify-center text-red-500"></i>
                <span>Satellite, Jodhpur Village</span>
              </div>
              <div className="flex items-center gap-1">
                <i className="ri-star-fill w-4 h-4 flex items-center justify-center text-yellow-400"></i>
                <span className="font-semibold text-black">4.5</span>
                <span>(6)</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Sport Selection */}
            <div>
              <label className="block text-lg font-semibold text-black mb-3">Sport</label>
              <div className="relative">
                <button
                  onClick={() => setShowSportDropdown(!showSportDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <i className="ri-ping-pong-line w-5 h-5 flex items-center justify-center text-gray-600"></i>
                    <span className="text-black font-medium">{selectedSport}</span>
                  </div>
                  <i className="ri-arrow-down-s-line w-5 h-5 flex items-center justify-center text-gray-400"></i>
                </button>
                
                {showSportDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                    {sports.map((sport) => (
                      <button
                        key={sport}
                        onClick={() => {
                          setSelectedSport(sport);
                          setShowSportDropdown(false);
                        }}
                        className="w-full text-left px-4 py-3 text-black hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg cursor-pointer flex items-center gap-2"
                      >
                        <i className="ri-ping-pong-line w-4 h-4 flex items-center justify-center text-gray-600"></i>
                        {sport}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-lg font-semibold text-black mb-3">Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-black focus:outline-none focus:border-gray-400 cursor-pointer"
                />
                <i className="ri-calendar-line absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 pointer-events-none"></i>
              </div>
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-lg font-semibold text-black mb-3">Start Time</label>
              <div className="relative">
                <input
                  type="time"
                  value="13:00"
                  onChange={(e) => {
                    const time = e.target.value;
                    const [hours, minutes] = time.split(':');
                    const hour12 = parseInt(hours) > 12 ? parseInt(hours) - 12 : parseInt(hours);
                    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
                    setStartTime(`${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`);
                  }}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-black focus:outline-none focus:border-gray-400 cursor-pointer"
                />
                <i className="ri-time-line absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 pointer-events-none"></i>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-lg font-semibold text-black mb-3">Duration</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setDuration(Math.max(1, duration - 1))}
                  className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200"
                >
                  <i className="ri-subtract-line w-5 h-5 flex items-center justify-center"></i>
                </button>
                <span className="text-xl font-semibold text-black min-w-[60px] text-center">
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

            {/* Court Selection */}
            <div>
              <label className="block text-lg font-semibold text-black mb-3">Court</label>
              <div className="relative">
                <button
                  onClick={() => setShowCourtDropdown(!showCourtDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors duration-200 cursor-pointer"
                >
                  <span className="text-gray-500">
                    {selectedCourts.length === 0 ? '--Select Court--' : `${selectedCourts.length} court(s) selected`}
                  </span>
                  <i className="ri-arrow-down-s-line w-5 h-5 flex items-center justify-center text-gray-400"></i>
                </button>
                
                {showCourtDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                    {courts.map((court) => (
                      <label
                        key={court}
                        className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCourts.includes(court)}
                          onChange={() => toggleCourt(court)}
                          className="w-4 h-4 text-green-500 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="ml-3 text-black">{court}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Selected Courts Tags */}
              {selectedCourts.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {selectedCourts.map((court) => (
                    <div
                      key={court}
                      className="bg-gray-100 text-black px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      <span>{court}</span>
                      <button
                        onClick={() => removeCourt(court)}
                        className="w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded-full cursor-pointer"
                      >
                        <i className="ri-close-line w-3 h-3 flex items-center justify-center"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Review Section */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">Write a Review</h3>
              <div className="space-y-4">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="text-2xl text-gray-300 hover:text-yellow-400 transition-colors duration-200"
                      >
                        <i className={`ri-star-${star <= (hoverRating || rating) ? 'fill' : 'line'}`}></i>
                      </button>
                    ))}
                    {rating > 0 && (
                      <span className="ml-2 text-sm text-gray-600">
                        {rating === 1 && 'Poor'}
                        {rating === 2 && 'Fair'}
                        {rating === 3 && 'Good'}
                        {rating === 4 && 'Very Good'}
                        {rating === 5 && 'Excellent'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Review</label>
                  <textarea
                    value={review}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        setReview(e.target.value);
                      }
                    }}
                    placeholder="Share your experience with this venue..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-black focus:outline-none focus:border-gray-400 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {review.length}/500 characters
                  </p>
                </div>
              </div>
            </div>

            {/* Continue to Payment Button */}
            <div className="pt-6">
              <button 
                className={`w-full py-4 rounded-xl font-semibold text-lg cursor-pointer whitespace-nowrap transition-all duration-200 ${
                  selectedCourts.length > 0 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                disabled={selectedCourts.length === 0}
                onClick={handleContinueToPayment}
              >
                Continue to Payment - ₹{calculateTotal().toFixed(2)}
              </button>
              
              {/* Review Note */}
              {rating > 0 && review.trim() && (
                <p className="text-sm text-green-600 text-center mt-2">
                  ✓ Review will be submitted with your booking
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
