
'use client';

import { useState, useEffect } from 'react';

interface Court {
  id: number;
  name: string;
  sport_type: string;
}

interface TimeSlot {
  id: number;
  court_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export default function TimeSlotManagement() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCourt, setSelectedCourt] = useState('all');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [blockingSlot, setBlockingSlot] = useState({ court: '', date: '', startTime: '', endTime: '', reason: '' });
  const [maintenanceSlot, setMaintenanceSlot] = useState({ 
    court: '', 
    date: '', 
    startTime: '', 
    endTime: '', 
    reason: 'Maintenance',
    isMaintenance: true 
  });
  
  const [courts, setCourts] = useState<Court[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [slotStatus, setSlotStatus] = useState<Record<number, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentFacilityId, setCurrentFacilityId] = useState<number | null>(null);

  const timeSlotsList = [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'
  ];

  // Fetch user's facilities and courts on component mount
  useEffect(() => {
    fetchUserFacilities();
  }, []);

  // Fetch time slots when date or court changes
  useEffect(() => {
    if (currentFacilityId && selectedDate) {
      fetchTimeSlots();
    }
  }, [currentFacilityId, selectedDate, selectedCourt]);

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

  const fetchCourts = async (facilityId: number) => {
    try {
      const response = await fetch(`http://localhost:5001/courts?facility_id=${facilityId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch courts');
      }
      
      const data = await response.json();
      setCourts(data.courts);
      
      // Initialize slot status for all courts
      const initialStatus: Record<number, Record<string, string>> = {};
      data.courts.forEach((court: Court) => {
        initialStatus[court.id] = {};
        timeSlotsList.forEach(slot => {
          initialStatus[court.id][slot] = 'available';
        });
      });
      setSlotStatus(initialStatus);
      
    } catch (error: any) {
      setError(error.message || 'Failed to fetch courts');
    }
  };

  const fetchTimeSlots = async () => {
    if (selectedCourt === 'all') return;
    
    try {
      const courtId = parseInt(selectedCourt);
      const dayOfWeek = getDayOfWeek(selectedDate);
      
      const response = await fetch(`http://localhost:5001/time-slots?court_id=${courtId}&date=${selectedDate}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch time slots');
      }
      
      const data = await response.json();
      
      // Update slot status based on fetched time slots
      const updatedStatus = { ...slotStatus };
      data.time_slots.forEach((slot: TimeSlot) => {
        if (updatedStatus[courtId]) {
          updatedStatus[courtId][slot.start_time] = slot.is_available ? 'available' : 'blocked';
        }
      });
      
      setSlotStatus(updatedStatus);
      
    } catch (error: any) {
      console.error('Failed to fetch time slots:', error);
    }
  };

  const getDayOfWeek = (dateStr: string): number => {
    const date = new Date(dateStr);
    return date.getDay(); // 0=Sunday, 1=Monday, etc.
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-50 text-green-700 border-green-200';
      case 'booked': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'blocked': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return 'ri-check-line';
      case 'booked': return 'ri-user-line';
      case 'blocked': return 'ri-close-line';
      default: return 'ri-question-line';
    }
  };

  const handleSlotClick = async (courtId: number, timeSlot: string, currentStatus: string) => {
    if (currentStatus === 'booked') return;

    try {
      const newStatus = currentStatus === 'available' ? 'blocked' : 'available';
      
      // Update local state immediately for better UX
      setSlotStatus(prev => ({
        ...prev,
        [courtId]: {
          ...prev[courtId],
          [timeSlot]: newStatus
        }
      }));

      // Update in database
      const dayOfWeek = getDayOfWeek(selectedDate);
      const response = await fetch(`http://localhost:5001/time-slots/bulk-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          court_id: courtId,
          day_of_week: dayOfWeek,
          start_time: timeSlot,
          end_time: timeSlot,
          is_available: newStatus === 'available'
        }),
      });

      if (!response.ok) {
        // Revert local state if API call fails
        setSlotStatus(prev => ({
          ...prev,
          [courtId]: {
            ...prev[courtId],
            [timeSlot]: currentStatus
          }
        }));
        throw new Error('Failed to update time slot');
      }
      
    } catch (error: any) {
      setError(error.message || 'Failed to update time slot');
    }
  };

  const handleBlockMultipleSlots = async () => {
    if (!blockingSlot.court || !blockingSlot.date || !blockingSlot.startTime || !blockingSlot.endTime) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const dayOfWeek = getDayOfWeek(blockingSlot.date);
      
      const response = await fetch('http://localhost:5001/time-slots/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          court_id: parseInt(blockingSlot.court),
          day_of_week: dayOfWeek,
          start_time: blockingSlot.startTime,
          end_time: blockingSlot.endTime,
          is_available: false,
          reason: blockingSlot.reason || 'Blocked'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to block time slots');
      }

      alert('Time slots blocked successfully!');
      setShowBlockModal(false);
      setBlockingSlot({ court: '', date: '', startTime: '', endTime: '', reason: '' });
      fetchTimeSlots();
      
    } catch (error: any) {
      alert(error.message || 'Failed to block time slots');
    }
  };

  const handleMaintenanceSlot = async () => {
    if (!maintenanceSlot.court || !maintenanceSlot.date || !maintenanceSlot.startTime || !maintenanceSlot.endTime) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const dayOfWeek = getDayOfWeek(maintenanceSlot.date);
      
      const response = await fetch('http://localhost:5001/time-slots/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          court_id: parseInt(maintenanceSlot.court),
          day_of_week: dayOfWeek,
          start_time: maintenanceSlot.startTime,
          end_time: maintenanceSlot.endTime,
          is_available: false,
          reason: maintenanceSlot.reason,
          is_maintenance: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to schedule maintenance');
      }

      alert('Maintenance scheduled successfully!');
      setShowMaintenanceModal(false);
      setMaintenanceSlot({ 
        court: '', 
        date: '', 
        startTime: '', 
        endTime: '', 
        reason: 'Maintenance',
        isMaintenance: true 
      });
      fetchTimeSlots();
      
    } catch (error: any) {
      alert(error.message || 'Failed to schedule maintenance');
    }
  };

  const filteredCourts = selectedCourt === 'all' ? courts : courts.filter(court => court.id === parseInt(selectedCourt));

  const getSlotStats = () => {
    const stats: Record<string, number> = { available: 0, booked: 0, blocked: 0 };
    filteredCourts.forEach(court => {
      timeSlotsList.forEach(slot => {
        const status = slotStatus[court.id]?.[slot] || 'available';
        stats[status]++;
      });
    });
    return stats;
  };

  const stats = getSlotStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-black">Time Slot Management</h1>
            <p className="text-gray-600 mt-1">Loading...</p>
          </div>
        </div>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!currentFacilityId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-black">Time Slot Management</h1>
            <p className="text-gray-600 mt-1">No facilities available</p>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <i className="ri-building-line text-4xl text-yellow-400"></i>
          </div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Facilities Found</h3>
          <p className="text-yellow-700 mb-4">You need to create a facility before you can manage time slots.</p>
          <button
            onClick={() => window.location.href = '/facilitator'}
            className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors duration-200 font-medium"
          >
            Go to Facility Management
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Time Slot Management</h1>
          <p className="text-gray-400 mt-1">Manage court availability and schedules</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowMaintenanceModal(true)}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap"
          >
            Schedule Maintenance
          </button>
          <button
            onClick={() => setShowBlockModal(true)}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap"
          >
            Block Time Slots
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters and Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Court</label>
              <select
                value={selectedCourt}
                onChange={(e) => setSelectedCourt(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black pr-8 text-black"
              >
                <option value="all">All Courts</option>
                {courts.map(court => (
                  <option key={court.id} value={court.id}>{court.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Slot Statistics</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Available</span>
              </div>
              <span className="text-lg font-bold text-green-600">{stats.available}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Booked</span>
              </div>
              <span className="text-lg font-bold text-blue-600">{stats.booked}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Blocked</span>
              </div>
              <span className="text-lg font-bold text-red-600">{stats.blocked}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-black mb-4">Legend</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-50 border border-green-200 rounded flex items-center justify-center">
              <i className="ri-check-line text-green-700 text-xs"></i>
            </div>
            <span className="text-sm text-gray-700">Available - Click to block</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded flex items-center justify-center">
              <i className="ri-user-line text-blue-700 text-xs"></i>
            </div>
            <span className="text-sm text-gray-700">Booked - Cannot modify</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-50 border border-red-200 rounded flex items-center justify-center">
              <i className="ri-close-line text-red-700 text-xs"></i>
            </div>
            <span className="text-sm text-gray-700">Blocked - Click to unblock</span>
          </div>
        </div>
      </div>

      {/* Time Slot Grid */}
      {courts.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <i className="ri-table-line text-4xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Courts Found</h3>
          <p className="text-gray-600 mb-6">You need to create courts before you can manage time slots.</p>
          <button
            onClick={() => window.location.href = '/facilitator?tab=courts'}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Go to Court Management
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-black">
              Time Slots for {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <div className="max-w-5xl mx-auto p-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 w-48">
                      Court
                    </th>
                    {timeSlotsList.map(slot => (
                      <th key={slot} className="px-2 py-3 text-center text-xs font-medium text-gray-700 w-10">
                        <div className="transform -rotate-45 whitespace-nowrap">
                          {slot}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCourts.map(court => (
                    <tr key={court.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 w-48">
                        <div>
                          <div className="text-sm font-medium text-black">{court.name}</div>
                          <div className="text-sm text-gray-500">{court.sport_type}</div>
                        </div>
                      </td>
                      {timeSlotsList.map(slot => {
                        const status = slotStatus[court.id]?.[slot] || 'available';
                        return (
                          <td key={slot} className="px-2 py-4 text-center w-10">
                            <button
                              onClick={() => handleSlotClick(court.id, slot, status)}
                              disabled={status === 'booked'}
                              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${getStatusColor(status)} ${status === 'booked' ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:scale-110 hover:shadow-md'}`}
                            >
                              <i className={`${getStatusIcon(status)} text-xs`}></i>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Block Time Slots Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Block Time Slots</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Court</label>
                  <select
                    value={blockingSlot.court}
                    onChange={(e) => setBlockingSlot(prev => ({ ...prev, court: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Court</option>
                    {courts.map((court) => (
                      <option key={court.id} value={court.id}>{court.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={blockingSlot.date}
                    onChange={(e) => setBlockingSlot(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={blockingSlot.startTime}
                      onChange={(e) => setBlockingSlot(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                    <input
                      type="time"
                      value={blockingSlot.endTime}
                      onChange={(e) => setBlockingSlot(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                  <input
                    type="text"
                    value={blockingSlot.reason}
                    onChange={(e) => setBlockingSlot(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Reason for blocking"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBlockMultipleSlots}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  Block Slots
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Maintenance</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Court</label>
                  <select
                    value={maintenanceSlot.court}
                    onChange={(e) => setMaintenanceSlot(prev => ({ ...prev, court: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Court</option>
                    {courts.map((court) => (
                      <option key={court.id} value={court.id}>{court.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={maintenanceSlot.date}
                    onChange={(e) => setMaintenanceSlot(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={maintenanceSlot.startTime}
                      onChange={(e) => setMaintenanceSlot(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                    <input
                      type="time"
                      value={maintenanceSlot.endTime}
                      onChange={(e) => setMaintenanceSlot(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Type</label>
                  <select
                    value={maintenanceSlot.reason}
                    onChange={(e) => setMaintenanceSlot(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Maintenance">General Maintenance</option>
                    <option value="Equipment Repair">Equipment Repair</option>
                    <option value="Surface Maintenance">Surface Maintenance</option>
                    <option value="Cleaning">Deep Cleaning</option>
                    <option value="Inspection">Safety Inspection</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowMaintenanceModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMaintenanceSlot}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200"
                >
                  Schedule Maintenance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}