# EventManager — Event Management Platform

A full-stack Event Management Platform (Ticketon-style) built with Node.js, Express, MongoDB and a vanilla JS frontend. University final project.

**Live Demo:** https://eventmanagerapi-production.up.railway.app

**GitHub:** https://github.com/KasperSaint07/EventManagerAPI

---

## Project Overview

EventManager allows users to browse and register for events, organizers to create and manage events, and admins to control the entire platform.

**Key features:**
- Browse events with search and city filter
- User registration and JWT authentication
- Role-based access control (user → organizer → super_admin)
- Event registration with capacity tracking
- Organizer request/approval workflow
- Admin panel for managing users and requests
- Email notifications via SMTP (Nodemailer + Mailtrap)
- Responsive SPA frontend

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js 5 |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (jsonwebtoken) |
| Password hashing | bcryptjs |
| Email | Nodemailer (SMTP) |
| Frontend | HTML, CSS, Vanilla JavaScript (SPA) |
| Deployment | Railway |

---

## Roles & Permissions

| Role | Capabilities |
|------|-------------|
| `user` | Browse events, register for events, request organizer role |
| `organizer` | All user abilities + create/update own events, view participants, request event deletion |
| `super_admin` | Full access: manage users, approve/reject requests, delete any event |

---

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas cluster)
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/KasperSaint07/EventManagerAPI.git
cd EventManagerAPI
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Edit `.env` with your configuration (see Environment Variables section below)

5. (Optional) Seed the database with test data:
```bash
node seed.js
```

6. Start the server:
```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

7. Open in browser: http://localhost:5000

### Test Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@eventmanager.kz` | `admin123` |
| Organizer | `organizer@eventmanager.kz` | `org123456` |
| User | `user@eventmanager.kz` | `user123456` |

---

## Environment Variables

Create a `.env` file in the root directory:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `JWT_SECRET` | Secret key for JWT | `your_random_secret_key` |
| `SMTP_HOST` | SMTP server host | `sandbox.smtp.mailtrap.io` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | `your_smtp_username` |
| `SMTP_PASS` | SMTP password | `your_smtp_password` |
| `SMTP_FROM` | Sender email address | `EventManager <noreply@eventmanager.com>` |

---

## Project Structure

```
EventManagerAPI/
├── frontend/                    # SPA Frontend
│   ├── index.html               # Main HTML (all pages)
│   ├── app.js                   # Client-side JavaScript
│   └── styles.css               # Styles
├── src/
│   ├── config/
│   │   └── db.js                # MongoDB connection
│   ├── controllers/
│   │   ├── adminController.js   # Admin: list users, promote roles
│   │   ├── authController.js    # Register & login
│   │   ├── eventController.js   # CRUD events, participants
│   │   ├── eventDeleteRequestController.js
│   │   ├── organizerRequestController.js
│   │   ├── registrationController.js
│   │   └── userController.js    # Profile management
│   ├── middleware/
│   │   └── auth.js              # JWT verification & role-based access
│   ├── models/
│   │   ├── User.js              # User schema (email, password, role)
│   │   ├── Event.js             # Event schema (title, date, city, capacity)
│   │   ├── Registration.js      # User-Event registration
│   │   ├── OrganizerRequest.js  # Role upgrade requests
│   │   └── EventDeleteRequest.js
│   ├── routes/
│   │   ├── adminRoutes.js       # /api/admin/*
│   │   ├── authRoutes.js        # /api/auth/*
│   │   ├── eventRoutes.js       # /api/events/*
│   │   ├── organizerRequestRoutes.js
│   │   └── userRoutes.js        # /api/users/*
│   ├── utils/
│   │   ├── generateToken.js     # JWT token generation
│   │   ├── sendEmail.js         # Nodemailer SMTP
│   │   └── validators.js        # Input validation
│   ├── app.js                   # Express app setup
│   └── server.js                # Server entry point
├── seed.js                      # Database seeder
├── .env.example                 # Environment template
├── .gitignore
├── package.json
└── README.md
```

---

## API Documentation

### Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Endpoints

#### Health Check

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/health` | Server health check | Public |

#### Auth (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register a new user | Public |
| POST | `/api/auth/login` | Login and get JWT token | Public |

**Register — Request body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Login — Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "64a...",
    "email": "user@example.com",
    "role": "user",
    "token": "eyJhbG..."
  }
}
```

#### Users (`/api/users`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/users/me` | Get current user profile | Auth |
| PUT | `/api/users/profile` | Update profile (email, password) | Auth |
| GET | `/api/users/registrations` | Get my event registrations | Auth |

#### Events (`/api/events`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/events` | List all events (pagination, search) | Public |
| GET | `/api/events/:id` | Get event by ID | Public |
| POST | `/api/events` | Create a new event | Organizer, Admin |
| PUT | `/api/events/:id` | Update an event | Organizer (own), Admin |
| DELETE | `/api/events/:id` | Delete an event | Admin only |

