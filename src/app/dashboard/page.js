'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from '../lib/auth-context';
import GroupManager from '../components/GroupManager';
import ExpenseManager from '../components/ExpenseManager';
import DebtSimplifier from '../components/DebtSimplifier';

export default function Dashboard() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' or 'members'
  const router = useRouter();

  // Queries
  const userGroups = useQuery(
    api.groups.getByUser, 
    isAuthenticated && user ? { userId: user.id } : "skip"
  );
  
  // Get group members
  const groupMembers = useQuery(
    api.groups.getMembers,
    selectedGroupId && selectedGroupId !== 'new' ? { groupId: selectedGroupId } : "skip"
  );
  
  // Get group details
  const selectedGroup = useQuery(
    api.groups.getById,
    selectedGroupId && selectedGroupId !== 'new' ? { id: selectedGroupId } : "skip"
  );

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    console.log("Dashboard auth state:", { isLoading, isAuthenticated, user });
    if (!isLoading && !isAuthenticated) {
      console.log("Not authenticated, redirecting to sign-in");
      router.push('/sign-in');
    }
  }, [isLoading, isAuthenticated, router]);

  // Force loading state to false if we have a user
  useEffect(() => {
    if (user && isLoading) {
      console.log("User exists but isLoading is true, forcing isLoading to false");
      // We can't directly set isLoading here, but we can trigger a re-render
      // by updating a state variable that's used in the component
      setSelectedGroupId(prev => prev);
    }
  }, [user, isLoading, setSelectedGroupId]);

  if (isLoading) {
    console.log("Dashboard is loading");
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 rounded-full bg-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("Dashboard not authenticated");
    return null; // Will be redirected by the useEffect above
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient background */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 bg-white rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">SplitSplit</h1>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Sidebar - Groups */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Your Groups</h2>
              
              {!userGroups ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ) : userGroups.length === 0 ? (
                <div>
                  <p className="mb-4 text-gray-600">You don't have any groups yet.</p>
                  <button
                    onClick={() => setSelectedGroupId('new')}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-500 transition-colors"
                  >
                    Create Your First Group
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedGroupId('new')}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-500 transition-colors mb-4"
                  >
                    Create New Group
                  </button>
                  
                  {userGroups.map((group) => (
                    <div 
                      key={group._id}
                      className={`p-3 border rounded cursor-pointer transition-all ${
                        selectedGroupId === group._id 
                          ? 'bg-indigo-50 border-indigo-300 shadow-sm' 
                          : 'hover:bg-gray-50 hover:shadow-sm'
                      }`}
                      onClick={() => {
                        setSelectedGroupId(group._id);
                        setActiveTab('expenses');
                      }}
                    >
                      <h3 className="font-medium text-gray-900">{group.name}</h3>
                      {group.description && (
                        <p className="text-sm text-gray-600">{group.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2">
            {selectedGroupId === 'new' ? (
              <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Create New Group</h2>
                <GroupManager userId={user.id} />
              </div>
            ) : selectedGroupId ? (
              <div className="space-y-6">
                {/* Group Header with Tabs */}
                <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedGroup ? selectedGroup.name : 'Loading group...'}
                    </h2>
                    <div className="flex mt-4 border-b">
                      <button
                        className={`px-4 py-2 font-medium transition-colors ${
                          activeTab === 'expenses' 
                            ? 'text-indigo-600 border-b-2 border-indigo-600' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => setActiveTab('expenses')}
                      >
                        Expenses
                      </button>
                      <button
                        className={`px-4 py-2 font-medium transition-colors ${
                          activeTab === 'members' 
                            ? 'text-indigo-600 border-b-2 border-indigo-600' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => setActiveTab('members')}
                      >
                        Members
                      </button>
                    </div>
                  </div>
                  
                  {/* Tab Content */}
                  <div className="p-4">
                    {activeTab === 'expenses' ? (
                      <ExpenseManager groupId={selectedGroupId} userId={user.id} />
                    ) : (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">Group Members</h3>
                        
                        {/* Add Member Form */}
                        <div className="p-3 bg-gray-50 rounded-lg mb-4">
                          <GroupManager userId={user.id} selectedGroupId={selectedGroupId} />
                        </div>
                        
                        {/* Member List */}
                        {!groupMembers ? (
                          <div className="animate-pulse space-y-2">
                            <div className="h-16 bg-gray-200 rounded"></div>
                            <div className="h-16 bg-gray-200 rounded"></div>
                            <div className="h-16 bg-gray-200 rounded"></div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {groupMembers.map((member) => (
                              <div key={member._id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div>
                                  <p className="font-medium text-gray-900">{member.name}</p>
                                  <p className="text-sm text-gray-600">{member.email}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Debt Simplifier */}
                <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                  <DebtSimplifier groupId={selectedGroupId} />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Welcome to SplitSplit!</h2>
                <p className="mb-4 text-gray-600">
                  SplitSplit helps you track expenses and settle debts with friends, roommates, or anyone you share expenses with.
                </p>
                <p className="mb-4 text-gray-600">
                  Our smart debt simplification algorithm minimizes the number of transactions needed to settle all debts in a group.
                </p>
                <p className="text-gray-600">
                  Select a group from the sidebar or create a new one to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom gradient background */}
      <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
        <div
          className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>
    </div>
  );
}
