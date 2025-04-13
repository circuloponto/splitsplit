export default {
  // Add CORS configuration to allow requests from your Vercel deployment
  cors: {
    // Allow requests from any origin in development
    // In production, you might want to restrict this to just your Vercel domain
    origins: [
      // Allow requests from localhost for development
      "http://localhost:3000",
      "https://localhost:3000",
      
      // Allow requests from your Vercel deployment
      // Replace these with your actual Vercel deployment URLs
      "https://splitsplit.vercel.app",
      "https://splitsplit-nuno-cortezs-projects.vercel.app",
      "https://splitsplit-git-main-nuno-cortezs-projects.vercel.app",
      
      // Wildcard for all Vercel preview deployments
      // This is optional but helpful during development
      "https://*.vercel.app"
    ],
  }
};
