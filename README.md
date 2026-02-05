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

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

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

## Project Structure

```
src/
 ├── controllers/    # Request handlers
 ├── routes/         # API route definitions
 ├── models/         # Mongoose schemas
 ├── middleware/     # Custom middleware (auth, etc.)
 ├── config/         # Configuration files
 ├── utils/          # Utility functions
 ├── app.js          # Express app setup
 └── server.js       # Server entry point
```

## API Overview

> **Note:** API documentation will be added as endpoints are implemented.

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

*More endpoints coming soon...*

## Deployment

> **Note:** Deployment instructions will be added later.

## License

ISC
