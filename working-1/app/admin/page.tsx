
'use client';

import { useState } from 'react';
import AdminDashboard from './AdminDashboard';
import FacilityApproval from './FacilityApproval';
import UserManagement from './UserManagement';
import ReportsModeration from './ReportsModeration';
import RefundManagement from './RefundManagement';
import AdminProfile from './AdminProfile';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: 'ri-dashboard-line' },
    { id: 'facilities', name: 'Facility Approval', icon: 'ri-building-line' },
    { id: 'users', name: 'User Management', icon: 'ri-user-line' },
    { id: 'reports', name: 'Reports & Moderation', icon: 'ri-flag-line' },
    { id: 'refunds', name: 'Refund Management', icon: 'ri-refund-2-line' },
    { id: 'profile', name: 'Profile', icon: 'ri-admin-line' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'facilities':
        return <FacilityApproval />;
      case 'users':
        return <UserManagement />;
      case 'reports':
        return <ReportsModeration />;
      case 'refunds':
        return <RefundManagement />;
      case 'profile':
        return <AdminProfile />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-black shadow-lg border-r border-gray-200">
          <div className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <i className="ri-admin-line text-black text-xl"></i>
              </div>
              <div>
                <h2 className="text-xl font-['Pacifico'] text-white">QuickCourt</h2>
                <p className="text-sm text-gray-400">Admin Panel</p>
              </div>
            </div>
          </div>
          
          <nav className="mt-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-800 transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-gray-800 border-r-4 border-white text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <i className={`${tab.icon} text-xl mr-3`}></i>
                <span className="font-medium">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 bg-white">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
