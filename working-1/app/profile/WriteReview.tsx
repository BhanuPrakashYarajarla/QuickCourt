'use client';
import { useState } from 'react';

interface WriteReviewProps {
  booking: {
    id: number;
    venueName: string;
    sport: string;
    date: string;
    time: string;
    location: string;
    status: string;
    hasReview: boolean;
  };
  onClose: () => void;
  onSubmit: (reviewData: any) => void;
}

export default function WriteReview({ booking, onClose, onSubmit }: WriteReviewProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    if (review.trim().length < 10) {
      alert('Please write at least 10 characters for your review');
      return;
    }

    onSubmit({
      rating,
      review: review.trim(),
      date: new Date().toLocaleDateString()
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-black">Write a Review</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black cursor-pointer"
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <i className="ri-close-line text-xl"></i>
            </div>
          </button>
        </div>

        {/* Booking Details */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center mb-3">
            <div className="w-6 h-6 flex items-center justify-center mr-2">
              <i className="ri-gamepad-line text-lg text-orange-600"></i>
            </div>
            <h3 className="text-lg font-semibold text-black">
              {booking.venueName} ({booking.sport})
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 flex items-center justify-center mr-2">
                <i className="ri-calendar-line text-red-500"></i>
              </div>
              <span className="text-gray-600">{booking.date}</span>
            </div>

            <div className="flex items-center">
              <div className="w-4 h-4 flex items-center justify-center mr-2">
                <i className="ri-time-line text-red-500"></i>
              </div>
              <span className="text-gray-600">{booking.time}</span>
            </div>

            <div className="flex items-center col-span-2">
              <div className="w-4 h-4 flex items-center justify-center mr-2">
                <i className="ri-map-pin-line text-red-500"></i>
              </div>
              <span className="text-gray-600">{booking.location}</span>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-black mb-3">Rating</label>
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
                    onClick={() => setRating(star)}
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
            </div>
          </div>

          {/* Review Text */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-black mb-2">Your Review</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={5}
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black resize-none"
              placeholder="Share your experience with this venue..."
              required
            />
            <div className="flex justify-between mt-2">
              <p className="text-sm text-gray-500">Minimum 10 characters</p>
              <p className="text-sm text-gray-500">{review.length}/500</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-semibold cursor-pointer whitespace-nowrap"
            >
              Submit Review
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-semibold cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}