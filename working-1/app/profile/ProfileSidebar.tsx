'use client';

interface ProfileSidebarProps {
  user: {
    name: string;
    phone: string;
    email: string;
    profilePic: string;
  };
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function ProfileSidebar({ user, activeTab, setActiveTab }: ProfileSidebarProps) {
  return (
    <div className="w-80 bg-white rounded-lg border border-gray-200 p-6">
      {/* Profile Section */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          {user.profilePic ? (
            <img 
              src={user.profilePic} 
              alt="Profile" 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 flex items-center justify-center">
              <i className="ri-user-line text-3xl text-gray-400"></i>
            </div>
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-black mb-1">{user.name}</h3>
        <p className="text-sm text-gray-600 mb-1">{user.phone}</p>
        <p className="text-sm text-gray-600">{user.email}</p>
      </div>

      {/* Navigation */}
      <div className="space-y-2">
        <button
          onClick={() => setActiveTab('edit-profile')}
          className={`w-full py-3 px-4 rounded-lg text-left font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap ${
            activeTab === 'edit-profile'
              ? 'bg-gray-100 text-black'
              : 'text-gray-600 hover:bg-gray-50 hover:text-black'
          }`}
        >
          Edit Profile
        </button>
        
        <button
          onClick={() => setActiveTab('bookings')}
          className={`w-full py-3 px-4 rounded-lg text-left font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap ${
            activeTab === 'bookings'
              ? 'bg-green-100 text-green-800'
              : 'text-gray-600 hover:bg-gray-50 hover:text-black'
          }`}
        >
          All Bookings
        </button>
      </div>
    </div>
  );
}