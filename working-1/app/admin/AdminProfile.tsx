
'use client';

import { useState, useEffect } from 'react';

export default function AdminProfile() {
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  useEffect(() => {
    // Get admin data from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setAdminData(parsed);
        setEditForm({
          full_name: parsed.full_name || '',
          email: parsed.email || '',
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } catch (err) {
        setError('Failed to parse user data');
      }
    } else {
      setError('No user data found');
    }
    setLoading(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form
      setEditForm({
        full_name: adminData.full_name || '',
        email: adminData.email || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setUpdateMessage('');
    }
    setIsEditing(!isEditing);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateMessage('');

    try {
      // Validate password change if attempting to change password
      if (editForm.new_password) {
        if (editForm.new_password !== editForm.confirm_password) {
          setUpdateMessage('New passwords do not match');
          setUpdateLoading(false);
          return;
        }
        if (!editForm.current_password) {
          setUpdateMessage('Current password is required to change password');
          setUpdateLoading(false);
          return;
        }
        if (editForm.new_password.length < 6) {
          setUpdateMessage('New password must be at least 6 characters long');
          setUpdateLoading(false);
          return;
        }
      }

      // Update profile via API
      const response = await fetch('http://localhost:5001/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: adminData.id,
          full_name: editForm.full_name,
          email: editForm.email,
          current_password: editForm.current_password,
          new_password: editForm.new_password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const updatedData = await response.json();
      
      // Update localStorage with new data
      const updatedUserData = {
        ...adminData,
        full_name: editForm.full_name,
        email: editForm.email
      };
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
      
      // Update state
      setAdminData(updatedUserData);
      setUpdateMessage('Profile updated successfully!');
      
      // Clear password fields
      setEditForm(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
      
      // Exit edit mode after successful update
      setTimeout(() => {
        setIsEditing(false);
        setUpdateMessage('');
      }, 2000);
      
    } catch (error: any) {
      setUpdateMessage(error.message || 'Failed to update profile');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userSignedIn');
    localStorage.removeItem('userData');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-black">Admin Profile</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !adminData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-black">Admin Profile</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Error: {error || 'No admin data available'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-black">Admin Profile</h2>
        <div className="flex space-x-3">
          <button
            onClick={handleEditToggle}
            className={`px-4 py-2 rounded-lg ${
              isEditing 
                ? 'bg-gray-600 text-white hover:bg-gray-700' 
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            <i className={`ri-${isEditing ? 'close' : 'edit'}-line mr-2`}></i>
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <i className="ri-logout-box-r-line mr-2"></i>
            Logout
          </button>
        </div>
      </div>

      {/* Update Message */}
      {updateMessage && (
        <div className={`p-4 rounded-lg ${
          updateMessage.includes('successfully') 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {updateMessage}
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-6 mb-6">
          <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center">
            <i className="ri-admin-line text-white text-3xl"></i>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-black">{adminData.full_name}</h3>
            <p className="text-gray-600">{adminData.email}</p>
            <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800 mt-2">
              {adminData.role.toUpperCase()}
            </span>
          </div>
        </div>

        {isEditing ? (
          // Edit Form
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-black mb-4">Edit Profile Information</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      name="full_name"
                      value={editForm.full_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={editForm.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-black mb-4">Change Password (Optional)</h4>
                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700">Current Password</label>
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="current_password"
                      value={editForm.current_password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-8 text-gray-600 hover:text-black"
                    >
                      <i className={`ri-eye${showCurrentPassword ? '' : '-off'}-line`}></i>
                    </button>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="new_password"
                      value={editForm.new_password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
                      placeholder="Enter new password (min 6 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-8 text-gray-600 hover:text-black"
                    >
                      <i className={`ri-eye${showNewPassword ? '' : '-off'}-line`}></i>
                    </button>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirm_password"
                      value={editForm.confirm_password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-8 text-gray-600 hover:text-black"
                    >
                      <i className={`ri-eye${showConfirmPassword ? '' : '-off'}-line`}></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleEditToggle}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateLoading}
                className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateLoading ? (
                  <>
                    <i className="ri-loader-line animate-spin mr-2"></i>
                    Updating...
                  </>
                ) : (
                  'Update Profile'
                )}
              </button>
            </div>
          </form>
        ) : (
          // View Mode
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-black mb-4">Account Information</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <p className="text-sm text-gray-900">{adminData.full_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <p className="text-sm text-gray-900">{adminData.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User ID</label>
                  <p className="text-sm text-gray-900">#{adminData.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Type</label>
                  <p className="text-sm text-gray-900">{adminData.role.replace('_', ' ').toUpperCase()}</p>
                </div>
                {adminData.created_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Member Since</label>
                    <p className="text-sm text-gray-900">{new Date(adminData.created_at).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-black mb-4">Admin Capabilities</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <i className="ri-user-line text-green-600"></i>
                  <span className="text-sm text-gray-900">User Management</span>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="ri-building-line text-green-600"></i>
                  <span className="text-sm text-gray-900">Facility Approval</span>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="ri-flag-line text-green-600"></i>
                  <span className="text-sm text-gray-900">Content Moderation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="ri-refund-2-line text-green-600"></i>
                  <span className="text-sm text-gray-900">Refund Management</span>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="ri-bar-chart-line text-green-600"></i>
                  <span className="text-sm text-gray-900">Analytics & Reports</span>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="ri-settings-line text-green-600"></i>
                  <span className="text-sm text-gray-900">System Settings</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-black mb-4">Quick Actions</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <i className="ri-user-add-line text-2xl text-black mb-2"></i>
            <h5 className="font-medium text-black">Add New User</h5>
            <p className="text-sm text-gray-600">Create new user accounts</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <i className="ri-building-line text-2xl text-black mb-2"></i>
            <h5 className="font-medium text-black">Review Facilities</h5>
            <p className="text-sm text-gray-600">Approve or reject facility submissions</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <i className="ri-bar-chart-line text-2xl text-black mb-2"></i>
            <h5 className="font-medium text-black">View Reports</h5>
            <p className="text-sm text-gray-600">Access system analytics and reports</p>
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-black mb-4">System Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-700 mb-3">Platform Health</h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  <i className="ri-check-line mr-1"></i>
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Services</span>
                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  <i className="ri-check-line mr-1"></i>
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">File Storage</span>
                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  <i className="ri-check-line mr-1"></i>
                  Online
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-700 mb-3">Recent Activity</h5>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Last Login:</span> Just now
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Session:</span> Active
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Permissions:</span> Full Access
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
