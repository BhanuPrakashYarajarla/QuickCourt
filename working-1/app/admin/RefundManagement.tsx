
'use client';

import { useState } from 'react';

export default function RefundManagement() {
  const [activeTab, setActiveTab] = useState('pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-black">Refund Management</h2>
      </div>

      {/* Tabs */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'pending', name: 'Pending Refunds', icon: 'ri-time-line' },
            { id: 'approved', name: 'Approved Refunds', icon: 'ri-check-line' },
            { id: 'rejected', name: 'Rejected Refunds', icon: 'ri-close-line' },
            { id: 'history', name: 'Refund History', icon: 'ri-history-line' }
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
          <i className="ri-refund-2-line text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Refund Requests Yet</h3>
          <p className="text-gray-500 mb-6">
            This section will display refund requests and allow administrators to approve or reject them.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <i className="ri-time-line text-3xl text-gray-400 mb-2"></i>
              <h4 className="font-medium text-gray-700 mb-1">Pending Refunds</h4>
              <p className="text-sm text-gray-500">Refund requests awaiting review</p>
            </div>
            
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <i className="ri-check-line text-3xl text-gray-400 mb-2"></i>
              <h4 className="font-medium text-gray-700 mb-1">Approved Refunds</h4>
              <p className="text-sm text-gray-500">Successfully processed refunds</p>
            </div>
            
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <i className="ri-close-line text-3xl text-gray-400 mb-2"></i>
              <h4 className="font-medium text-gray-700 mb-1">Rejected Refunds</h4>
              <p className="text-sm text-gray-500">Refund requests that were denied</p>
            </div>
            
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <i className="ri-history-line text-3xl text-gray-400 mb-2"></i>
              <h4 className="font-medium text-gray-700 mb-1">Refund History</h4>
              <p className="text-sm text-gray-500">Complete record of all refunds</p>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
            <h4 className="font-medium text-blue-800 mb-2">How refund management works:</h4>
            <ul className="text-sm text-blue-700 text-left space-y-1">
              <li>• Users can request refunds for cancelled or problematic bookings</li>
              <li>• Administrators review refund requests with supporting evidence</li>
              <li>• Refunds can be approved, rejected, or require additional information</li>
              <li>• All refund decisions are logged for audit purposes</li>
              <li>• Approved refunds are processed through the payment system</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
