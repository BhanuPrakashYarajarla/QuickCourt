
'use client';

const sports = [
  {
    id: 1,
    name: 'Badminton',
    description: 'Professional courts with world-class facilities',
    venues: 45,
    players: '12k+',
    image: 'professional badminton player in action on indoor court with dramatic blue lighting, sports photography, modern facility with wooden floors',
    trending: true,
  },
  {
    id: 2,
    name: 'Football',
    description: 'FIFA standard pitches and 5-a-side courts',
    venues: 32,
    players: '8.5k+',
    image: 'professional football field with green grass and goal posts, modern stadium with dramatic lighting, sports photography',
    trending: true,
    color: 'bg-green-500'
  },
  {
    id: 3,
    name: 'Cricket',
    description: 'International standard grounds with all facilities',
    venues: 28,
    players: '15k+',
    image: 'professional cricket stadium at sunset with dramatic orange lighting, cricket field with wickets, sports photography',
    trending: true,
  },
  {
    id: 4,
    name: 'Swimming',
    description: 'Olympic-size pools with professional training',
    venues: 18,
    players: '6k+',
    image: 'professional swimmer underwater in clear blue pool with dramatic lighting, olympic swimming facility, sports photography',
  },
  {
    id: 5,
    name: 'Tennis',
    description: 'Clay and hard courts for all skill levels',
    venues: 25,
    players: '4.2k+',
    image: 'professional tennis player serving on clay court with dramatic golden lighting, tennis facility, sports photography',
  },
  {
    id: 6,
    name: 'Table Tennis',
    description: 'Premium tables in air-conditioned environments',
    venues: 22,
    players: '3.8k+',
    image: 'professional table tennis player in action with dramatic lighting, modern indoor facility, sports photography',
  }
];

export default function PopularSports() {
  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm mb-6">
            <i className="ri-fire-fill text-orange-500"></i>
            Most Popular
          </div>
          <h2 className="text-5xl font-bold text-white mb-6">
            Choose Your<br />
            Favorite Sport
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            From badminton to cricket, find the perfect venue for your passion across India's sports capital
          </p>
        </div>

        {/* Sports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sports.map((sport, index) => (
            <div
              key={sport.id}
              className={`relative h-80 rounded-2xl overflow-hidden cursor-pointer group ${
                index === 1 ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
              style={{
                backgroundImage: `url('https://readdy.ai/api/search-image?query=${sport.image}&width=400&height=400&seq=sport-card-${sport.id}&orientation=squarish')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-all duration-300"></div>

              {/* Trending Badge */}
              {sport.trending && (
                <div className="absolute top-4 left-4 flex items-center gap-1 bg-white text-black px-3 py-1 rounded-full text-sm font-medium">
                  <i className="ri-fire-fill text-orange-500"></i>
                  Trending
                </div>
              )}

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-3xl font-bold text-white mb-2">
                  {sport.name}
                </h3>
                <p className="text-gray-200 mb-4 text-sm">
                  {sport.description}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-gray-300">
                      <i className="ri-map-pin-line w-4 h-4 flex items-center justify-center"></i>
                      <span className="text-sm">{sport.venues} venues</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <i className="ri-user-line w-4 h-4 flex items-center justify-center"></i>
                      <span className="text-sm">{sport.players} players</span>
                    </div>
                  </div>

                  {/* Arrow Button */}
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-200">
                    <i className="ri-arrow-right-line text-white w-5 h-5 flex items-center justify-center"></i>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View More Button */}
        <div className="text-center mt-12">
          <a
            href="/sports"
            className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all duration-200 cursor-pointer whitespace-nowrap"
          >
            View More Sports
            <i className="ri-arrow-right-line w-5 h-5 flex items-center justify-center"></i>
          </a>
        </div>
      </div>
    </section>
  );
}
