# Zenvio Hotel Management

Hotel booking and administration app with a React/Vite frontend and Express/MongoDB API.

## Local development

1. Install Node.js 22.12.0 or newer.
2. In `server`, copy `.env.example` to `.env` and set `MONGO_URI` and a private `JWT_SECRET`.
3. In `client`, copy `.env.example` to `.env.local`. The default API URL is `http://localhost:5000/api`.
4. Start the API with `cd server && npm install && npm run dev`.
5. In another terminal, start the frontend with `cd client && npm install && npm run dev`.

## Verification

- Frontend: `cd client && npm test`, `npm run lint`, and `npm run build`.
- API: `cd server && npm test`.
- API tests require `MONGO_URI` in `server/.env`. They target the `hotelDB_test` database when using MongoDB Atlas; never point the test URI at production data.

## Deploying

### Render API

Create a Render Blueprint from this repository using `render.yaml`. Set `MONGO_URI` to your MongoDB connection string and `FRONTEND_URL` to the deployed Vercel site origin (for example, `https://your-site.vercel.app`). Render generates `JWT_SECRET`. Do not commit `.env` files or deployment secrets.

### Vercel frontend

Import this repository into Vercel and set the project root directory to `client`. The included Vercel config supports client-side React Router URLs. Set the `VITE_API_URL` environment variable in Vercel to the deployed Render API URL ending in `/api` (for example, `https://your-api.onrender.com/api`) for every environment, then redeploy.

Uploaded room images are currently stored on the API's local filesystem. Render's local filesystem is ephemeral, so configure persistent storage or move uploads to an object-storage service before relying on uploaded images in production.
