# Linklet - MERN Stack URL Shortener & Analytics Platform

An ultra-modern, full-stack **MERN (MongoDB, Express, React, Node.js)** URL Shortener application with real-time click tracking, interactive analytics, custom aliases, QR code generation, and bulk operations.

---

## 🌟 Tech Stack Architecture

- **M (MongoDB & Mongoose)**: Stores URLs, atomic visit histories (`visitHistory`), click counts, audit logs, and user credentials.
- **E (Express.js)**: High-performance RESTful API with CORS, authentication middleware, and fast 302 URL redirection.
- **R (React 18 & Vite)**: Sleek, glassmorphic dark-mode single page application (SPA) with Lucide icons, live QR code generator, and instant toast notifications.
- **N (Node.js)**: Powers the backend server and concurrently coordinates both backend and frontend development servers.

---

## 🚀 Quick Start

### 1. Run Both Frontend and Backend Concurrently (Recommended)

From the project root directory (`urlshortner/`):

```bash
npm run dev
```

This will launch:
- **Express Backend Server**: `http://localhost:8001`
- **React Frontend (Vite)**: `http://localhost:5173`

### 2. Run Individually

**Backend only:**
```bash
npm run server
# or: cd url && npm run start
```

**Frontend only:**
```bash
npm run client
# or: cd client && npm run dev
```

---

## ✨ Features

1. **Smart URL Shortening**:
   - Shorten any long `http://` or `https://` destination.
   - **Custom Alias**: e.g., `/url/my-portfolio` or `/url/launch-2026`.
   - **Custom Title & Label**: Organizes links in your dashboard.
   - **Expiration Date**: Set automated expiration dates for time-sensitive links.

2. **Real-Time Click Tracking & Analytics**:
   - Atomic click incrementation (`$inc`) and visit timestamp recording (`$push`).
   - Detailed analytics modal displaying total raw clicks, derived weighted clicks, and timestamped visit history.
   - Optional Admin multiplier (`$mul`) to scale campaign reporting without mutating raw click logs.

3. **High-Resolution QR Code Generation**:
   - Generates instant QR codes for any short link.
   - 1-click **Download as PNG** for marketing materials, posters, and flyers.

4. **Search, Filter & Sort**:
   - Live partial text search across title, short code, and target destination.
   - Status filters: **All**, **Active**, **Archived**, **Expired**.
   - Sort by Date Created, Click Count, Title, or Expiry Date.

5. **Batch / Bulk URL Creation**:
   - Shorten up to 50 URLs simultaneously using the format `Title | https://destination.com` or plain URLs.

6. **Bulk Operations**:
   - Select multiple links via checkboxes to **Bulk Activate**, **Bulk Archive**, or **Bulk Delete** in one click.

7. **Authentication & Demo Mode**:
   - JWT & session-cookie based user authentication.
   - Includes a **One-Click Demo Login** button for instant testing without typing credentials.

---

## 📡 REST API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/signup` - Register a new user (`name`, `email`, `password`)
- `POST /api/auth/login` - Authenticate user & receive JWT token
- `POST /api/auth/logout` - Clear session
- `GET /api/auth/me` - Get profile of authenticated user

### URL Management (`/api/urls`)
- `GET /api/urls` - Fetch paginated links with filters (`q`, `status`, `sort`, `order`, `page`, `pageSize`)
- `POST /api/urls` - Create single short URL (`url`, `title`, `customAlias`, `expiresAt`)
- `POST /api/urls/bulk` - Batch create URLs
- `GET /api/urls/:shortId/analytics` - Fetch link click counts and visit timestamps
- `PATCH /api/urls/:id` - Update link destination, title, status, or expiry
- `DELETE /api/urls/:id` - Delete link
- `POST /api/urls/bulk-status` - Update status for an array of link IDs
- `POST /api/urls/bulk-delete` - Delete multiple links by IDs
- `POST /api/urls/:shortId/multiply` - Admin multiplier update

### Public Redirection
- `GET /url/:shortId` or `GET /r/:shortId` - Redirects to original destination URL (HTTP 302) while atomically recording click count and visit timestamp.
