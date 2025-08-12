
'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function WelcomeBanner() {
  const [selectedLocation, setSelectedLocation] = useState('Ahmedabad');
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  const cities = [
    'Ahmedabad', 'Bangalore', 'Delhi', 'Mumbai', 'Hyderabad'
  ];

  return (
    <>
      <section 
        className="py-20 bg-cover bg-center bg-no-repeat relative h-screen flex items-center"
        style={{
          backgroundImage: `url('https://readdy.ai/api/search-image?query=modern%20sports%20complex%20stadium%20aerial%20view%20with%20multiple%20courts%20and%20fields%2C%20dramatic%20lighting%2C%20ultra%20realistic%20architectural%20photography%2C%20professional%20sports%20facility%20with%20green%20grass%20and%20clean%20surfaces%2C%20wide%20angle%20view&width=1200&height=600&seq=hero-bg-001&orientation=landscape')`
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/60"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          {/* Header Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm">
              <i className="ri-trending-up-line mr-2"></i>
              India's #1 Sports Booking Platform
            </div>
          </div>

          {/* Main Content */}
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              FIND VENUES & PLAYERS
            </h1>
            
            <p className="text-lg sm:text-xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
              Discover premium sports venues and connect with passionate players in your city.<br />
              Book instantly, play immediately.
            </p>

            {/* Search Section */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              {/* Location Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsLocationOpen(!isLocationOpen)}
                  className="flex items-center px-6 py-4 bg-black/50 backdrop-blur-sm text-white rounded-lg hover:bg-black/60 transition-all duration-200 whitespace-nowrap cursor-pointer border border-white/20"
                >
                  <i className="ri-map-pin-line mr-2"></i>
                  {selectedLocation}
                  <i className="ri-arrow-down-s-line ml-2"></i>
                </button>
                
                {isLocationOpen && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border z-20 w-full min-w-[160px]">
                    {cities.map((city) => (
                      <button
                        key={city}
                        onClick={() => {
                          setSelectedLocation(city);
                          setIsLocationOpen(false);
                        }}
                        className="block w-full text-left px-4 py-3 text-gray-800 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg cursor-pointer"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Button - Now links to venues page */}
              <Link href="/venues">
                <button className="bg-white text-black px-6 py-4 rounded-lg hover:bg-gray-100 transition-all duration-200 font-semibold whitespace-nowrap cursor-pointer flex items-center">
                  <i className="ri-search-line mr-2"></i>
                  Find Venues
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
