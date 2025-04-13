"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../lib/auth-context";

export default function ExpenseManager({ groupId, userId }) {
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitType, setSplitType] = useState("equal"); // equal, custom
  const [customSplits, setCustomSplits] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Use the passed userId or get it from auth context
  const currentUserId = userId || (user ? user.id : null);
  
  // Mutations
  const createExpense = useMutation(api.expenses.create);
  const deleteExpense = useMutation(api.expenses.deleteExpense);
  
  // Queries
  const groupMembers = useQuery(api.groups.getMembers, groupId ? { groupId } : "skip");
  const groupExpenses = useQuery(api.expenses.getByGroup, groupId ? { groupId } : "skip");
  
  // Set the current user as the payer by default when members load
  useEffect(() => {
    if (groupMembers && groupMembers.length > 0 && !paidBy && currentUserId) {
      const currentUser = groupMembers.find(member => member._id === currentUserId);
      if (currentUser) {
        setPaidBy(currentUser._id);
      }
    }
  }, [groupMembers, currentUserId, paidBy]);
  
  // Initialize custom splits when members change or amount changes
  useEffect(() => {
    if (groupMembers && groupMembers.length > 0) {
      const numMembers = groupMembers.length;
      const amountValue = parseFloat(amount) || 0;
      const equalShare = numMembers > 0 ? amountValue / numMembers : 0;
      
      const initialSplits = {};
      groupMembers.forEach(member => {
        initialSplits[member._id] = equalShare;
      });
      setCustomSplits(initialSplits);
    }
  }, [groupMembers, amount]);
  
  // Handle expense creation
  const handleCreateExpense = async (e) => {
    e.preventDefault();
    
    if (!groupId || !paidBy || !amount || !description) {
      alert("Please fill in all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Calculate splits based on the selected split type
      let splits = [];
      const totalAmount = parseFloat(amount);
      
      if (splitType === "equal") {
        // Equal split among all members
        const splitAmount = totalAmount / groupMembers.length;
        splits = groupMembers.map(member => ({
          userId: member._id,
          amount: splitAmount
        }));
      } else if (splitType === "custom") {
        // Custom split based on user input
        splits = Object.entries(customSplits).map(([userId, splitAmount]) => ({
          userId,
          amount: parseFloat(splitAmount) || 0
        }));
        
        // Validate that the sum of splits equals the total amount
        const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0);
        if (Math.abs(totalSplit - totalAmount) > 0.01) {
          alert(`The sum of splits (${totalSplit.toFixed(2)}) doesn't match the total amount (${totalAmount.toFixed(2)})`);
          setIsSubmitting(false);
          return;
        }
      }
      
      // Create the expense
      await createExpense({
        groupId,
        description,
        amount: totalAmount,
        paidBy,
        date: Date.now(),
        splits
      });
      
      // Reset form
      setDescription("");
      setAmount("");
      setSplitType("equal");
      
      alert("Expense added successfully!");
    } catch (error) {
      console.error("Error creating expense:", error);
      alert("Failed to add expense. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle expense deletion
  const handleDeleteExpense = async (expenseId, e) => {
    e.stopPropagation(); // Prevent event bubbling
    
    if (!confirm("Are you sure you want to delete this expense?")) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      await deleteExpense({ expenseId });
      alert("Expense deleted successfully!");
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Failed to delete expense. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Handle custom split change
  const handleSplitChange = (userId, value) => {
    setCustomSplits(prev => ({
      ...prev,
      [userId]: value
    }));
  };
  
  // Helper function to get user name from ID
  const getUserName = (userId) => {
    if (!groupMembers) return userId;
    const member = groupMembers.find(m => m._id === userId);
    return member ? member.name : userId;
  };
  
  if (!groupMembers) {
    return <div>Loading group members...</div>;
  }
  
  // Calculate the total allocated amount for custom splits
  const totalAllocated = Object.values(customSplits).reduce(
    (sum, val) => sum + (parseFloat(val) || 0), 
    0
  );
  
  // Check if the allocated amount matches the total
  const amountValue = parseFloat(amount) || 0;
  const isBalanced = Math.abs(totalAllocated - amountValue) < 0.01;
  
  return (
    <div className="space-y-8">
      {/* Add Expense Form */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Add New Expense</h2>
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="e.g., Dinner at Restaurant"
              required
            />
          </div>
          
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="0.00"
              step="0.01"
              min="0.01"
              required
            />
          </div>
          
          <div>
            <label htmlFor="paidBy" className="block text-sm font-medium text-gray-700">
              Paid By
            </label>
            <select
              id="paidBy"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            >
              <option value="">Select who paid</option>
              {groupMembers.map(member => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Split Type
            </label>
            <div className="mt-1 space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="equal"
                  checked={splitType === "equal"}
                  onChange={() => setSplitType("equal")}
                  className="form-radio"
                />
                <span className="ml-2">Equal</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="custom"
                  checked={splitType === "custom"}
                  onChange={() => setSplitType("custom")}
                  className="form-radio"
                />
                <span className="ml-2">Custom</span>
              </label>
            </div>
          </div>
          
          {splitType === "custom" && (
            <div className="border p-3 rounded">
              <h3 className="font-medium mb-2">Custom Split</h3>
              <p className={`text-sm mb-3 ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                Total: ${amountValue.toFixed(2)} | 
                Allocated: ${totalAllocated.toFixed(2)} |
                {isBalanced 
                  ? ' Balanced ✓' 
                  : ` Difference: $${Math.abs(totalAllocated - amountValue).toFixed(2)}`}
              </p>
              
              <div className="space-y-2">
                {groupMembers.map(member => (
                  <div key={member._id} className="flex items-center justify-between">
                    <span>{member.name}</span>
                    <input
                      type="number"
                      value={customSplits[member._id] || ""}
                      onChange={(e) => handleSplitChange(member._id, e.target.value)}
                      className="border rounded p-1 w-24 text-right"
                      step="0.01"
                      min="0"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting || (splitType === "custom" && !isBalanced)}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Adding..." : "Add Expense"}
          </button>
        </form>
      </div>
      
      {/* Expense List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Expenses</h2>
        
        {!groupExpenses ? (
          <p>Loading expenses...</p>
        ) : groupExpenses.length === 0 ? (
          <p>No expenses in this group yet.</p>
        ) : (
          <div className="space-y-3">
            {groupExpenses.map((expense) => (
              <div key={expense._id} className="p-3 border rounded relative group overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{expense.description}</h3>
                    <p className="text-sm text-gray-600">
                      Paid by {getUserName(expense.paidBy)}
                    </p>
                  </div>
                  <div className="text-right transition-transform duration-300 group-hover:-translate-x-[50px]">
                    <p className="font-bold">${expense.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {/* Delete button (slides in from right) */}
                <button
                  onClick={(e) => handleDeleteExpense(expense._id, e)}
                  disabled={isDeleting}
                  className="absolute top-1/2 -mt-4 right-3 translate-x-[60px] group-hover:translate-x-0 transition-transform duration-300 
                  bg-red-100 hover:bg-blue-600 text-red-600 hover:text-red-800 h-8 w-8 rounded-full flex items-center justify-center text-xl font-bold"
                  title="Delete expense"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
