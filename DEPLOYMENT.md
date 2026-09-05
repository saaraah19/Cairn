# Deploying Cairn to Render

This guide covers deploying Cairn as two separate Render services — a **Web Service** for the backend and a **Static Site** for the frontend — plus the external service configuration each one needs.

## Before you start

You'll need accounts/credentials for:
- **MongoDB Atlas** (already set up if you've been developing locally)
- **Cloudinary** (already set up)
- **Google Cloud Console** (already set up, for Google sign-in)
- **Render** (new)

## 1. MongoDB Atlas — allow Render to connect

Render doesn't provide a static outbound IP on free/starter plans, so you can't allowlist a specific IP the way you might elsewhere.

1. In Atlas → **Network Access** → **Add IP Address** → allow `0.0.0.0/0` (all IPs)
2. This is safe *because* the database itself still requires username/password authentication — you're not exposing data, just allowing connection attempts. If you later upgrade to a Render plan with a static IP, you can tighten this.

## 2. Backend — Render Web Service

1. Render Dashboard → **New** → **Web Service** → connect your GitHub repo
2. **Root Directory**: `server`
3. **Environment**: Node
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. **Environment Variables** (Render's dashboard, not a committed `.env`):

   ```
   NODE_ENV=production
   MONGODB_URI=<your Atlas connection string>
   CLIENT_URL=<your frontend's Render URL, e.g. https://cairn-client.onrender.com>
   JWT_ACCESS_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
   JWT_REFRESH_SECRET=<generate the same way — a DIFFERENT value>
   GOOGLE_CLIENT_ID=<from Google Cloud Console>
   CLOUDINARY_CLOUD_NAME=<from Cloudinary dashboard>
   CLOUDINARY_API_KEY=<from Cloudinary dashboard>
   CLOUDINARY_API_SECRET=<from Cloudinary dashboard>
   ```

   Don't set `PORT` — Render injects it automatically, and the app already reads `process.env.PORT`.

   **`NODE_ENV=production` matters beyond logging** — it's what switches auth cookies to `SameSite=None; Secure`, which is required for the frontend and backend (separate Render services, different subdomains) to share a session at all. Without it, login will appear to silently fail.

7. Deploy, then note the resulting URL (e.g. `https://cairn-server.onrender.com`) — you'll need it for the frontend's env var below.

## 3. Frontend — Render Static Site

1. Render Dashboard → **New** → **Static Site** → same repo
2. **Root Directory**: `client`
3. **Build Command**: `npm install && npm run build`
4. **Publish Directory**: `dist`
5. **Environment Variables** (these are baked into the build at build-time, not read at runtime — set them *before* the first deploy):

   ```
   VITE_API_BASE_URL=<your backend's Render URL from step 2.7>
   VITE_GOOGLE_CLIENT_ID=<same value as the backend's GOOGLE_CLIENT_ID>
   ```

6. **Add a rewrite rule** (Render Static Sites → your site → Redirects/Rewrites): Cairn is a single-page app with client-side routing, so without this, refreshing on any page other than `/` will 404.

   ```
   Source: /*
   Destination: /index.html
   Action: Rewrite
   ```

7. Deploy, then note the resulting URL.

## 4. Update the backend's CLIENT_URL

Once you know the frontend's actual deployed URL, go back to the backend service's environment variables and make sure `CLIENT_URL` matches it exactly (including `https://`, no trailing slash). Redeploy the backend if you changed it after the first deploy.

## 5. Google Cloud Console — add the production origin

**Credentials → your OAuth Client → Authorized JavaScript origins** → add your frontend's Render URL (e.g. `https://cairn-client.onrender.com`). Keep `http://localhost:5173` in the list too if you still want Google sign-in to work in local dev.

Changes here can take a few minutes to propagate.

## 6. Cloudinary

No configuration needed — uploads go through your backend using the API key/secret, not tied to a specific frontend origin.

## 7. Verify

Run the security and smoke-test scripts against the deployed backend:

```bash
BASE_URL=https://cairn-server.onrender.com bash server/scripts/test-security-flow.sh
BASE_URL=https://cairn-server.onrender.com bash server/scripts/test-auth-flow.sh
```

Then in the browser, on the deployed frontend URL: register, log in, refresh the page (should stay logged in — this specifically tests that the cookie fix worked), try Google sign-in, log an activity with a photo.

## Notes

- **Free-tier cold starts**: Render's free Web Services spin down after inactivity and take a few seconds to wake back up on the next request. This is expected behavior, not a bug — if the first request after a while feels slow, that's why.
- **Redeploying after env var changes**: Render doesn't always auto-restart on environment variable changes depending on your plan/settings — check that a new deploy actually picked up the value if something seems stale.
