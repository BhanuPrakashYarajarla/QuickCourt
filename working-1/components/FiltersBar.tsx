
'use client';
import { useState } from 'react';

export default function FiltersBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSport, setSelectedSport] = useState('All Sports');
  const [selectedPrice, setSelectedPrice] = useState('Any Price');
  const [selectedVenue, setSelectedVenue] = useState('Any Venue');

  const [showSportDropdown, setShowSportDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [showVenueDropdown, setShowVenueDropdown] = useState(false);

  const sportOptions = ['All Sports', 'Basketball', 'Tennis', 'Football', 'Swimming', 'Badminton', 'Boxing'];
  const priceOptions = ['Any Price', '$0 - $25', '$25 - $50', '$50 - $75', '$75+'];
  const venueOptions = ['Any Venue', 'Indoor', 'Outdoor', 'Premium', 'Standard'];

  const FilterDropdown = ({ 
    label, 
    value, 
    options, 
    isOpen, 
    setIsOpen, 
    onSelect 
  }: { 
    label: string;
    value: string;
    options: string[];
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onSelect: (option: string) => void;
  }) => (
    <div className="relative">
      <button
        className="bg-white border-2 border-gray-300 text-black px-4 py-2 rounded-lg hover:border-gray-400 transition-all duration-200 font-medium whitespace-nowrap cursor-pointer flex items-center justify-between min-w-[140px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{value}</span>
        <div className="w-4 h-4 flex items-center justify-center ml-2">
          <i className={`ri-arrow-${isOpen ? 'up' : 'down'}-s-line text-sm`}></i>
        </div>
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white border-2 border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-200 text-black cursor-pointer"
              onClick={() => {
                onSelect(option);
                setIsOpen(false);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <section className="py-8 bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Toggle */}
        <div className="md:hidden mb-4">
          <button
            className="flex items-center justify-between w-full bg-white border-2 border-gray-300 text-black px-4 py-3 rounded-lg hover:border-gray-400 transition-all duration-200 font-medium cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span>Filter Options</span>
            <div className="w-5 h-5 flex items-center justify-center">
              <i className={`ri-arrow-${isExpanded ? 'up' : 'down'}-s-line text-lg`}></i>
            </div>
          </button>
        </div>

        {/* Filters */}
        <div className={`${isExpanded ? 'block' : 'hidden'} md:block`}>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <FilterDropdown
                label="Sport"
                value={selectedSport}
                options={sportOptions}
                isOpen={showSportDropdown}
                setIsOpen={setShowSportDropdown}
                onSelect={setSelectedSport}
              />
              
              <FilterDropdown
                label="Price Range"
                value={selectedPrice}
                options={priceOptions}
                isOpen={showPriceDropdown}
                setIsOpen={setShowPriceDropdown}
                onSelect={setSelectedPrice}
              />
              
              <FilterDropdown
                label="Venue Type"
                value={selectedVenue}
                options={venueOptions}
                isOpen={showVenueDropdown}
                setIsOpen={setShowVenueDropdown}
                onSelect={setSelectedVenue}
              />
              
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium whitespace-nowrap cursor-pointer">
                Apply Filters
              </button>
              <button className="flex-1 sm:flex-none bg-white border-2 border-black text-black px-6 py-2 rounded-lg hover:bg-black hover:text-white transition-all duration-200 font-medium whitespace-nowrap cursor-pointer">
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
