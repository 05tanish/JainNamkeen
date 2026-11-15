# Cloud deployment

This repository can deploy the React frontend to either Cloudflare Workers Static Assets or Vercel, and the Express API to Vercel's Node.js Functions.

## Cloudflare Workers (frontend)

Create a Workers project with `apps/frontend` as the project root. Set the build command to `npm run build`; the checked-in `wrangler.jsonc` publishes `dist` and enables SPA route fallback. Set `VITE_API_URL` to the deployed API URL including `/api` (for example, `https://api.example.com/api`) before building. Deploy with `npx wrangler deploy`.

Cloudflare Workers serves the static frontend only. The current Express API depends on Node.js packages and persistent database/queue clients, so it is not a Cloudflare Worker entry point.

## Vercel

Create separate Vercel projects for `apps/frontend` and `apps/backend`:

- Frontend root: `apps/frontend`. `vercel.json` builds the Vite app and rewrites client-side routes to `index.html`. Set `VITE_API_URL` to the API's public URL ending in `/api`.
- API root: `apps/backend`. `api/index.js` exports the Express app as a Node.js Function and `vercel.json` routes requests to it.

Configure backend secrets as Vercel environment variables. At minimum, the app requires the values described by `apps/backend/src/utils/validateEnv.js`; configure the managed PostgreSQL, MongoDB and Redis endpoints along with auth, email, payment, and Cloudinary credentials as needed. Set `FRONTEND_URL` to the frontend origin (comma-separated if you have multiple origins), and make sure `VITE_API_URL` points to this API deployment.

The BullMQ order worker is a persistent process and is not started by Vercel Functions. Run it on a separate worker host (`npm run worker` from `apps/backend`) or move those jobs to a serverless queue/Cloudflare Queues consumer before relying on background order processing. Use managed database services with serverless connection pooling; serverless function instances are temporary and can scale independently.

For browser sessions across different site origins, the API must allow the exact frontend origin and credentials. Prefer frontend and API custom domains on the same site so the existing secure cookie and CSRF flow works reliably.
