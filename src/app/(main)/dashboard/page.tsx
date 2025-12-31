"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { User as UserIcon, CreditCard, Layout, BadgeCheck, PlusCircle, LogOut } from 'lucide-react';

export default function UserDashboard() {
  const { currentUser, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'businesses' | 'ads'>('profile');

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  if (!currentUser) return null;

  // Get user display name from email or displayName
  const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="container mx-auto px-4 py-12 font-sans">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">

        {/* Sidebar */}
        <div className="md:w-1/4">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm text-center mb-6">
            <div className="w-20 h-20 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-serif font-bold">
              {userInitial}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
            <p className="text-sm text-gray-500 mb-4">{currentUser.email}</p>
            <div className="inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase bg-green-100 text-green-700">
              <BadgeCheck size={14} className="mr-1"/>
              Verified User
            </div>
          </div>

          <nav className="flex flex-col space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`text-left px-4 py-3 rounded font-bold flex items-center ${activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600'}`}
            >
              <UserIcon size={18} className="mr-3"/> Profile & Subscription
            </button>
            <button
              onClick={() => setActiveTab('businesses')}
              className={`text-left px-4 py-3 rounded font-bold flex items-center ${activeTab === 'businesses' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600'}`}
            >
              <Layout size={18} className="mr-3"/> My Business Listings
            </button>
            <button
              onClick={() => setActiveTab('ads')}
              className={`text-left px-4 py-3 rounded font-bold flex items-center ${activeTab === 'ads' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600'}`}
            >
              <CreditCard size={18} className="mr-3"/> Manage Ads
            </button>
            <button onClick={handleLogout} className="text-left px-4 py-3 rounded font-bold flex items-center text-red-600 hover:bg-red-50 mt-4">
              <LogOut size={18} className="mr-3"/> Sign Out
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="md:w-3/4">
          {activeTab === 'profile' && (
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b">Subscription Status</h2>
              <div className="bg-gray-50 p-6 rounded border border-gray-200 flex justify-between items-center mb-8">
                <div>
                  <p className="text-sm text-gray-500 font-bold uppercase">Current Plan</p>
                  <h3 className="text-2xl font-serif font-bold text-blue-600 capitalize">Free Member</h3>
                  <p className="text-sm text-gray-600 mt-1">Joined: {currentUser.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'N/A'}</p>
                </div>
                <button className="bg-gray-900 text-white px-4 py-2 rounded font-bold hover:bg-gray-800">Upgrade Plan</button>
              </div>

              <h3 className="font-bold text-lg mb-4">Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Full Name</label>
                  <input type="text" value={displayName} readOnly className="w-full border rounded p-2 bg-gray-50"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Email Address</label>
                  <input type="text" value={currentUser.email || ''} readOnly className="w-full border rounded p-2 bg-gray-50"/>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'businesses' && (
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <h2 className="text-2xl font-bold text-gray-900">My Listings</h2>
                <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-blue-700">
                  <PlusCircle size={16} className="mr-2"/> Add Business
                </button>
              </div>

              {/* Empty State */}
              <div className="text-center py-12 bg-gray-50 rounded border border-dashed border-gray-300">
                <Layout size={48} className="mx-auto text-gray-300 mb-4"/>
                <h3 className="text-gray-900 font-bold mb-1">No businesses listed yet</h3>
                <p className="text-gray-500 text-sm mb-4">Add your business to the WNC Times directory.</p>
              </div>
            </div>
          )}

          {activeTab === 'ads' && (
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <h2 className="text-2xl font-bold text-gray-900">Ad Campaigns</h2>
                <button className="flex items-center bg-yellow-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-yellow-700">
                  <PlusCircle size={16} className="mr-2"/> Create New Ad
                </button>
              </div>

              <div className="text-center py-12 bg-gray-50 rounded border border-dashed border-gray-300">
                <CreditCard size={48} className="mx-auto text-gray-300 mb-4"/>
                <h3 className="text-gray-900 font-bold mb-1">No active campaigns</h3>
                <p className="text-gray-500 text-sm mb-4">Start advertising to reach local customers today.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
