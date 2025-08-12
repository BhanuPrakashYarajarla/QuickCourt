'use client';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useState } from 'react';

const allSports = [
  {
    id: 1,
    name: 'Badminton',
    description: 'Professional courts with world-class facilities and premium equipment',
    venues: 45,
    players: '12k+',
    image: 'professional badminton player in action on indoor court with dramatic blue lighting, sports photography, modern facility with wooden floors',
    trending: true,
    category: 'Indoor',
    difficulty: 'Beginner to Pro',
    equipment: 'Available',
    avgPrice: 800
  },
  {
    id: 2,
    name: 'Football',
    description: 'FIFA standard pitches and 5-a-side courts for all skill levels',
    venues: 32,
    players: '8.5k+',
    image: 'professional football field with green grass and goal posts, modern stadium with dramatic lighting, sports photography',
    trending: true,
    category: 'Outdoor',
    difficulty: 'All Levels',
    equipment: 'Provided',
    avgPrice: 1200
  },
  {
    id: 3,
    name: 'Cricket',
    description: 'International standard grounds with all professional facilities',
    venues: 28,
    players: '15k+',
    image: 'professional cricket stadium at sunset with dramatic orange lighting, cricket field with wickets, sports photography',
    trending: true,
    category: 'Outdoor',
    difficulty: 'Intermediate to Pro',
    equipment: 'Rental Available',
    avgPrice: 2500
  },
  {
    id: 4,
    name: 'Swimming',
    description: 'Olympic-size pools with professional training and coaching available',
    venues: 18,
    players: '6k+',
    image: 'professional swimmer underwater in clear blue pool with dramatic lighting, olympic swimming facility, sports photography',
    trending: false,
    category: 'Indoor',
    difficulty: 'All Levels',
    equipment: 'Not Required',
    avgPrice: 600
  },
  {
    id: 5,
    name: 'Tennis',
    description: 'Clay and hard courts for recreational and competitive play',
    venues: 25,
    players: '4.2k+',
    image: 'professional tennis player serving on clay court with dramatic golden lighting, tennis facility, sports photography',
    trending: false,
    category: 'Outdoor',
    difficulty: 'Beginner to Pro',
    equipment: 'Rental Available',
    avgPrice: 1000
  },
  {
    id: 6,
    name: 'Table Tennis',
    description: 'Premium tables in air-conditioned environments with coaching',
    venues: 22,
    players: '3.8k+',
    image: 'professional table tennis player in action with dramatic lighting, modern indoor facility, sports photography',
    trending: false,
    category: 'Indoor',
    difficulty: 'All Levels',
    equipment: 'Provided',
    avgPrice: 400
  },
  {
    id: 7,
    name: 'Basketball',
    description: 'Full courts and half courts with professional hoops and flooring',
    venues: 35,
    players: '7.2k+',
    image: 'professional basketball court with dramatic lighting, indoor sports facility with wooden floors, basketball hoop and court lines',
    trending: true,
    category: 'Indoor',
    difficulty: 'All Levels',
    equipment: 'Provided',
    avgPrice: 900
  },
  {
    id: 8,
    name: 'Volleyball',
    description: 'Beach and indoor volleyball courts with nets and professional setup',
    venues: 20,
    players: '3.1k+',
    image: 'professional volleyball court with net and dramatic lighting, indoor sports facility with wooden floors, volleyball setup',
    trending: false,
    category: 'Both',
    difficulty: 'Beginner to Pro',
    equipment: 'Provided',
    avgPrice: 700
  },
  {
    id: 9,
    name: 'Squash',
    description: 'Glass-walled courts with professional flooring and equipment',
    venues: 15,
    players: '2.8k+',
    image: 'professional squash court with glass walls and dramatic lighting, indoor racquet sports facility, modern squash setup',
    trending: false,
    category: 'Indoor',
    difficulty: 'Intermediate to Pro',
    equipment: 'Rental Available',
    avgPrice: 1100
  }
];

