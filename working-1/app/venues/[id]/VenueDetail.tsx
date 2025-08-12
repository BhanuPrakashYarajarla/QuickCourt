
'use client';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import BookingModal from './BookingModal';

interface Review {
  id: number;
  user_id: number;
  facility_id: number;
  rating: number;
  review_text: string;
  created_at: string;
  user_name: string;
}

interface Facility {
  id: number;
  name: string;
  description: string;
  city: string;
  state: string;
  address: string;
  operating_hours: string;
  photos: Array<{
    url: string;
    is_primary: boolean;
  }>;
  facility_courts: Array<{
    sport_type: string;
    court_count: number;
  }>;
  amenities: string[];
  owner_name: string;
  created_at: string;
}

export default function VenueDetail({ venueId }: { venueId: string }) {
  const [facility, setFacility] = useState<Facility | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  // Review form state
  const [canReview, setCanReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Get current user from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    fetchFacilityDetails();
    fetchVenueReviews();
    fetchVenueReviewsStats();
  }, [venueId]);

  useEffect(() => {
    if (currentUser && facility) {
      checkIfUserCanReview();
    }
  }, [currentUser, facility]);

  const fetchFacilityDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/facilities/${venueId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch facility details');
      }
      
      const data = await response.json();
      setFacility(data.facility);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch facility details');
    } finally {
      setLoading(false);
    }
  };

  const fetchVenueReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await fetch(`http://localhost:5001/reviews/facility/${venueId}`);
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (err: any) {
      setReviewsError('Failed to fetch reviews');
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchVenueReviewsStats = async () => {
    try {
      const response = await fetch(`http://localhost:5001/reviews/facility/${venueId}/stats`);
      
      if (response.ok) {
        const data = await response.json();
        setAverageRating(data.average_rating || 0);
        setTotalReviews(data.total_reviews || 0);
      }
    } catch (err: any) {
      // Ignore stats errors
    }
  };

  const checkIfUserCanReview = async () => {
    if (!currentUser || !facility) {
      setCanReview(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/reviews/can-review/${facility.id}?user_id=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setCanReview(data.can_review);
      } else {
        setCanReview(false);
      }
    } catch (err: any) {
      setCanReview(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!currentUser || !facility || reviewRating === 0 || !reviewText.trim()) {
      alert('Please provide both rating and review text');
      return;
    }

    setSubmittingReview(true);
    try {
      const response = await fetch('http://localhost:5001/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          facility_id: facility.id,
          rating: reviewRating,
          review_text: reviewText.trim(),
        }),
      });

      if (response.ok) {
        // Refresh reviews after successful submission
        await fetchVenueReviews();
        await fetchVenueReviewsStats();
        setShowReviewForm(false);
        setReviewRating(0);
        setReviewText('');
        alert('Review submitted successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to submit review: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Failed to submit review: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-lg ${
          i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'
        }`}
      >
        ★
      </span>
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <i className="ri-error-warning-line text-4xl text-red-400"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to load venue</h3>
            <p className="text-gray-600 mb-6">{error || 'Venue not found'}</p>
            <Link
              href="/venues"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Back to Venues
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Get primary photo - handle both local and remote URLs
  let primaryPhoto = 'https://readdy.ai/api/search-image?query=sports%20facility%20exterior%20modern%20architecture%20professional%20venue&width=800&height=400&seq=default&orientation=landscape';
  
  if (facility.photos && facility.photos.length > 0) {
    const photo = facility.photos.find(photo => photo.is_primary) || facility.photos[0];
    if (photo && photo.url) {
      primaryPhoto = photo.url;
    }
  }

  // Transform facility courts to sports format
  const sports = facility.facility_courts.map(court => ({
    name: court.sport_type,
    icon: 'ri-basketball-line', // Default icon
    pricing: {
      title: `${court.sport_type} Court`,
      weekdays: [
        { time: '07:00 AM - 11:00 PM', price: 'INR 500.0 / hour' }
      ],
      weekends: [
        { time: '07:00 AM - 11:00 PM', price: 'INR 600.0 / hour' }
      ],
      holidays: [
        { time: '07:00 AM - 11:00 PM', price: 'INR 600.0 / hour' }
      ]
    }
  }));

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <div className="relative h-96 bg-gray-100">
        {primaryPhoto && primaryPhoto.startsWith('http') ? (
          <img
            src={primaryPhoto}
            alt={facility.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to default image if remote image fails
              e.currentTarget.src = 'https://readdy.ai/api/search-image?query=sports%20facility%20exterior%20modern%20architecture%20professional%20venue&width=800&height=400&seq=default&orientation=landscape';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <i className="ri-image-line text-6xl text-gray-400"></i>
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        {/* Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
            <h1 className="text-5xl font-bold mb-4">{facility.name}</h1>
            <p className="text-xl text-gray-300 max-w-3xl">
              {facility.description || 'Professional sports facility with multiple courts and amenities'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Venue</h2>
              <p className="text-gray-700 leading-relaxed">
                {facility.description || 'A professional sports facility offering multiple courts and amenities for various sports activities.'}
              </p>
            </div>

            {/* Sports & Pricing */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Sports & Pricing</h2>
              <div className="space-y-6">
                {sports.map((sport, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <i className={`${sport.icon} text-2xl text-black`}></i>
                      <h3 className="text-xl font-semibold text-gray-900">{sport.name}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Weekdays</h4>
                        {sport.pricing.weekdays.map((timeSlot, idx) => (
                          <div key={idx} className="text-sm text-gray-600">
                            <div>{timeSlot.time}</div>
                            <div className="font-medium text-gray-900">{timeSlot.price}</div>
                          </div>
                        ))}
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Weekends</h4>
                        {sport.pricing.weekends.map((timeSlot, idx) => (
                          <div key={idx} className="text-sm text-gray-600">
                            <div>{timeSlot.time}</div>
                            <div className="font-medium text-gray-900">{timeSlot.price}</div>
                          </div>
                        ))}
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Holidays</h4>
                        {sport.pricing.holidays.map((timeSlot, idx) => (
                          <div key={idx} className="text-sm text-gray-600">
                            <div>{timeSlot.time}</div>
                            <div className="font-medium text-gray-900">{timeSlot.price}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {facility.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center gap-2 text-gray-700">
                    <i className="ri-check-line text-black"></i>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews & Ratings</h2>
              
              {/* Overall Rating */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
                    <div className="flex items-center gap-1 mb-2">
                      {renderStars(averageRating)}
                    </div>
                    <div className="text-sm text-gray-600">{totalReviews} reviews</div>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-700">
                      {totalReviews > 0 
                        ? 'Based on reviews from our community'
                        : 'Be the first to review this venue!'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Individual Reviews */}
              {reviewsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading reviews...</p>
                </div>
              ) : reviewsError ? (
                <div className="text-center py-8">
                  <p className="text-red-600">{reviewsError}</p>
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <i className="ri-user-line text-gray-600"></i>
                      </div>
                          <span className="font-medium text-gray-900">{review.user_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">{review.review_text}</p>
                      <div className="text-sm text-gray-500">{formatDate(review.created_at)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <i className="ri-star-line text-4xl text-gray-400"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No reviews yet</h3>
                  <p className="text-gray-500">Be the first to share your experience with this venue!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <i className="ri-map-pin-line text-gray-500"></i>
                  <div>
                    <div className="font-medium text-gray-900">{facility.city}, {facility.state}</div>
                    <div className="text-sm text-gray-600">{facility.address}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <i className="ri-time-line text-gray-500"></i>
                  <div>
                    <div className="font-medium text-gray-900">Operating Hours</div>
                    <div className="text-sm text-gray-600">{facility.operating_hours || '7:00 AM - 11:00 PM'}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <i className="ri-user-line text-gray-500"></i>
                  <div>
                    <div className="font-medium text-gray-900">Owner</div>
                    <div className="text-sm text-gray-600">{facility.owner_name}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking CTA */}
            <div className="bg-black rounded-lg p-6 text-white text-center">
              <h3 className="text-xl font-semibold mb-2">Ready to Book?</h3>
              <p className="text-gray-300 mb-4">Reserve your court now and enjoy your game!</p>
              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
              >
                Book This Venue
              </button>
            </div>

            {/* Review Form */}
            {canReview && !showReviewForm && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>
                <p className="text-sm text-gray-600 mb-4">Share your experience with this venue</p>
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="w-full bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
                >
                  Write Review
                </button>
              </div>
            )}

            {!canReview && currentUser && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>
                <p className="text-sm text-gray-600 mb-4">
                  You need to complete a booking at this venue before you can write a review.
                </p>
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="w-full bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
                >
                  Book Now
                </button>
              </div>
            )}

            {!currentUser && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Sign in and complete a booking to write a review for this venue.
                </p>
                <Link
                  href="/login"
                  className="block w-full bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium text-center"
                >
                  Sign In
                </Link>
              </div>
            )}

            {showReviewForm && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>
                
                {/* Rating Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`text-2xl ${
                          star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'
                        } hover:text-yellow-400 transition-colors`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Review</label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience with this venue..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900"
                    rows={4}
                    maxLength={500}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {reviewText.length}/500 characters
                  </div>
                </div>

                {/* Submit/Cancel Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmitReview}
                    disabled={submittingReview || reviewRating === 0 || !reviewText.trim()}
                    className="flex-1 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    onClick={() => {
                      setShowReviewForm(false);
                      setReviewRating(0);
                      setReviewText('');
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          isOpen={showBookingModal}
          venueId={parseInt(venueId)}
          venueName={facility?.name || ''}
          onClose={() => setShowBookingModal(false)}
          onReviewSubmitted={fetchVenueReviews}
        />
      )}

      <Footer />
    </div>
  );
}
