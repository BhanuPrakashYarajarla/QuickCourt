'use client';
import { useState } from 'react';

interface EditProfileProps {
  user: {
    name: string;
    phone: string;
    email: string;
    profilePic: string;
  };
  setUser: (user: any) => void;
  setActiveTab: (tab: string) => void;
}

export default function EditProfile({ user, setUser, setActiveTab }: EditProfileProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    phone: user.phone,
    email: user.email,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(user.profilePic);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords if changing
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        alert('New passwords do not match');
        return;
      }
      if (!formData.currentPassword) {
        alert('Current password is required to change password');
        return;
      }
      
      // Change password via API
      try {
        const userData = localStorage.getItem('userData');
        if (!userData) {
          alert('User not authenticated');
          return;
        }
        
        const user = JSON.parse(userData);
        
        const response = await fetch('http://localhost:5001/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            current_password: formData.currentPassword,
            new_password: formData.newPassword
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to change password');
        }

        alert('Password changed successfully!');
        
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        
      } catch (error: any) {
        alert(error.message || 'Failed to change password');
        return;
      }
    }

    // Update user data
    setUser({
      ...user,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      profilePic: profileImage
    });

    // Show success message and redirect
    alert('Profile updated successfully!');
    setActiveTab('bookings');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-black mb-8">Edit Profile</h2>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Picture */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center">
                  <i className="ri-user-line text-3xl text-gray-400"></i>
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-black rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors duration-200">
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-camera-line text-sm text-white"></i>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-sm text-gray-500 mt-2">Click camera icon to change profile picture</p>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-black mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-2">Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
            required
          />
        </div>

        {/* Password Change Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-black mb-4">Change Password</h3>
          <p className="text-sm text-gray-500 mb-4">Leave blank if you don't want to change your password</p>

          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-black mb-2">Current Password</label>
              <input
                type={showCurrentPassword ? "text" : "password"}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-11 text-gray-500 hover:text-black cursor-pointer"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className={`ri-eye${showCurrentPassword ? '' : '-off'}-line text-lg`}></i>
                </div>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-black mb-2">New Password</label>
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-11 text-gray-500 hover:text-black cursor-pointer"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className={`ri-eye${showNewPassword ? '' : '-off'}-line text-lg`}></i>
                  </div>
                </button>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-black mb-2">Confirm New Password</label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-11 text-gray-500 hover:text-black cursor-pointer"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className={`ri-eye${showConfirmPassword ? '' : '-off'}-line text-lg`}></i>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-6">
          <button
            type="submit"
            className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-semibold cursor-pointer whitespace-nowrap"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-semibold cursor-pointer whitespace-nowrap"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}