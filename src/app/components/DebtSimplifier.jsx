"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function DebtSimplifier({ groupId }) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Get simplified debts from Convex
  const simplifiedDebts = useQuery(api.settlements.getSimplifiedDebts, 
    groupId ? { groupId } : "skip"
  );
  
  // Get group members
  const members = useQuery(api.groups.getMembers, 
    groupId ? { groupId } : "skip"
  );
  
  // Get group details
  const group = useQuery(api.groups.getById, 
    groupId ? { id: groupId } : "skip"
  );
  
  // Helper function to get user name from ID
  const getUserName = (userId) => {
    if (!members) return userId;
    const member = members.find(m => m._id === userId);
    return member ? member.name : userId;
  };
  
  if (!simplifiedDebts || !members || !group) {
    return (
      <div className="p-4 border rounded shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Simplified Debts</h2>
        <p>Loading debt information...</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 border rounded shadow-sm">
      <h2 className="text-xl font-semibold mb-4">
        Simplified Debts for {group.name}
      </h2>
      
      {simplifiedDebts.length === 0 ? (
        <p>No debts to settle in this group.</p>
      ) : (
        <div>
          <p className="mb-4">
            These are the simplified payments that will settle all debts in the group
            with the minimum number of transactions:
          </p>
          
          <ul className="space-y-2">
            {simplifiedDebts.map((payment, index) => (
              <li key={index} className="p-2 bg-gray-50 rounded flex justify-between">
                <span className="font-medium">{getUserName(payment.from)}</span>
                <span className="flex items-center">
                  <span className="mx-2">owes</span>
                  <span className="font-medium">{getUserName(payment.to)}</span>
                </span>
                <span className="font-bold">${payment.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