export default function SportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [difficultyLevel, setDifficultyLevel] = useState('All');
  const [sortBy, setSortBy] = useState('popularity');

  const categories = ['All', 'Indoor', 'Outdoor', 'Both'];
  const difficulties = ['All', 'Beginner to Pro', 'All Levels', 'Intermediate to Pro'];

  const filteredSports = allSports.filter(sport => {
    const matchesSearch = sport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sport.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || sport.category === selectedCategory;
    const matchesDifficulty = difficultyLevel === 'All' || sport.difficulty === difficultyLevel;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const sortedSports = [...filteredSports].sort((a, b) => {
    if (sortBy === 'popularity') return parseInt(b.players.replace('k+', '000')) - parseInt(a.players.replace('k+', '000'));
    if (sortBy === 'venues') return b.venues - a.venues;
    if (sortBy === 'price') return a.avgPrice - b.avgPrice;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-black text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Choose Your
              <br />
              <span className="text-gray-300">Favorite Sport</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
              From indoor courts to outdoor fields, find the perfect sport and venue for your passion
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="relative">
                <i className="ri-search-line absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 flex items-center justify-center"></i>
                <input
                  type="text"
                  placeholder="Search sports or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white text-black rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-black font-semibold">Filter by:</div>
            
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black/20 pr-8"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm">Level:</span>
              <select
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black/20 pr-8"
              >
                {difficulties.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black/20 pr-8"
              >
                <option value="popularity">Popularity</option>
                <option value="venues">Venues</option>
                <option value="price">Price</option>
                <option value="name">Name</option>
              </select>
            </div>

            <div className="ml-auto text-gray-600">
              {sortedSports.length} sports found
            </div>
          </div>
        </div>
      </section>

      {/* Sports Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedSports.map((sport) => (
              <div key={sport.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                {/* Image */}
                <div
                  className="h-64 bg-cover bg-center relative"
                  style={{
                    backgroundImage: `url('https://readdy.ai/api/search-image?query=$%7Bsport.image%7D&width=400&height=300&seq=sport-list-${sport.id}&orientation=landscape')`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  
                  {/* Trending Badge */}
                  {sport.trending && (
                    <div className="absolute top-4 left-4 flex items-center gap-1 bg-white text-black px-3 py-1 rounded-full text-sm font-medium">
                      <i className="ri-fire-fill text-orange-500"></i>
                      Trending
                    </div>
                  )}

                  {/* Category Badge */}
                  <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-lg">
                    <span className="text-black font-semibold text-sm">{sport.category}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-black mb-2">{sport.name}</h3>
                  <p className="text-gray-600 mb-4">{sport.description}</p>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <i className="ri-building-line w-4 h-4 flex items-center justify-center"></i>
                      <span className="text-sm">{sport.venues} venues</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <i className="ri-user-line w-4 h-4 flex items-center justify-center"></i>
                      <span className="text-sm">{sport.players} players</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <i className="ri-trophy-line w-4 h-4 flex items-center justify-center"></i>
                      <span className="text-sm">{sport.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <i className="ri-tools-line w-4 h-4 flex items-center justify-center"></i>
                      <span className="text-sm">{sport.equipment}</span>
                    </div>
                  </div>

                  {/* Price and Find Button */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                    <div>
                      <span className="text-sm text-gray-500">From</span>
                      <div className="text-2xl font-bold text-black">₹{sport.avgPrice}</div>
                      <span className="text-sm text-gray-500">per hour</span>
                    </div>
                    <button className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all duration-200 font-semibold cursor-pointer whitespace-nowrap">
                      Find Venues
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {sortedSports.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-search-line text-gray-400 text-2xl w-8 h-8 flex items-center justify-center"></i>
              </div>
              <h3 className="text-2xl font-bold text-black mb-2">No sports found</h3>
              <p className="text-gray-600">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}