import { app } from '../src/App.js';

// Vercel's Node.js function adapter serves the Express app without opening a
// long-lived listener. Database connections are created lazily by the app's
// handlers and should use managed, serverless-compatible database services.
export default app;
