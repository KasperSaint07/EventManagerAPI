# Event Management Platform API

A REST API backend for an Event Management Platform (similar to Ticketon).
Built as a university final project.

## Project Overview

This platform allows:
- **Users** to view events and register for them
- **Organizers** to create and manage their own events
- **Super Admins** to control the platform, manage roles, and approve requests

This is a **backend-only** project. The API is designed to be tested via Postman.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcrypt
- **Environment Variables:** dotenv

## Roles & Permissions

| Role | Description |
|------|-------------|
| `user` | Default role. Can view events, register, request organizer status |
| `organizer` | Approved by admin. Can create/update own events, request deletion |
| `super_admin` | Full access. Manages roles, approves requests, deletes events |

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
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

4. Edit `.env` file with your configuration (see Environment Variables section)

5. Start the server:
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

6. Verify the server is running:
   ```
   GET http://localhost:5000/health
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port number | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/eventmanager` |
| `JWT_SECRET` | Secret key for JWT signing | `your_random_secret_key` |
| `SMTP_HOST` | SMTP server host | `sandbox.smtp.mailtrap.io` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | `your_smtp_username` |
| `SMTP_PASS` | SMTP password | `your_smtp_password` |
| `SMTP_FROM` | Sender email | `EventManager <noreply@eventmanager.com>` |

## Project Structure

```
src/
 ├── controllers/         # Request handlers (business logic)
 │    ├── adminController.js
 │    ├── authController.js
 │    ├── eventController.js
 │    ├── eventDeleteRequestController.js
 │    ├── organizerRequestController.js
 │    ├── registrationController.js
 │    └── userController.js
 ├── routes/              # API route definitions
 │    ├── adminRoutes.js
 │    ├── authRoutes.js
 │    ├── eventRoutes.js
 │    ├── organizerRequestRoutes.js
 │    └── userRoutes.js
 ├── models/              # Mongoose schemas
 │    ├── User.js
 │    ├── Event.js
 │    ├── Registration.js
 │    ├── OrganizerRequest.js
 │    └── EventDeleteRequest.js
 ├── middleware/           # Custom middleware
 │    └── auth.js          # JWT auth + role-based access
 ├── config/
 │    └── db.js            # MongoDB connection
 ├── utils/
 │    ├── generateToken.js # JWT token generation
 │    └── validators.js    # Input validation functions
 ├── app.js               # Express app setup
 └── server.js            # Server entry point
```

## API Endpoints

### Health Check

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/health` | Server health check | Public |

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register a new user | Public |
| POST | `/api/auth/login` | Login and get JWT token | Public |

### Users (`/api/users`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/users/me` | Get current user profile | Auth |
| PUT | `/api/users/profile` | Update profile (email, password) | Auth |
| GET | `/api/users/registrations` | Get my event registrations | Auth |

### Events (`/api/events`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/events` | Get all events (pagination) | Public |
| GET | `/api/events/:id` | Get event by ID | Public |
| POST | `/api/events` | Create a new event | Organizer, Admin |
| PUT | `/api/events/:id` | Update an event | Organizer (own), Admin |
| DELETE | `/api/events/:id` | Delete any event | Admin only |

### Event Registration (`/api/events`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/events/:id/register` | Register for an event | Auth |
| DELETE | `/api/events/:id/register` | Cancel registration | Auth (own) |
| GET | `/api/events/:id/participants` | View event participants | Organizer (own), Admin |

### Event Delete Requests (`/api/events`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/events/:id/delete-request` | Request event deletion | Organizer (own) |

### Organizer Requests (`/api/organizer`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/organizer/request` | Request organizer role | Auth (user only) |

### Admin (`/api/admin`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/organizer-requests` | List organizer requests | Admin only |
| POST | `/api/admin/organizer-requests/:id/approve` | Approve organizer request | Admin only |
| POST | `/api/admin/organizer-requests/:id/reject` | Reject organizer request | Admin only |
| GET | `/api/admin/event-delete-requests` | List delete requests | Admin only |
| POST | `/api/admin/event-delete-requests/:id/approve` | Approve deletion | Admin only |
| POST | `/api/admin/event-delete-requests/:id/reject` | Reject deletion | Admin only |
| POST | `/api/admin/users/:id/make-super-admin` | Assign super_admin role | Admin only |

### Pagination

All list endpoints support pagination via query parameters:
```
GET /api/events?page=1&limit=10
```

### Authentication

Protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Email Notifications

The platform sends email notifications using Nodemailer (SMTP):
- **Welcome email** — sent when a new user registers
- **Organizer approval** — sent when a user's organizer request is approved

Configure SMTP settings in `.env`. Supports any provider: SendGrid, Mailgun, Postmark, or Mailtrap (for testing).

## Business Rules

- Events are public and visible to everyone (no login required)
- Registration requires authentication
- Capacity is enforced — no overbooking
- Users can register for the same event only once
- Organizers cannot delete events directly — they submit a request
- Super admins can delete any event directly
- Multiple super admins are supported
- No payments, no seat selection, no email notifications

## License

ISC
