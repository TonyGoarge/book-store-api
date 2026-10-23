# 📚 Book Store API — Architecture

> **Author:** Tony Goarge  
> **Version:** 1.0.0  
> **Runtime:** Node.js · Express 5 · MongoDB (Mongoose)  
> **Deployment:** Vercel

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Architecture Layers](#architecture-layers)
5. [API Endpoints](#api-endpoints)
6. [Data Models](#data-models)
7. [Authentication & Authorization](#authentication--authorization)
8. [File Upload Flow](#file-upload-flow)
9. [Notifications (FCM)](#notifications-fcm)
10. [Password Reset Flow](#password-reset-flow)
11. [Environment Variables](#environment-variables)
12. [Request Lifecycle](#request-lifecycle)

---

## Overview

**Book Store API** is a RESTful backend service that serves two primary domains:

| Domain | Description |
|--------|-------------|
| 📚 **Book Store** | Manage books, authors, and regular users |
| ⛪ **San George (Khadem)** | Church servant management, attendance tracking, trips & payments |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express 5 |
| Database | MongoDB via Mongoose 9 |
| Authentication | JWT (jsonwebtoken) |
| Password Hashing | bcryptjs |
| Validation | Joi |
| File Upload | Multer + Cloudinary |
| Email | Nodemailer |
| Push Notifications | Firebase Admin (FCM) |
| Templating | EJS |
| Dev Server | Nodemon |
| Deployment | Vercel |

---

## Project Structure

```
book-store-api/
├── app.js                            # Entry point — Express app setup & server
├── package.json
├── vercel.json                       # Vercel deployment config
├── seeder.js                         # DB seed script
├── data.js                           # Static seed data
├── test.js                           # Manual test script
│
├── config/
│   ├── db.js                         # MongoDB connection
│   └── cloudinary.js                 # Cloudinary SDK config
│
├── routes/
│   ├── books.js                      # /api/books
│   ├── authors.js                    # /api/authors
│   ├── auth.js                       # /api/auth  (User auth)
│   ├── user.js                       # /api/users
│   ├── san-george-auth.js            # /api/khadem (Khadem auth)
│   ├── khadem.js                     # /api/khadem (Khadem CRUD)
│   ├── attendance.js                 # /api/attendance
│   ├── statistics.js                 # /api/statistics
│   ├── trips.js                      # /api/trips
│   ├── password.js                   # /api/password (reset)
│   └── upload.js                     # /api/upload
│
├── controllers/
│   ├── authController.js             # User login/register
│   ├── bookController.js             # Book CRUD
│   ├── khadem-authController.js      # Khadem login/register
│   ├── passwordController.js         # Forgot/reset password
│   ├── tripController.js             # Trip CRUD + images + summary
│   ├── tripParticipantController.js  # Participants & payments
│   ├── calculateFirdayStreak.js      # Friday attendance streak logic
│   └── calculatePerformance.js       # Khadem performance metrics
│
├── models/
│   ├── Book.js                       # Book schema
│   ├── Author.js                     # Author schema
│   ├── User.js                       # App user schema
│   ├── Khadem.js                     # Church servant schema
│   ├── Attendance.js                 # Attendance record schema
│   ├── Trip.js                       # Trip schema
│   └── TripParticipant.js            # Trip participant + payments schema
│
├── middleewares/
│   ├── verifyToken.js                # JWT guard (verifyToken, verifyTokenAndAdmin)
│   ├── error.js                      # notFound & errorHandler
│   ├── logger.js                     # Request logger
│   └── multer.js                     # Multer + Cloudinary storage config
│
├── views/                            # EJS email templates
│   ├── forgot-password.ejs
│   ├── link-send.ejs
│   ├── reset-password.ejs
│   └── success-password.ejs
│
└── functions/
    └── index.js                      # Firebase Cloud Functions (if used)
```

---

## Architecture Layers

### Entry Point — `app.js`

```
MongoDB ──► connectToDB()
                │
                ▼
            Express App
                │
       ┌────────┼──────────────┐
       │        │              │
  JSON body  URLencoded     Logger
  parser     parser        middleware
                │
           Routes (/api/*)
                │
          Error Handlers
       (notFound, errorHandler)
```

---

### Config

| File | Purpose |
|------|---------|
| `config/db.js` | Connects to MongoDB using `MONGO_URI` env var |
| `config/cloudinary.js` | Initialises Cloudinary SDK |

---

### Routes

| Route File | Mount Path | Auth Required |
|-----------|-----------|--------------|
| `books.js` | `/api/books` | Mixed |
| `authors.js` | `/api/authors` | Mixed |
| `auth.js` | `/api/auth` | Public |
| `user.js` | `/api/users` | Token |
| `san-george-auth.js` | `/api/khadem` | Public |
| `khadem.js` | `/api/khadem` | Token / Admin |
| `attendance.js` | `/api/attendance` | Token |
| `statistics.js` | `/api/statistics` | Token |
| `trips.js` | `/api/trips` | Token / Admin |
| `password.js` | `/api/password` | Public |
| `upload.js` | `/api/upload` | Token |

---

### Controllers

| Controller | Responsibilities |
|-----------|-----------------|
| `authController` | Register & login for regular users |
| `bookController` | Full CRUD for books |
| `khadem-authController` | Register, login, update profile for Khadem |
| `passwordController` | Send reset email, validate token, set new password |
| `tripController` | CRUD for trips, image upload/removal, trip summary |
| `tripParticipantController` | Manage participants, record payments, receipts, WhatsApp reminder |
| `calculateFirdayStreak` | Helper — computes consecutive Friday attendance streak |
| `calculatePerformance` | Helper — computes Khadem performance score |

---

### Models

#### `Khadem` (Church Servant)

| Field | Type | Notes |
|-------|------|-------|
| name | String | 3–200 chars, required |
| phone | String | 11–20 chars, required |
| email | String | required |
| password | String | hashed via bcryptjs |
| church | String | Church affiliation |
| service | String | Ministry/service role |
| address | String | |
| birthDate | Date | |
| isAdmin | Boolean | Default: false |
| fcmToken | String | Firebase push token |

#### `Trip`
Trip event with images array, cost, and date.

#### `TripParticipant`
Links a Khadem to a Trip and tracks payment installments.

#### `Book` / `Author` / `User` / `Attendance`
Standard schemas for the book store and attendance tracking domains.

---

### Middlewares

| Middleware | Description |
|-----------|-------------|
| `verifyToken` | Validates JWT from `Authorization: Bearer <token>` header |
| `verifyTokenAndAdmin` | `verifyToken` + checks `isAdmin === true` |
| `logger` | Logs each incoming request |
| `notFound` | Catches unknown routes → 404 JSON |
| `errorHandler` | Global error handler → structured error JSON |
| `multer` | Handles file uploads, stores to Cloudinary |

---

## API Endpoints

### Books — `/api/books`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/books` | Optional | Get all books |
| GET | `/api/books/:id` | Optional | Get single book |
| POST | `/api/books` | Admin | Create book |
| PUT | `/api/books/:id` | Admin | Update book |
| DELETE | `/api/books/:id` | Admin | Delete book |

### Authors — `/api/authors`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/authors` | Optional | Get all authors |
| GET | `/api/authors/:id` | Optional | Get single author |
| POST | `/api/authors` | Admin | Create author |
| PUT | `/api/authors/:id` | Admin | Update author |
| DELETE | `/api/authors/:id` | Admin | Delete author |

### Auth (Users) — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login → get JWT |

### Khadem — `/api/khadem`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/khadem/register` | Public | Register Khadem |
| POST | `/api/khadem/login` | Public | Login → get JWT |
| GET | `/api/khadem` | Token | Get all Khadem |
| GET | `/api/khadem/:id` | Token | Get single Khadem |
| PUT | `/api/khadem/:id` | Token | Update profile |
| DELETE | `/api/khadem/:id` | Admin | Delete Khadem |

### Trips — `/api/trips`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/trips` | Token | Get all trips |
| POST | `/api/trips` | Admin | Create trip |
| GET | `/api/trips/:id` | Token | Get trip details |
| PUT | `/api/trips/:id` | Admin | Update trip |
| DELETE | `/api/trips/:id` | Admin | Delete trip |
| GET | `/api/trips/:id/summary` | Token | Financial summary |
| POST | `/api/trips/:id/images` | Admin | Upload images |
| DELETE | `/api/trips/:id/images` | Admin | Remove image |
| GET | `/api/trips/:id/participants` | Token | List participants |
| POST | `/api/trips/:id/participants` | Admin | Add participant |
| PUT | `/api/trips/:id/participants/:participantId` | Admin | Update participant |
| DELETE | `/api/trips/:id/participants/:participantId` | Admin | Remove participant |
| POST | `/api/trips/:id/participants/:participantId/payments` | Token | Record payment |
| DELETE | `/api/trips/:id/participants/:participantId/payments/:paymentId` | Admin | Delete payment |
| GET | `/api/trips/:id/participants/:participantId/receipt` | Token | Get receipt |
| GET | `/api/trips/:id/participants/:participantId/reminder` | Token | WhatsApp reminder |

### Password Reset — `/api/password`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/password/forgot` | Public | Send reset email |
| GET | `/api/password/reset/:token` | Public | Validate token |
| POST | `/api/password/reset/:token` | Public | Set new password |

---

## Data Models (ER Diagram)

```
User                Khadem
──────              ─────────────────
_id                 _id
name                name
email               email
password            phone / password
isAdmin             church / service
                    isAdmin
                    fcmToken
                         │
                    ┌────┴──────────┐
                    │               │
               Attendance      TripParticipant
               ──────────      ───────────────
               _id             _id
               khadem ◄────    khadem ◄────────
               date            trip ◄──────────┐
               present         payments[]      │
                                               │
Book                                          Trip
──────────                                   ──────────
_id                                          _id
title                                        title
author ◄──┐                                  date
coverImage│                                  cost
price      │                                 images[]
          Author
          ──────
          _id
          firstName
          lastName
          nationality
```

---

## Authentication & Authorization

```
1. Client sends credentials to /api/auth/login or /api/khadem/login
2. Server validates → signs JWT with { id, isAdmin } + JWT_SECRET
3. Client stores token and sends it on every request:
       Authorization: Bearer <token>
4. verifyToken middleware:
       Valid   → req.user = { id, isAdmin } → next()
       Invalid → 401 Unauthorized
5. verifyTokenAndAdmin:
       isAdmin true  → next()
       isAdmin false → 403 Forbidden
```

> ⚠️ **Note:** Tokens have **no expiry** set by default. Consider adding `{ expiresIn: '7d' }` to `jwt.sign()`.

---

## File Upload Flow

```
Client (multipart/form-data)
        │
        ▼
   Multer middleware
   (multer-storage-cloudinary)
        │
        ▼
   Cloudinary CDN Storage
        │
        └─► { secure_url, public_id }
                │
                ▼
        Saved to MongoDB
        (imageUrl / images[])
```

---

## Notifications (FCM)

- Each `Khadem` stores an `fcmToken` field (Firebase Cloud Messaging device token)
- **Firebase Admin SDK** is configured in `functions/index.js`
- Server can send targeted push notifications to specific devices using the stored token

---

## Password Reset Flow

```
1. POST /api/password/forgot
   └─► Generate signed reset token
   └─► Send email with reset link (Nodemailer + forgot-password.ejs)

2. GET /api/password/reset/:token
   └─► Validate token → render reset-password.ejs form

3. POST /api/password/reset/:token
   └─► Hash new password → save to DB
   └─► Render success-password.ejs
```

---

## Environment Variables

| Variable | Required | Description |
|---------|---------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | Yes | `development` / `production` |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for JWT signing |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `EMAIL_USER` | Yes | Nodemailer sender address |
| `EMAIL_PASS` | Yes | Nodemailer sender password |

---

## Request Lifecycle

```
Incoming HTTP Request
        │
        ▼
   express.json()          ← Parse JSON body
   express.urlencoded()    ← Parse form body
   logger()                ← Log request
        │
        ▼
   Route match?
    ├── YES
    │    └─► verifyToken? (if protected)
    │              └─► Controller function
    │                      └─► Model → MongoDB
    │                              └─► JSON Response
    │
    └── NO → notFound() → 404 JSON
                  │
            errorHandler() ← Any thrown/async error
                  │
            { status, message } JSON
```

---

> **Note:** The middleware directory is intentionally spelled `middleewares` (double-e) throughout the project. Keep this consistent when adding new files.
