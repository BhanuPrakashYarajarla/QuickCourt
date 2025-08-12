
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Venue {
  id: number;
  name: string;
  primary_photo: string;
  sports: string[];
  location: string;
  city: string;
  amenities: string[];
  created_at: string;
  reviews?: {
    total_reviews: number;
    average_rating: number;
  };
}

export default function PopularVenues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch('http://localhost:5001/facilities');
      
      if (!response.ok) {
        throw new Error('Failed to fetch venues');
      }
      
      const data = await response.json();
      
      // Transform facilities data to match venue format
      const transformedVenues = data.facilities.map((facility: any) => {
        // Get primary photo from photos array
        const primaryPhoto = facility.photos && facility.photos.length > 0 
          ? facility.photos.find((photo: any) => photo.is_primary)?.url || facility.photos[0].url
          : 'https://readdy.ai/api/search-image?query=sports%20facility%20exterior%20modern%20architecture%20professional%20venue&width=400&height=300&seq=default&orientation=landscape';
        
        return {
          id: facility.id,
          name: facility.name,
          primary_photo: primaryPhoto,
          sports: facility.sports || [],
          location: facility.location,
          city: facility.city,
          amenities: facility.amenities || [],
          created_at: facility.created_at,
          reviews: facility.reviews || undefined, // Assuming facility.reviews is available from the backend
        };
      });
      
      setVenues(transformedVenues);
      
    } catch (error: any) {
      setError(error.message || 'Failed to fetch venues');
      setVenues([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Venues</h2>
          <p className="text-lg text-gray-600">Discover amazing sports facilities in your area</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-64 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <i className="ri-error-warning-line text-4xl text-red-400"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error loading venues</h3>
            <p className="text-gray-600">{error}</p>
          </div>
        ) : venues.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <i className="ri-building-line text-4xl text-gray-400"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No venues available yet</h3>
            <p className="text-gray-600">Be the first to add a sports facility in your area!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {venues.slice(0, 6).map((venue) => (
              <div key={venue.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                {/* Venue Image */}
                <div className="relative h-48 bg-gray-100">
                  {venue.primary_photo ? (
                    <img
                      src={`http://localhost:5001/static/facility_photos/${venue.primary_photo}`}
                      alt={venue.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="ri-image-line text-4xl text-gray-400"></i>
                    </div>
                  )}
                  
                  {/* Rating Badge */}
                  {venue.reviews && venue.reviews.total_reviews > 0 && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm font-medium text-gray-900">
                        {venue.reviews.average_rating.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({venue.reviews.total_reviews})
                      </span>
                    </div>
                  )}
                </div>

                {/* Venue Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                    {venue.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {venue.location}
                  </p>
                  
                  {/* Reviews Summary */}
                  {venue.reviews && venue.reviews.total_reviews > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-sm ${
                              star <= Math.round(venue.reviews?.average_rating || 0) 
                                ? 'text-yellow-400' 
                                : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {venue.reviews?.total_reviews} review{venue.reviews?.total_reviews !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  
                  <Link
                    href={`/venues/${venue.id}`}
                    className="text-black hover:text-gray-700 text-sm font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
