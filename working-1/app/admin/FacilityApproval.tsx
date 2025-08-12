
'use client';

import { useState, useEffect } from 'react';

export default function FacilityApproval() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFacility, setSelectedFacility] = useState<any>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState('');
  const [comments, setComments] = useState('');
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/admin/facilities');
      if (!response.ok) {
        throw new Error('Failed to fetch facilities');
      }
      const data = await response.json();
      setFacilities(data.facilities);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (facilityId: number, action: string, comments: string) => {
    try {
      const response = await fetch(`http://localhost:5001/admin/facilities/${facilityId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action,
          comments: comments
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update facility status');
      }

      // Refresh facilities list
      await fetchFacilities();
      setShowApprovalModal(false);
      setSelectedFacility(null);
      setApprovalAction('');
      setComments('');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredFacilities = facilities.filter(facility => {
    const matchesSearch = facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         facility.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || facility.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-black">Facility Approval</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading facilities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-black">Facility Approval</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={fetchFacilities}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-black">Facility Approval</h2>
        <div className="text-sm text-gray-600">
          Total Facilities: {facilities.length}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by facility name or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFacilities.map((facility) => (
          <div key={facility.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Facility Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-black">{facility.name}</h3>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(facility.status)}`}>
                  {facility.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">{facility.owner}</p>
              <p className="text-sm text-gray-500">{facility.email}</p>
            </div>

            {/* Facility Details */}
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <p className="text-sm text-gray-900">{facility.location}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Sports</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {facility.sports.map((sport: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {sport}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Submission Date</label>
                <p className="text-sm text-gray-900">{new Date(facility.submission_date).toLocaleDateString()}</p>
              </div>

              {facility.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="text-sm text-gray-900 line-clamp-2">{facility.description}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedFacility(facility);
                    setShowApprovalModal(true);
                  }}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/20"
                >
                  View Details
                </button>
                {facility.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedFacility(facility);
                        setApprovalAction('approve');
                        setShowApprovalModal(true);
                      }}
                      className="px-3 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedFacility(facility);
                        setApprovalAction('reject');
                        setShowApprovalModal(true);
                      }}
                      className="px-3 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredFacilities.length === 0 && (
        <div className="text-center py-8">
          <i className="ri-building-line text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-600">No facilities found matching your criteria</p>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedFacility && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-black">
                {approvalAction === 'approve' ? 'Approve' : approvalAction === 'reject' ? 'Reject' : 'View'} Facility
              </h3>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedFacility(null);
                  setApprovalAction('');
                  setComments('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Facility Name</label>
                <p className="text-sm text-gray-900">{selectedFacility.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Owner</label>
                <p className="text-sm text-gray-900">{selectedFacility.owner}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900">{selectedFacility.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <p className="text-sm text-gray-900">{selectedFacility.location}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sports</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedFacility.sports.map((sport: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {sport}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Submission Date</label>
                <p className="text-sm text-gray-900">{new Date(selectedFacility.submission_date).toLocaleDateString()}</p>
              </div>
              {selectedFacility.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="text-sm text-gray-900">{selectedFacility.description}</p>
                </div>
              )}
              
              {(approvalAction === 'approve' || approvalAction === 'reject') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {approvalAction === 'approve' ? 'Approval' : 'Rejection'} Comments
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder={`Enter ${approvalAction === 'approve' ? 'approval' : 'rejection'} comments...`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 mt-1"
                    rows={3}
                  />
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedFacility(null);
                  setApprovalAction('');
                  setComments('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              {(approvalAction === 'approve' || approvalAction === 'reject') && (
                <button
                  onClick={() => handleApproval(selectedFacility.id, approvalAction, comments)}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 ${
                    approvalAction === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  }`}
                >
                  {approvalAction === 'approve' ? 'Approve' : 'Reject'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
