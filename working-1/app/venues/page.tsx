'use client';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Venue {
  id: number;
  name: string;
  primary_photo: string;
  sports: string[];
  location: string;
  city: string;
  amenities: string[];
  created_at: string;
  owner_name: string;
  reviews: {
    average_rating: number;
    total_reviews: number;
  };
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedAmenity, setSelectedAmenity] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [priceRange, setPriceRange] = useState('all');
  const [minRating, setMinRating] = useState(0);

  const availableCities = ['Ahmedabad', 'Bangalore', 'Delhi', 'Mumbai', 'Hyderabad'];
  const priceRanges = [
    { value: 'all', label: 'Any Price' },
    { value: '0-500', label: '₹0 - ₹500' },
    { value: '500-1000', label: '₹500 - ₹1000' },
    { value: '1000-1500', label: '₹1000 - ₹1500' },
    { value: '1500+', label: '₹1500+' }
  ];

  useEffect(() => {
    fetchVenues();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [venues, searchTerm, selectedSport, selectedCity, selectedAmenity, sortBy, priceRange, minRating]);

  const fetchVenues = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // First check if backend is running
      try {
        const healthResponse = await fetch('http://localhost:5001/health');
        if (!healthResponse.ok) {
          throw new Error('Backend is not responding');
        }
      } catch (healthError) {
        throw new Error('Cannot connect to backend server. Please ensure the Flask server is running on port 5001.');
      }
      
      const response = await fetch('http://localhost:5001/facilities');
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch venues: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.facilities || !Array.isArray(data.facilities)) {
        throw new Error('Invalid data format received from backend');
      }
      
      // Transform facilities data to match venue format
      const transformedVenues = data.facilities.map((facility: any) => {
        // Get primary photo from photos array (backend returns 'photos' with 'url' property)
        const primaryPhoto = facility.photos && facility.photos.length > 0 
          ? facility.photos.find((photo: any) => photo.is_primary)?.url || facility.photos[0].url
          : 'https://readdy.ai/api/search-image?query=sports%20facility%20exterior%20modern%20architecture%20professional%20venue&width=400&height=300&seq=default&orientation=landscape';
        
        // Get sports from sports array (backend returns 'sports')
        const sports = facility.sports || [];
        
        return {
          id: facility.id,
          name: facility.name,
          primary_photo: primaryPhoto,
          sports: sports,
          location: facility.location || `${facility.city}`,
          city: facility.city,
          amenities: facility.amenities || ['Parking', 'Restrooms', 'WiFi'],
          created_at: facility.created_at,
          owner_name: facility.owner_name || 'Unknown Owner',
          reviews: facility.reviews || {
            average_rating: 0,
            total_reviews: 0
          }
        };
      });
      
      setVenues(transformedVenues);
      
    } catch (error: any) {
      setError(error.message || 'Failed to fetch venues');
      
      // Show sample data if backend is not available
      if (error.message.includes('Cannot connect to backend')) {
        const sampleVenues = [
          {
            id: 1,
            name: 'SBR Badminton',
            primary_photo: 'https://readdy.ai/api/search-image?query=badminton%20court%20interior%20modern%20sports%20facility&width=400&height=300&seq=sample1&orientation=landscape',
            sports: ['Badminton', 'Table Tennis'],
            location: 'Satellite, Jodhpur Village',
            city: 'Ahmedabad',
            amenities: ['Parking', 'Restrooms', 'WiFi'],
            created_at: '2024-01-01',
            owner_name: 'SBR Sports',
            reviews: { average_rating: 4.5, total_reviews: 12 }
          },
          {
            id: 2,
            name: 'Elite Tennis Club',
            primary_photo: 'https://readdy.ai/api/search-image?query=tennis%20court%20outdoor%20professional%20sports%20facility&width=400&height=300&seq=sample2&orientation=landscape',
            sports: ['Tennis'],
            location: 'Bodakdev, SG Road',
            city: 'Ahmedabad',
            amenities: ['Parking', 'Restrooms', 'Pro Shop'],
            created_at: '2024-01-02',
            owner_name: 'Elite Sports',
            reviews: { average_rating: 4.8, total_reviews: 8 }
          }
        ];
        setVenues(sampleVenues);
        setError('Backend not available - showing sample data. Please start the Flask server to see real data.');
      } else {
        setVenues([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...venues];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(venue =>
        venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sport filter
    if (selectedSport !== 'all') {
      filtered = filtered.filter(venue =>
        venue.sports.includes(selectedSport)
      );
    }

    // City filter
    if (selectedCity !== 'all') {
      filtered = filtered.filter(venue =>
        venue.city === selectedCity
      );
    }

    // Amenity filter
    if (selectedAmenity !== 'all') {
      filtered = filtered.filter(venue =>
        venue.amenities.includes(selectedAmenity)
      );
    }

    // Rating filter
    if (minRating > 0) {
      filtered = filtered.filter(venue => venue.reviews.average_rating >= minRating);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'location':
          return a.location.localeCompare(b.location);
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredVenues(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSport('all');
    setSelectedCity('all');
    setSelectedAmenity('all');
    setSortBy('name');
    setPriceRange('all');
    setMinRating(0);
  };

  // Get unique values for filter options
  const allSports = Array.from(new Set(venues.flatMap(venue => venue.sports)));
  const allCities = Array.from(new Set(venues.map(venue => venue.city)));
  const allAmenities = Array.from(new Set(venues.flatMap(venue => venue.amenities)));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i}>
                  <div className="bg-gray-200 h-64 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-black text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Discover Amazing
            <br />
            <span className="text-gray-300">Sports Venues</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Find the perfect venue for your next game, from world-class stadiums to local sports complexes
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mt-8">
            <div className="relative">
              <i className="ri-search-line absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 flex items-center justify-center"></i>
              <input
                type="text"
                placeholder="Search venues by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white text-black rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Filters</h3>
              
              {/* Sport Type Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sport Type</label>
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900"
                >
                  <option value="all">All Sports</option>
                  <option value="Badminton">Badminton</option>
                  <option value="Football">Football</option>
                  <option value="Cricket">Cricket</option>
                  <option value="Swimming">Swimming</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Table Tennis">Table Tennis</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Volleyball">Volleyball</option>
                </select>
              </div>

              {/* City Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900"
                >
                  <option value="all">All Cities</option>
                  <option value="Ahmedabad">Ahmedabad</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
              </div>

              {/* Price Range Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900"
                >
                  <option value="all">Any Price</option>
                  <option value="0-500">₹0 - ₹500</option>
                  <option value="500-1000">₹500 - ₹1000</option>
                  <option value="1000-1500">₹1000 - ₹1500</option>
                  <option value="1500-2000">₹1500 - ₹2000</option>
                  <option value="2000+">₹2000+</option>
                </select>
              </div>

              {/* Indoor/Outdoor Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={selectedAmenity}
                  onChange={(e) => setSelectedAmenity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900"
                >
                  <option value="all">All Types</option>
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900"
                >
                  <option value="0">Any Rating</option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4.0">4.0+ Stars</option>
                  <option value="3.5">3.5+ Stars</option>
                  <option value="3.0">3.0+ Stars</option>
                </select>
              </div>

              {/* Sort Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900"
                >
                  <option value="name">Name</option>
                  <option value="location">Location</option>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="w-full bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
              >
                Clear All Filters
              </button>

              {/* Results Count */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  {filteredVenues.length} of {venues.length} venues
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                <p>Error loading venues: {error}</p>
                <p className="text-sm">Showing sample data instead</p>
              </div>
            )}

            {/* Venues Grid */}
            {filteredVenues.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <i className="ri-building-line text-4xl text-gray-400"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No venues found</h3>
                <p className="text-gray-600 mb-6">
                  {venues.length === 0 
                    ? "No venues have been added yet. Be the first to add a sports facility in your area!"
                    : "Try adjusting your filters or search terms"
                  }
                </p>
                {venues.length === 0 && (
                  <Link
                    href="/facilitator"
                    className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
                  >
                    Add Your First Venue
                  </Link>
                )}
                {venues.length > 0 && (
                  <button
                    onClick={clearFilters}
                    className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredVenues.map((venue) => (
                  <div key={venue.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer">
                    {/* Venue Image */}
                    <div className="relative h-48 bg-gray-100">
                                        {venue.primary_photo && venue.primary_photo.startsWith('http') ? (
                    <img
                      src={venue.primary_photo}
                      alt={venue.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to default image if remote image fails
                        e.currentTarget.src = 'https://readdy.ai/api/search-image?query=sports%20facility%20exterior%20modern%20architecture%20professional%20venue&width=400&height=300&seq=default&orientation=landscape';
                      }}
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
                      
                      {/* Sports Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {venue.sports.slice(0, 3).map((sport, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            {sport}
                          </span>
                        ))}
                        {venue.sports.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{venue.sports.length - 3} more
                          </span>
                        )}
                      </div>
                      
                      {/* Reviews Summary */}
                      {venue.reviews && venue.reviews.total_reviews > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-sm ${
                                  star <= Math.round(venue.reviews.average_rating) 
                                    ? 'text-yellow-400' 
                                    : 'text-gray-300'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            {venue.reviews.total_reviews} review{venue.reviews.total_reviews !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/venues/${venue.id}`}
                          className="text-black hover:text-gray-700 text-sm font-medium"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
