"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function SSOCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    // Wait for auth to be loaded
    if (!isLoaded) {
      return;
    }

    // If user is signed in, redirect them
    if (isSignedIn) {
      // Get the redirect URL from the query parameters
      const redirectUrl = searchParams.get("redirect_url") || "/dashboard";
      router.push(redirectUrl);
    }
  }, [isLoaded, isSignedIn, router, searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Completing your sign-in...
        </h2>
        <p className="text-gray-600">
          You&apos;ve been successfully signed in with SSO.
        </p>
        <div className="mt-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    </div>
  );
}
