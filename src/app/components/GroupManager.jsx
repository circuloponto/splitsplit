"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../lib/auth-context";

export default function GroupManager({ userId, selectedGroupId: initialGroupId }) {
  const { user, isAuthenticated } = useAuth();
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId || null);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  
  // Update selectedGroupId when initialGroupId changes
  useEffect(() => {
    if (initialGroupId) {
      setSelectedGroupId(initialGroupId);
    }
  }, [initialGroupId]);
  
  // Use the passed userId or get it from auth context
  const currentUserId = userId || (user ? user.id : null);
  
  // Mutations
  const createGroup = useMutation(api.groups.create);
  const addMember = useMutation(api.groups.addMember);
  
  // Queries
  const userGroups = useQuery(
    api.groups.getByUser, 
    isAuthenticated && currentUserId ? { userId: currentUserId } : "skip"
  );
  
  const groupMembers = useQuery(
    api.groups.getMembers,
    selectedGroupId ? { groupId: selectedGroupId } : "skip"
  );
  
  // Query to find users by email
  const findUserByEmail = useQuery(
    api.users.getByEmail,
    newMemberEmail ? { email: newMemberEmail } : "skip"
  );
  
  // Handle group creation
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !currentUserId) return;
    
    try {
      const groupId = await createGroup({
        name: groupName,
        description: groupDescription,
        createdBy: currentUserId,
        initialMembers: [currentUserId],
      });
      
      setGroupName("");
      setGroupDescription("");
      setSelectedGroupId(groupId);
      
      alert("Group created successfully!");
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group. Please try again.");
    }
  };
  
  // Handle adding a new member to the group
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedGroupId || !newMemberEmail) return;
    
    setIsAddingMember(true);
    
    try {
      // Check if user exists
      if (!findUserByEmail) {
        alert("No user found with this email. They need to sign up first.");
        setIsAddingMember(false);
        return;
      }
      
      // Add member to the group
      await addMember({
        groupId: selectedGroupId,
        userId: findUserByEmail._id,
      });
      
      setNewMemberEmail("");
      alert("Member added successfully!");
    } catch (error) {
      console.error("Error adding member:", error);
      alert("Failed to add member. Please try again.");
    } finally {
      setIsAddingMember(false);
    }
  };
  
  // Handle group selection
  const handleSelectGroup = (groupId) => {
    setSelectedGroupId(groupId);
    setNewMemberEmail("");
  };
  
  // If we're in the Members tab, only show the add member form
  if (initialGroupId) {
    return (
      <div>
        <form onSubmit={handleAddMember} className="space-y-4">
          <h3 className="text-md font-medium mb-2">Add New Member</h3>
          <div className="flex space-x-2">
            <input
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="Email address"
              required
            />
            <button
              type="submit"
              disabled={isAddingMember}
              className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isAddingMember ? "Adding..." : "Add Member"}
            </button>
          </div>
          {newMemberEmail && findUserByEmail === null && (
            <p className="text-sm text-red-500 mt-1">
              No user found with this email. They need to sign up first.
            </p>
          )}
        </form>
      </div>
    );
  }
  
  // Otherwise, show the full group management UI
  return (
    <div className="space-y-8">
      {/* Create Group Form */}
      <div className="p-4 border rounded shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Create New Group</h2>
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div>
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">
              Group Name
            </label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="e.g., Trip to Paris"
              required
            />
          </div>
          
          <div>
            <label htmlFor="groupDescription" className="block text-sm font-medium text-gray-700">
              Description (Optional)
            </label>
            <textarea
              id="groupDescription"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="e.g., Expenses for our summer trip"
              rows={3}
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
          >
            Create Group
          </button>
        </form>
      </div>
      
      {/* Group List */}
      <div className="p-4 border rounded shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Your Groups</h2>
        
        {!userGroups ? (
          <p>Loading your groups...</p>
        ) : userGroups.length === 0 ? (
          <p>You don't have any groups yet. Create one above!</p>
        ) : (
          <div className="space-y-2">
            {userGroups.map((group) => (
              <div 
                key={group._id}
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  selectedGroupId === group._id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleSelectGroup(group._id)}
              >
                <h3 className="font-medium">{group.name}</h3>
                {group.description && (
                  <p className="text-sm text-gray-600">{group.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Created {new Date(group.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Selected Group Details */}
      {selectedGroupId && groupMembers && (
        <div className="p-4 border rounded shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            Group Members
          </h2>
          
          {/* Add Member Form */}
          <form onSubmit={handleAddMember} className="mb-6 p-3 bg-gray-50 rounded">
            <h3 className="text-md font-medium mb-2">Add New Member</h3>
            <div className="flex space-x-2">
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Email address"
                required
              />
              <button
                type="submit"
                disabled={isAddingMember}
                className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isAddingMember ? "Adding..." : "Add"}
              </button>
            </div>
            {newMemberEmail && findUserByEmail === null && (
              <p className="text-sm text-red-500 mt-1">
                No user found with this email. They need to sign up first.
              </p>
            )}
          </form>
          
          {/* Member List */}
          {!groupMembers ? (
            <p>Loading members...</p>
          ) : (
            <div className="space-y-2">
              {groupMembers.map((member) => (
                <div key={member._id} className="flex items-center p-2 border-b">
                  {member.avatarUrl && (
                    <img 
                      src={member.avatarUrl} 
                      alt={member.name} 
                      className="w-8 h-8 rounded-full mr-3"
                    />
                  )}
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
