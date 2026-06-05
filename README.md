# YourTube 2.0

A monorepo for a YouTube-inspired full-stack application with a Next.js frontend and an Express/MongoDB backend. The frontend uses Firebase for auth, OTP-based verification flows, and protected video playback. The backend exposes REST APIs for users, videos, likes, watch later, history, and comments, plus real-time WebRTC signaling via Socket.IO for call rooms.

## Repository structure

- `server/` - Express backend server
  - `index.js` - server entry point
  - `routes/` - API route handlers for auth, video, like, watchlater, history, comment
  - `controllers/` - business logic for server endpoints
  - `Modals/` - Mongoose model definitions
  - `utils/` - utilities such as mailer and plan configuration
- `yourtube/` - Next.js frontend application
  - `src/pages/` - app pages, including home, watch, history, liked, subscriptions, downloads, call rooms
  - `src/components/` - reusable UI components and page sections
  - `src/lib/` - auth context, API axios instance, Firebase config, utility helpers
  - `src/styles/` - global styling

## Key features

- User authentication with Firebase and OTP verification
- Video browsing and watch pages with related videos and comments
- Protected playback flow using watch session tokens
- Watch plans and plan-based viewing limits
- Watch later, history, likes, and comments support
- Real-time call room creation and peer signaling via Socket.IO
- Responsive layout with dark/light theming
- Next.js frontend with Tailwind CSS and Radix UI components

## Technologies

- Frontend: Next.js, React, TypeScript, Tailwind CSS, Radix UI, Firebase, Axios
- Backend: Node.js, Express, MongoDB, Mongoose, Socket.IO, dotenv
- Auth / notifications: Firebase auth, OTP-based verification
- Streaming: protected video streaming endpoints from the backend

## Prerequisites

- Node.js installed
- npm installed
- MongoDB instance available
- Firebase project configured for auth

## Environment setup

### Backend (`server/`)

Create a `.env` file in `server/` with at least:

```env
DB_URL=<your mongodb connection string>
PUBLIC_URL=http://localhost:3000
PORT=5000
```

- `DB_URL` is the MongoDB connection URI.
- `PUBLIC_URL` is the frontend origin allowed by CORS.
- `PORT` is optional; defaults to `5000`.

### Frontend (`yourtube/`)

Set `NEXT_PUBLIC_BACKEND_URL` in `yourtube/next.config.ts` environment or in `.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

Ensure Firebase is configured in `src/lib/firebase.js` and any required API keys are present there.

## Install dependencies

From the repo root, install server and frontend dependencies separately:

```bash
cd server
npm install

cd ../yourtube
npm install
```

## Run locally

### Start backend

```bash
cd server
npm run dev
```

### Start frontend

```bash
cd yourtube
npm run dev
```

Then open the frontend at `http://localhost:3000`.

## Available scripts

### Backend

- `npm run start` - run the production server from `server/index.js`
- `npm run dev` - run server with `nodemon`

### Frontend

- `npm run dev` - start Next.js in development mode
- `npm run build` - build the production app
- `npm run start` - start the production Next.js server
- `npm run lint` - run Next.js linting

## Notes

- This README is based on the current workspace source files.
- The backend expects a MongoDB URI and a matching frontend backend URL.
- The frontend uses `NEXT_PUBLIC_BACKEND_URL` for API requests and the backend uses `PUBLIC_URL` for CORS.
