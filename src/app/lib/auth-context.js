"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

// Create the authentication context
const AuthContext = createContext(null);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState(() => {
    // Check if we're in the browser
    if (typeof window !== "undefined") {
      return localStorage.getItem("sessionToken");
    }
    return null;
  });

  // Convex mutations and queries
  const signIn = useMutation(api.auth.signIn);
  const signUp = useMutation(api.auth.signUp);
  const signOutMutation = useMutation(api.auth.signOut);
  const session = useQuery(
    api.auth.validateSession, 
    sessionToken ? { token: sessionToken } : "skip"
  );

  // Initialize auth state
  useEffect(() => {
    console.log("Auth state effect running:", { sessionToken, session, user });
    
    // If we have a session token but no user, try to validate the session
    if (sessionToken && !user) {
      console.log("Have session token but no user, validating session");
      // The session validation will happen automatically via the useQuery hook
    }
    
    // If we have a session with a user, update the user state
    if (session && session.user) {
      console.log("Setting user from session:", session.user);
      setUser(session.user);
      setIsLoading(false);
    }
    
    // If we have a session token but no session or no user in the session, clear the state
    if (sessionToken && session === null) {
      console.log("Session validation failed, clearing state");
      // Don't clear the state immediately, wait a bit to see if the session validation completes
      const timer = setTimeout(() => {
        if (session === null) {
          console.log("Session validation still failed after delay, clearing state");
          setUser(null);
          setSessionToken(null);
          localStorage.removeItem("sessionToken");
          setIsLoading(false);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    // If we have a session token but session is undefined (not null), this is a loading state
    if (sessionToken && session === undefined) {
      console.log("Session is undefined, waiting for validation to complete");
      // Keep isLoading true while we wait for the session to be validated
      setIsLoading(true);
    }
    
    // If we don't have a session token, ensure user is null
    if (!sessionToken) {
      console.log("No session token, ensuring user is null");
      setUser(null);
      setIsLoading(false);
    }
    
    // If we have a user but isLoading is still true, set isLoading to false
    if (user && isLoading) {
      console.log("User exists but isLoading is true, setting isLoading to false");
      setIsLoading(false);
    }
  }, [sessionToken, session, user, isLoading]);

  // Sign in function
  const login = async (email, password) => {
    try {
      console.log("Auth context: Starting login process");
      const result = await signIn({ email, password });
      console.log("Auth context: Sign in successful, result:", result);
      
      // Set the session token first
      setSessionToken(result.sessionToken);
      localStorage.setItem("sessionToken", result.sessionToken);
      
      // Set the user directly from the result
      if (result.user) {
        console.log("Setting user directly from login result:", result.user);
        setUser(result.user);
      } else {
        console.error("Login result missing user object");
        throw new Error("Login failed: Missing user data");
      }
      
      return result;
    } catch (error) {
      console.error("Auth context: Sign in error:", error);
      throw error;
    }
  };

  // Sign up function
  const register = async (name, email, password) => {
    try {
      await signUp({ name, email, password });
      // After sign up, sign in automatically
      return await login(email, password);
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  };

  // Sign out function
  const logout = async () => {
    if (sessionToken) {
      try {
        await signOutMutation({ sessionToken });
      } catch (error) {
        console.error("Sign out error:", error);
      }
    }
    
    setSessionToken(null);
    setUser(null);
    localStorage.removeItem("sessionToken");
  };

  // Auth context value
  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
