
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FacilitatorDashboard from './FacilitatorDashboard';
import FacilityManagement from './FacilityManagement';
import CourtManagement from './CourtManagement';
import TimeSlotManagement from './TimeSlotManagement';
import BookingOverview from './BookingOverview';
import FacilitatorProfile from './FacilitatorProfile';

export default function FacilitatorPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication and user role
    const userSignedIn = localStorage.getItem('userSignedIn') === 'true';
    const userData = localStorage.getItem('userData');
    
    if (!userSignedIn) {
      router.push('/login');
      return;
    }
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.role !== 'facility_owner') {
          // Redirect non-facilitators to home page
          router.push('/');
          return;
        }
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/login');
        return;
      }
    } else {
      router.push('/login');
      return;
    }
    
    setIsLoading(false);
  }, [router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <i className="ri-loader-4-line text-4xl text-gray-400 animate-spin"></i>
          </div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: 'ri-dashboard-line' },
    { id: 'facility', name: 'Facility Management', icon: 'ri-building-line' },
    { id: 'courts', name: 'Court Management', icon: 'ri-table-line' },
    { id: 'schedule', name: 'Time Slots', icon: 'ri-calendar-line' },
    { id: 'bookings', name: 'Bookings', icon: 'ri-book-line' },
    { id: 'profile', name: 'Profile', icon: 'ri-user-line' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <FacilitatorDashboard />;
      case 'facility':
        return <FacilityManagement />;
      case 'courts':
        return <CourtManagement />;
      case 'schedule':
        return <TimeSlotManagement />;
      case 'bookings':
        return <BookingOverview />;
      case 'profile':
        return <FacilitatorProfile />;
      default:
        return <FacilitatorDashboard />;
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
                <i className="ri-shield-user-line text-black text-xl"></i>
              </div>
              <div>
                <h2 className="text-xl font-['Pacifico'] text-white">QuickCourt</h2>
                <p className="text-sm text-gray-400">Facilitator Panel</p>
              </div>
            </div>
          </div>
          <nav className="mt-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-800 transition-colors cursor-pointer whitespace-nowrap ${
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
