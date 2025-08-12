
'use client';

import { useState, useEffect } from 'react';

interface Facility {
  id: number;
  name: string;
  description: string;
  location: string;
  phone: string;
  email: string;
  website: string;
  operating_hours_weekdays: string;
  operating_hours_weekends: string;
  status: string;
  sports: string[];
  amenities: string[];
  photos: { url: string; caption: string; is_primary: boolean }[];
  court_count: number;
  created_at: string;
  updated_at: string;
}

export default function FacilityManagement() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showAddFacilityModal, setShowAddFacilityModal] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);

  const [newFacilityData, setNewFacilityData] = useState({
    name: '',
    location: '',
    city: 'Ahmedabad',
    phone: '',
    email: '',
    website: '',
    description: '',
    operatingHours: { weekdays: { start: '09:00', end: '18:00' }, weekends: { start: '09:00', end: '18:00' } },
    sports: [] as string[],
    amenities: [] as string[],
    photos: [] as File[],
    sportCourts: {} as Record<string, number>
  });

  const availableSports = [
    'Tennis', 'Basketball', 'Badminton', 'Football', 'Volleyball', 'Table Tennis', 'Squash', 'Cricket'
  ];

  const availableAmenities = [
    'Parking', 'Restrooms', 'Changing Rooms', 'Equipment Rental', 'Cafeteria', 'Pro Shop', 
    'WiFi', 'Air Conditioning', 'First Aid', 'Security', 'Lockers', 'Spectator Seating'
  ];

  const availableCities = ['Ahmedabad', 'Bangalore', 'Delhi', 'Mumbai', 'Hyderabad'];

  const toggleNewFacilitySport = (sport: string) => {
    setNewFacilityData(prev => ({
      ...prev,
      sports: prev.sports.includes(sport) 
        ? prev.sports.filter(s => s !== sport)
        : [...prev.sports, sport],
      sportCourts: prev.sports.includes(sport)
        ? { ...prev.sportCourts, [sport]: 0 }
        : { ...prev.sportCourts, [sport]: 1 }
    }));
  };

  const updateSportCourtCount = (sport: string, count: number) => {
    if (count < 1) return;
    setNewFacilityData(prev => ({
      ...prev,
      sportCourts: { ...prev.sportCourts, [sport]: count }
    }));
  };

  // Fetch facilities on component mount
  useEffect(() => {
    fetchMyFacilities();
  }, []);

  const fetchMyFacilities = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Get user data from localStorage
      const userData = localStorage.getItem('userData');
      if (!userData) {
        setError('User not authenticated');
        return;
      }
      
      const user = JSON.parse(userData);
      
      const response = await fetch(`http://localhost:5001/facilities/my?user_id=${user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch facilities');
      }
      
      const data = await response.json();
      setFacilities(data.facilities);
      
    } catch (error: any) {
      setError(error.message || 'Failed to fetch facilities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (editingFacility) {
      setEditingFacility(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleOperatingHoursChange = (type: string, value: string) => {
    if (editingFacility) {
      setEditingFacility(prev => prev ? {
        ...prev,
        operating_hours_weekdays: type === 'weekdays' ? value : prev.operating_hours_weekdays,
        operating_hours_weekends: type === 'weekends' ? value : prev.operating_hours_weekends
      } : null);
    }
  };

  const toggleSport = (sport: string) => {
    if (editingFacility) {
      setEditingFacility(prev => prev ? {
        ...prev,
        sports: prev.sports.includes(sport) 
          ? prev.sports.filter(s => s !== sport)
          : [...prev.sports, sport]
      } : null);
    }
  };

  const toggleAmenity = (amenity: string) => {
    if (editingFacility) {
      setEditingFacility(prev => prev ? {
        ...prev,
        amenities: prev.amenities.includes(amenity) 
          ? prev.amenities.filter(a => a !== amenity)
          : [...prev.amenities, amenity]
      } : null);
    }
  };

  const handleSave = async () => {
    if (!editingFacility) return;
    
    try {
      setError('');
      
      const response = await fetch(`http://localhost:5001/facilities/${editingFacility.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingFacility.name,
          description: editingFacility.description,
          location: editingFacility.location,
          phone: editingFacility.phone,
          email: editingFacility.email,
          website: editingFacility.website,
          operating_hours_weekdays: editingFacility.operating_hours_weekdays,
          operating_hours_weekends: editingFacility.operating_hours_weekends,
          sports: editingFacility.sports,
          amenities: editingFacility.amenities,
          photos: editingFacility.photos.map(p => p.url)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update facility');
      }

      // Refresh facilities list
      await fetchMyFacilities();
      setIsEditing(false);
      setEditingFacility(null);
      
    } catch (error: any) {
      setError(error.message || 'Failed to update facility');
    }
  };

  const handleEditFacility = (facility: Facility) => {
    setEditingFacility(facility);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingFacility(null);
  };

  const handlePhotoUpload = () => {
    if (editingFacility) {
      const newPhoto = `https://readdy.ai/api/search-image?query=sports%20facility%20interior%20with%20modern%20equipment%2C%20professional%20lighting%2C%20clean%20athletic%20environment&width=400&height=300&seq=facility${Date.now()}&orientation=landscape`;
      setEditingFacility(prev => prev ? {
        ...prev,
        photos: [...prev.photos, { url: newPhoto, caption: '', is_primary: false }]
      } : null);
    }
  };

  const removePhoto = (index: number) => {
    if (editingFacility) {
      setEditingFacility(prev => prev ? {
        ...prev,
        photos: prev.photos.filter((_, i) => i !== index)
      } : null);
    }
  };

  const handleAddFacilitySubmit = async () => {
    try {
      setError('');
      
      // Get user data from localStorage
      const userData = localStorage.getItem('userData');
      if (!userData) {
        setError('User not authenticated');
        return;
      }
      
      const user = JSON.parse(userData);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('owner_id', user.id.toString());
      formData.append('name', newFacilityData.name);
      formData.append('description', newFacilityData.description);
      formData.append('location', newFacilityData.location);
      formData.append('city', newFacilityData.city);
      formData.append('phone', newFacilityData.phone);
      formData.append('email', newFacilityData.email);
      formData.append('website', newFacilityData.website);
      formData.append('operating_hours_weekdays', `${newFacilityData.operatingHours.weekdays.start} - ${newFacilityData.operatingHours.weekdays.end}`);
      formData.append('operating_hours_weekends', `${newFacilityData.operatingHours.weekends.start} - ${newFacilityData.operatingHours.weekends.end}`);
      formData.append('sports', newFacilityData.sports.join(','));
      formData.append('amenities', newFacilityData.amenities.join(','));
      
      // Add sport courts data
      const sportCourtsData = Object.entries(newFacilityData.sportCourts)
        .filter(([sport, count]) => count > 0)
        .map(([sport, count]) => `${sport}:${count}`)
        .join(',');
      formData.append('sportCourts', sportCourtsData);
      
      // Add photos
      newFacilityData.photos.forEach((photo, index) => {
        formData.append('photos', photo);
      });
      
      const response = await fetch('http://localhost:5001/facilities', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create facility');
      }

      // Refresh facilities list
      await fetchMyFacilities();
      setShowAddFacilityModal(false);
      setNewFacilityData({
        name: '',
        location: '',
        city: 'Ahmedabad',
        phone: '',
        email: '',
        website: '',
        description: '',
        operatingHours: { weekdays: { start: '09:00', end: '18:00' }, weekends: { start: '09:00', end: '18:00' } },
        sports: [],
        amenities: [],
        photos: [],
        sportCourts: {}
      });
      
    } catch (error: any) {
      setError(error.message || 'Failed to create facility');
    }
  };

  const toggleNewFacilityAmenity = (amenity: string) => {
    setNewFacilityData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity) 
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const addNewFacilityPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newPhotos = Array.from(files);
      setNewFacilityData(prev => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos]
      }));
    }
  };

  const removeNewFacilityPhoto = (index: number) => {
    setNewFacilityData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleDeleteFacility = async (facilityId: number) => {
    if (!confirm('Are you sure you want to delete this facility?')) return;
    
    try {
      setError('');
      
      const response = await fetch(`http://localhost:5001/facilities/${facilityId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete facility');
      }

      // Refresh facilities list
      await fetchMyFacilities();
      
    } catch (error: any) {
      setError(error.message || 'Failed to delete facility');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Facility Management</h1>
            <p className="text-gray-400 mt-1">Loading facilities...</p>
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Facility Management</h1>
          <p className="text-gray-400 mt-1">Manage your sports facilities and settings</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddFacilityModal(true)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium whitespace-nowrap"
          >
            Add New Facility
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Facilities List */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      ) : facilities.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <i className="ri-building-line text-4xl text-gray-400"></i>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No facilities yet</h3>
          <p className="text-gray-400 mb-6">Start by adding your first sports facility</p>
          <button
            onClick={() => setShowAddFacilityModal(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
          >
            Add Your First Facility
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {facilities.map((facility) => (
            <div key={facility.id} className="bg-gray-800 rounded-xl p-6">
              {/* Facility Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{facility.name}</h3>
                  <p className="text-gray-400 flex items-center">
                    <i className="ri-map-pin-line mr-2"></i>
                    {facility.location}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditFacility(facility)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteFacility(facility.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Facility Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-300 mb-2">
                    <span className="font-semibold">Phone:</span> {facility.phone || 'Not provided'}
                  </p>
                  <p className="text-gray-300 mb-2">
                    <span className="font-semibold">Email:</span> {facility.email || 'Not provided'}
                  </p>
                  <p className="text-gray-300">
                    <span className="font-semibold">Website:</span> {facility.website || 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-300 mb-2">
                    <span className="font-semibold">Weekdays:</span> {facility.operating_hours_weekdays || 'Not set'}
                  </p>
                  <p className="text-gray-300">
                    <span className="font-semibold">Weekends:</span> {facility.operating_hours_weekends || 'Not set'}
                  </p>
                </div>
              </div>

              {/* Sports and Amenities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Sports Supported</h4>
                  <div className="flex flex-wrap gap-2">
                    {facility.sports && facility.sports.length > 0 ? (
                      facility.sports.map((sport) => (
                        <span
                          key={sport}
                          className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs font-medium"
                        >
                          {sport}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No sports added</span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {facility.amenities && facility.amenities.length > 0 ? (
                      facility.amenities.map((amenity) => (
                        <span
                          key={amenity}
                          className="px-2 py-1 bg-green-600 text-white rounded-full text-xs font-medium"
                        >
                          {amenity}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No amenities added</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Photos</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {facility.photos && facility.photos.length > 0 ? (
                    facility.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo.url}
                          alt={`Facility photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 text-xs"
                        >
                          <i className="ri-close-line"></i>
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No photos added</span>
                  )}
                  {facility.photos && facility.photos.length < 6 && (
                    <button
                      onClick={handlePhotoUpload}
                      className="w-full h-24 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-white hover:bg-gray-700 transition-colors"
                    >
                      <div className="text-center">
                        <i className="ri-add-line text-xl text-gray-400 mb-1"></i>
                        <p className="text-xs text-gray-500">Add Photo</p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Facility Modal */}
      {isEditing && editingFacility && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Edit Facility</h2>
                <button
                  onClick={handleCancelEdit}
                  className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700"
                >
                  <i className="ri-close-line text-white"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Facility Name</label>
                  <input
                    type="text"
                    value={editingFacility.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                  <input
                    type="text"
                    value={editingFacility.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={editingFacility.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={editingFacility.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                  <input
                    type="url"
                    value={editingFacility.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={editingFacility.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
                  maxLength={500}
                />
              </div>

              {/* Operating Hours */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Operating Hours</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Weekdays</label>
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={editingFacility.operating_hours_weekdays}
                        onChange={(e) => handleOperatingHoursChange('weekdays', e.target.value)}
                        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
                      />
                      <span className="text-gray-400 self-center">to</span>
                      <input
                        type="time"
                        value={editingFacility.operating_hours_weekdays}
                        onChange={(e) => handleOperatingHoursChange('weekdays', e.target.value)}
                        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Weekends</label>
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={editingFacility.operating_hours_weekends}
                        onChange={(e) => handleOperatingHoursChange('weekends', e.target.value)}
                        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
                      />
                      <span className="text-gray-400 self-center">to</span>
                      <input
                        type="time"
                        value={editingFacility.operating_hours_weekends}
                        onChange={(e) => handleOperatingHoursChange('weekends', e.target.value)}
                        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sports Supported */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Sports Supported</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {availableSports.map((sport) => (
                    <label key={sport} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingFacility.sports.includes(sport)}
                        onChange={() => toggleSport(sport)}
                        className="w-4 h-4 text-white border-gray-600 rounded focus:ring-white"
                      />
                      <span className="text-gray-300">{sport}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Amenities Offered</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {availableAmenities.map((amenity) => (
                    <label key={amenity} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingFacility.amenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                        className="w-4 h-4 text-white border-gray-600 rounded focus:ring-white"
                      />
                      <span className="text-gray-300">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Photos */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">Photos</h3>
                  <button
                    onClick={handlePhotoUpload}
                    className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-medium whitespace-nowrap"
                  >
                    Add Photo
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {editingFacility.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo.url}
                        alt={`Facility photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                      >
                        <i className="ri-close-line text-xs"></i>
                      </button>
                      {photo.is_primary && (
                        <span className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs rounded">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                  {editingFacility.photos.length < 8 && (
                    <div 
                      onClick={handlePhotoUpload}
                      className="w-full h-32 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-white hover:bg-gray-800 transition-colors"
                    >
                      <div className="text-center">
                        <i className="ri-add-line text-xl text-gray-400 mb-1"></i>
                        <p className="text-xs text-gray-500">Add Photo</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-800 flex justify-end space-x-3">
              <button
                onClick={handleCancelEdit}
                className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-medium whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-medium whitespace-nowrap"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Facility Modal */}
      {showAddFacilityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Add New Facility</h2>
                <button
                  onClick={() => setShowAddFacilityModal(false)}
                  className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700"
                >
                  <i className="ri-close-line text-white"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Facility Name</label>
                  <input
                    type="text"
                    value={newFacilityData.name}
                    onChange={(e) => setNewFacilityData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
                    placeholder="Enter facility name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                  <input
                    type="text"
                    value={newFacilityData.location}
                    onChange={(e) => setNewFacilityData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
                    placeholder="Enter location"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                  <select
                    value={newFacilityData.city}
                    onChange={(e) => setNewFacilityData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
                  >
                    {availableCities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={newFacilityData.phone}
                    onChange={(e) => setNewFacilityData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={newFacilityData.email}
                    onChange={(e) => setNewFacilityData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                  <input
                    type="url"
                    value={newFacilityData.website}
                    onChange={(e) => setNewFacilityData(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
                    placeholder="Enter website URL"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={newFacilityData.description}
                  onChange={(e) => setNewFacilityData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
                  placeholder="Describe your facility..."
                  maxLength={500}
                />
              </div>

              {/* Operating Hours */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Operating Hours</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Weekdays</label>
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={newFacilityData.operatingHours.weekdays.start}
                        onChange={(e) => setNewFacilityData(prev => ({ 
                          ...prev, 
                          operatingHours: { ...prev.operatingHours, weekdays: { ...prev.operatingHours.weekdays, start: e.target.value } }
                        }))}
                        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
                      />
                      <span className="text-gray-400 self-center">to</span>
                      <input
                        type="time"
                        value={newFacilityData.operatingHours.weekdays.end}
                        onChange={(e) => setNewFacilityData(prev => ({ 
                          ...prev, 
                          operatingHours: { ...prev.operatingHours, weekdays: { ...prev.operatingHours.weekdays, end: e.target.value } }
                        }))}
                        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Weekends</label>
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={newFacilityData.operatingHours.weekends.start}
                        onChange={(e) => setNewFacilityData(prev => ({ 
                          ...prev, 
                          operatingHours: { ...prev.operatingHours, weekends: { ...prev.operatingHours.weekends, start: e.target.value } }
                        }))}
                        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
                      />
                      <span className="text-gray-400 self-center">to</span>
                      <input
                        type="time"
                        value={newFacilityData.operatingHours.weekends.end}
                        onChange={(e) => setNewFacilityData(prev => ({ 
                          ...prev, 
                          operatingHours: { ...prev.operatingHours, weekends: { ...prev.operatingHours.weekends, end: e.target.value } }
                        }))}
                        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sports Supported */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Sports Supported</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {availableSports.map((sport) => (
                    <label key={sport} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newFacilityData.sports.includes(sport)}
                        onChange={() => toggleNewFacilitySport(sport)}
                        className="w-4 h-4 text-white border-gray-600 rounded focus:ring-white"
                      />
                      <span className="text-gray-300">{sport}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Amenities Offered</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {availableAmenities.map((amenity) => (
                    <label key={amenity} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newFacilityData.amenities.includes(amenity)}
                        onChange={() => toggleNewFacilityAmenity(amenity)}
                        className="w-4 h-4 text-white border-gray-600 rounded focus:ring-white"
                      />
                      <span className="text-gray-300">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Courts */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Courts Available</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {availableSports.map((sport) => (
                    <div key={sport} className="flex items-center space-x-3">
                      <span className="text-gray-300">{sport}</span>
                      <input
                        type="number"
                        value={newFacilityData.sportCourts[sport] || 0}
                        onChange={(e) => updateSportCourtCount(sport, parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white text-center"
                        min="0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Photos */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">Photos</h3>
                  <label className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-medium whitespace-nowrap cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={addNewFacilityPhoto}
                      className="hidden"
                    />
                    Add Photos
                  </label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {newFacilityData.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`New facility photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeNewFacilityPhoto(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                      >
                        <i className="ri-close-line text-xs"></i>
                      </button>
                    </div>
                  ))}
                  {newFacilityData.photos.length < 6 && (
                    <label className="w-full h-32 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-white hover:bg-gray-800 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={addNewFacilityPhoto}
                        className="hidden"
                      />
                      <div className="text-center">
                        <i className="ri-add-line text-xl text-gray-400 mb-1"></i>
                        <p className="text-xs text-gray-500">Add Photo</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-800 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddFacilityModal(false)}
                className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-medium whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFacilitySubmit}
                className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-medium whitespace-nowrap"
              >
                Add Facility
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
