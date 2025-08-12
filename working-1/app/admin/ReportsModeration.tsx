
'use client';

import { useState } from 'react';

export default function ReportsModeration() {
  const [activeTab, setActiveTab] = useState('reports');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-black">Reports & Moderation</h2>
      </div>

      {/* Tabs */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'reports', name: 'User Reports', icon: 'ri-flag-line' },
            { id: 'content', name: 'Flagged Content', icon: 'ri-shield-line' },
            { id: 'moderation', name: 'Moderation Log', icon: 'ri-history-line' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-black text-white shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <i className={`${tab.icon} mr-2`}></i>
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <i className="ri-flag-line text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Reports Yet</h3>
          <p className="text-gray-500 mb-6">
            This section will display user reports and flagged content when they are submitted.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <i className="ri-user-line text-3xl text-gray-400 mb-2"></i>
              <h4 className="font-medium text-gray-700 mb-1">User Reports</h4>
              <p className="text-sm text-gray-500">Reports about users, facilities, or services</p>
            </div>
            
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <i className="ri-shield-line text-3xl text-gray-400 mb-2"></i>
              <h4 className="font-medium text-gray-700 mb-1">Content Moderation</h4>
              <p className="text-sm text-gray-500">Flagged reviews, comments, and profiles</p>
            </div>
            
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <i className="ri-history-line text-3xl text-gray-400 mb-2"></i>
              <h4 className="font-medium text-gray-700 mb-1">Moderation Log</h4>
              <p className="text-sm text-gray-500">History of all moderation actions taken</p>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
            <h4 className="font-medium text-blue-800 mb-2">How it works:</h4>
            <ul className="text-sm text-blue-700 text-left space-y-1">
              <li>• Users can report inappropriate behavior or content</li>
              <li>• Reports are reviewed by administrators</li>
              <li>• Appropriate action is taken based on severity</li>
              <li>• All actions are logged for transparency</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