**Query parameters for GET /api/events:**
```
?page=1&limit=10&search=концерт
```

**Create event — Request body:**
```json
{
  "title": "IT Conference 2026",
  "description": "Annual tech conference",
  "dateTime": "2026-04-10T09:00:00",
  "city": "Астана",
  "address": "EXPO, павильон C3",
  "capacity": 2000
}
```

#### Event Registration (`/api/events`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/events/:id/register` | Register for an event | Auth |
| DELETE | `/api/events/:id/register` | Cancel registration | Auth |
| GET | `/api/events/:id/participants` | View participants | Organizer (own), Admin |

#### Organizer Requests (`/api/organizer`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/organizer/request` | Request organizer role | Auth (user only) |
| GET | `/api/organizer/request/status` | Check request status | Auth |

#### Event Delete Requests

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/events/:id/delete-request` | Request event deletion | Organizer (own) |

#### Admin (`/api/admin`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/users` | List all users | Admin only |
| POST | `/api/admin/users/:id/make-super-admin` | Promote to super_admin | Admin only |
| GET | `/api/admin/organizer-requests` | List organizer requests | Admin only |
| POST | `/api/admin/organizer-requests/:id/approve` | Approve request | Admin only |
| POST | `/api/admin/organizer-requests/:id/reject` | Reject request | Admin only |
| GET | `/api/admin/event-delete-requests` | List delete requests | Admin only |
| POST | `/api/admin/event-delete-requests/:id/approve` | Approve deletion | Admin only |
| POST | `/api/admin/event-delete-requests/:id/reject` | Reject deletion | Admin only |

---

## Database Collections

### User
| Field | Type | Description |
|-------|------|-------------|
| email | String | Unique, required |
| password | String | Hashed with bcrypt, min 6 chars |
| role | String | `user` / `organizer` / `super_admin` |
| createdAt | Date | Auto-generated |

### Event
| Field | Type | Description |
|-------|------|-------------|
| title | String | Required |
| description | String | Required |
| dateTime | Date | Required |
| city | String | Required |
| address | String | Required |
| capacity | Number | Min 1 |
| createdBy | ObjectId | Reference to User |
| createdAt / updatedAt | Date | Timestamps |

### Registration
| Field | Type | Description |
|-------|------|-------------|
| userId | ObjectId | Reference to User |
| eventId | ObjectId | Reference to Event |
| registeredAt | Date | Auto-generated |

*Unique compound index on (userId, eventId) — prevents duplicate registrations*

### OrganizerRequest
| Field | Type | Description |
|-------|------|-------------|
| userId | ObjectId | Reference to User |
| status | String | `pending` / `approved` / `rejected` |
| createdAt | Date | Auto-generated |

### EventDeleteRequest
| Field | Type | Description |
|-------|------|-------------|
| eventId | ObjectId | Reference to Event |
| organizerId | ObjectId | Reference to User |
| status | String | `pending` / `approved` / `rejected` |
| createdAt | Date | Auto-generated |

---

## Email Notifications

The platform sends emails via SMTP (Nodemailer):
- **Welcome email** — sent when a new user registers
- **Organizer approval** — sent when a user's organizer request is approved

Configured with Mailtrap for testing. Supports any SMTP provider (SendGrid, Mailgun, Postmark).

---

## Error Handling

The API uses a global error-handling middleware that returns consistent error responses:

| Status | Description |
|--------|-------------|
| 400 | Bad request / validation error |
| 401 | Unauthorized (invalid or missing token) |
| 403 | Forbidden (insufficient role) |
| 404 | Resource not found |
| 409 | Conflict (duplicate registration, existing request) |
| 500 | Internal server error |

**Error response format:**
```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

---

## Screenshots

### Home Page — Event Listing
![Home](https://i.imgur.com/placeholder1.png)
*Browse events with search and city filter. Cards show available spots and event details.*

### Event Detail
![Event Detail](https://i.imgur.com/placeholder2.png)
*Detailed view with registration button, capacity counter, and event info.*

### Login / Register
![Login](https://i.imgur.com/placeholder3.png)
*Simple authentication forms with validation.*

### User Profile
![Profile](https://i.imgur.com/placeholder4.png)
*View registrations, stats, and request organizer role.*

### Create Event (Organizer)
![Create Event](https://i.imgur.com/placeholder5.png)
*Organizers can create events with title, description, date, city, address, and capacity.*

### Admin Panel
![Admin](https://i.imgur.com/placeholder6.png)
*Approve/reject organizer requests and manage users.*

---

## Deployment

Deployed on **Railway** with the following configuration:
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment variables** set via Railway dashboard (not committed to git)
- **MongoDB Atlas** with network access allowed from all IPs (`0.0.0.0/0`)

---

## License

ISC
