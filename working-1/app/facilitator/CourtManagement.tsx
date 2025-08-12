
'use client';

import { useState, useEffect } from 'react';

interface Court {
  id: number;
  facility_id: number;
  name: string;
  sport_type: string;
  surface_type: string;
  court_number: number;
  hourly_rate: number;
  status: string;
  created_at: string;
  features?: string[];
}

export default function CourtManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentFacilityId, setCurrentFacilityId] = useState<number | null>(null);
  const [facilitySports, setFacilitySports] = useState<Array<{sport_type: string, court_count: number}>>([]);
  
  const [newCourt, setNewCourt] = useState({
    name: '',
    sport_type: '',
    hourly_rate: '',
    surface_type: '',
    court_number: '',
    features: [] as string[]
  });

  const sportOptions = ['Tennis', 'Basketball', 'Badminton', 'Football', 'Volleyball', 'Table Tennis', 'Squash', 'Cricket'];
  const surfaceOptions = ['Hard Court', 'Wooden Floor', 'Synthetic', 'Artificial Grass', 'Natural Grass'];
  const availableFeatures = [
    'Professional lighting', 'Climate controlled', 'Equipment rental', 'Sound system', 
    'Scoreboard', 'Air conditioning', 'Floodlights', 'Spectator seating', 'Changing rooms'
  ];

  // Fetch user's facilities and courts on component mount
  useEffect(() => {
    fetchUserFacilities();
  }, []);

  const fetchUserFacilities = async () => {
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
      
      if (data.facilities.length > 0) {
        const facilityId = data.facilities[0].id;
        setCurrentFacilityId(facilityId);
        await fetchFacilitySports(facilityId);
        await fetchCourts(facilityId);
      } else {
        setError('No facilities found. Please create a facility first.');
      }
      
    } catch (error: any) {
      setError(error.message || 'Failed to fetch facilities');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFacilitySports = async (facilityId: number) => {
    try {
      const response = await fetch(`http://localhost:5001/facility-courts?facility_id=${facilityId}`);
      
      if (response.ok) {
        const data = await response.json();
        setFacilitySports(data.facility_courts || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch facility sports:', error);
    }
  };

  const fetchCourts = async (facilityId: number) => {
    try {
      const response = await fetch(`http://localhost:5001/courts?facility_id=${facilityId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch courts');
      }
      
      const data = await response.json();
      setCourts(data.courts);
      
    } catch (error: any) {
      setError(error.message || 'Failed to fetch courts');
    }
  };

  const handleAddCourt = async () => {
    if (!currentFacilityId) {
      setError('No facility selected');
      return;
    }

    try {
      setError('');
      
      const response = await fetch('http://localhost:5001/courts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          facility_id: currentFacilityId,
          name: newCourt.name,
          sport_type: newCourt.sport_type,
          surface_type: newCourt.surface_type,
          court_number: parseInt(newCourt.court_number) || 1,
          hourly_rate: parseFloat(newCourt.hourly_rate) || 0
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create court');
      }

      // Refresh courts list
      await fetchCourts(currentFacilityId);
      
      // Reset form
      setNewCourt({
        name: '',
        sport_type: '',
        hourly_rate: '',
        surface_type: '',
        court_number: '',
        features: []
      });
      setShowAddModal(false);
      
    } catch (error: any) {
      setError(error.message || 'Failed to create court');
    }
  };

  const handleEditCourt = (court: Court) => {
    setEditingCourt({ ...court });
  };

  const handleUpdateCourt = async () => {
    if (!editingCourt) return;
    
    try {
      setError('');
      
      const response = await fetch(`http://localhost:5001/courts/${editingCourt.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingCourt.name,
          sport_type: editingCourt.sport_type,
          surface_type: editingCourt.surface_type,
          court_number: editingCourt.court_number,
          hourly_rate: editingCourt.hourly_rate,
          status: editingCourt.status
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update court');
      }

      // Refresh courts list
      if (currentFacilityId) {
        await fetchCourts(currentFacilityId);
      }
      setEditingCourt(null);
      
    } catch (error: any) {
      setError(error.message || 'Failed to update court');
    }
  };

  const handleDeleteCourt = async (courtId: number) => {
    if (!confirm('Are you sure you want to delete this court?')) return;
    
    try {
      setError('');
      
      const response = await fetch(`http://localhost:5001/courts/${courtId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete court');
      }

      // Refresh courts list
      if (currentFacilityId) {
        await fetchCourts(currentFacilityId);
      }
      
    } catch (error: any) {
      setError(error.message || 'Failed to delete court');
    }
  };

  const toggleCourtStatus = async (courtId: number) => {
    try {
      const court = courts.find(c => c.id === courtId);
      if (!court) return;
      
      const newStatus = court.status === 'active' ? 'inactive' : 'active';
      
      const response = await fetch(`http://localhost:5001/courts/${courtId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update court status');
      }

      // Refresh courts list
      if (currentFacilityId) {
        await fetchCourts(currentFacilityId);
      }
      
    } catch (error: any) {
      setError(error.message || 'Failed to update court status');
    }
  };

  const handleFeatureToggle = (feature: string, isEditing = false) => {
    if (isEditing && editingCourt) {
      const updatedFeatures = editingCourt.features?.includes(feature)
        ? editingCourt.features.filter(f => f !== feature)
        : [...(editingCourt.features || []), feature];
      setEditingCourt({ ...editingCourt, features: updatedFeatures });
    } else {
      const updatedFeatures = newCourt.features.includes(feature)
        ? newCourt.features.filter(f => f !== feature)
        : [...newCourt.features, feature];
      setNewCourt({ ...newCourt, features: updatedFeatures });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Court Management</h1>
          <p className="text-gray-400 mt-1">Manage your facility's courts and schedules</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap"
        >
          Add New Court
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Facility Sports Overview */}
          {facilitySports.length > 0 && (
            <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Facility Sports Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {facilitySports.map((sport, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-4 text-center">
                    <h3 className="text-lg font-medium text-white mb-2">{sport.sport_type}</h3>
                    <p className="text-2xl font-bold text-green-500">{sport.court_count}</p>
                    <p className="text-sm text-gray-400">Courts</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Courts List */}
          <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 p-6">
            <h2 className="text-xl font-semibold text-white mb-6">All Courts</h2>
            
            {courts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No courts found for this facility.</p>
                <p className="text-gray-500 text-sm mt-1">Courts will appear here based on the sports you selected when creating the facility.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-gray-800">
                    <tr>
                      <th className="pb-3 text-gray-400 font-medium">Court Name</th>
                      <th className="pb-3 text-gray-400 font-medium">Sport Type</th>
                      <th className="pb-3 text-gray-400 font-medium">Surface</th>
                      <th className="pb-3 text-gray-400 font-medium">Rate/Hour</th>
                      <th className="pb-3 text-gray-400 font-medium">Status</th>
                      <th className="pb-3 text-gray-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {courts.map((court) => (
                      <tr key={court.id} className="hover:bg-gray-800/50 transition-colors duration-200">
                        <td className="py-4 text-white font-medium">{court.name}</td>
                        <td className="py-4 text-gray-300">{court.sport_type}</td>
                        <td className="py-4 text-gray-300">{court.surface_type}</td>
                        <td className="py-4 text-gray-300">₹{court.hourly_rate}</td>
                        <td className="py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(court.status)}`}>
                            {court.status}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditCourt(court)}
                              className="text-blue-400 hover:text-blue-300 transition-colors duration-200 cursor-pointer"
                            >
                              <i className="ri-edit-line w-4 h-4 flex items-center justify-center"></i>
                            </button>
                            <button
                              onClick={() => toggleCourtStatus(court.id)}
                              className={`transition-colors duration-200 cursor-pointer ${
                                court.status === 'active' 
                                  ? 'text-yellow-400 hover:text-yellow-300' 
                                  : 'text-green-400 hover:text-green-300'
                              }`}
                            >
                              <i className={`ri-${court.status === 'active' ? 'pause' : 'play'}-line w-4 h-4 flex items-center justify-center`}></i>
                            </button>
                            <button
                              onClick={() => handleDeleteCourt(court.id)}
                              className="text-red-400 hover:text-red-300 transition-colors duration-200 cursor-pointer"
                            >
                              <i className="ri-delete-bin-line w-4 h-4 flex items-center justify-center"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Court Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Add New Court</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Court Name</label>
                  <input
                    type="text"
                    value={newCourt.name}
                    onChange={(e) => setNewCourt({...newCourt, name: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Tennis Court 3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sport Type</label>
                  <select
                    value={newCourt.sport_type}
                    onChange={(e) => setNewCourt({...newCourt, sport_type: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8"
                  >
                    <option value="">Select Sport</option>
                    {sportOptions.map(sport => (
                      <option key={sport} value={sport}>{sport}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price per Hour ($)</label>
                  <input
                    type="number"
                    value={newCourt.hourly_rate}
                    onChange={(e) => setNewCourt({...newCourt, hourly_rate: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="25"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Court Number</label>
                  <input
                    type="number"
                    value={newCourt.court_number}
                    onChange={(e) => setNewCourt({...newCourt, court_number: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Surface Type</label>
                  <select
                    value={newCourt.surface_type}
                    onChange={(e) => setNewCourt({...newCourt, surface_type: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8"
                  >
                    <option value="">Select Surface</option>
                    {surfaceOptions.map(surface => (
                      <option key={surface} value={surface}>{surface}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableFeatures.map((feature) => (
                      <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newCourt.features.includes(feature)}
                          onChange={() => handleFeatureToggle(feature)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCourt}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap"
              >
                Add Court
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Court Modal */}
      {editingCourt && (
        <div className="fixed inset-0 bg-black bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Edit Court</h2>
              <button
                onClick={() => setEditingCourt(null)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Court Name</label>
                  <input
                    type="text"
                    value={editingCourt.name}
                    onChange={(e) => setEditingCourt({...editingCourt, name: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sport Type</label>
                  <select
                    value={editingCourt.sport_type}
                    onChange={(e) => setEditingCourt({...editingCourt, sport_type: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8"
                  >
                    {sportOptions.map(sport => (
                      <option key={sport} value={sport}>{sport}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price per Hour ($)</label>
                  <input
                    type="number"
                    value={editingCourt.hourly_rate}
                    onChange={(e) => setEditingCourt({...editingCourt, hourly_rate: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Court Number</label>
                  <input
                    type="number"
                    value={editingCourt.court_number}
                    onChange={(e) => setEditingCourt({...editingCourt, court_number: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Surface Type</label>
                  <select
                    value={editingCourt.surface_type}
                    onChange={(e) => setEditingCourt({...editingCourt, surface_type: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8"
                  >
                    {surfaceOptions.map(surface => (
                      <option key={surface} value={surface}>{surface}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableFeatures.map((feature) => (
                      <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingCourt.features?.includes(feature)}
                          onChange={() => handleFeatureToggle(feature, true)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setEditingCourt(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCourt}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap"
              >
                Update Court
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
