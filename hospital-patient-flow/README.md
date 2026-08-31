# Hospital Patient Flow Optimization System and Real-Time Bed Availability Dashboard

A complete MERN stack mini project for managing hospital patient flow, admissions, transfers, discharges, waiting queues, real-time bed availability, notifications, and operational analytics.

## Features

- JWT authentication with Admin and Staff roles
- Patient registration, search, filtering, editing, deletion, and pagination
- Ward and bed management with visual status cards
- Admission workflow with rule-based bed recommendation
- Transfer workflow with consistent old-bed/new-bed updates
- Discharge workflow that moves beds into Cleaning status
- Waiting queue sorted by patient priority and waiting time
- Real-time dashboard updates using Socket.io
- Recharts dashboard and reports
- Notifications for occupancy, admissions, discharges, and waiting patients
- Seed script with demo users and hospital data

## Technology Stack

Frontend: React.js with Vite, Tailwind CSS, React Router DOM, Axios, Recharts, Lucide React, Socket.io-client.

Backend: Node.js, Express.js, MongoDB with Mongoose, JWT, bcryptjs, Socket.io, dotenv, cors.

## Architecture

```text
hospital-patient-flow/
  client/
    src/
      components/
      context/
      hooks/
      layouts/
      pages/
      services/
      utils/
  server/
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
    socket/
    utils/
```

## Environment Variables

Create `server/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_or_replica_set_connection_string
JWT_SECRET=replace_with_a_long_secret
CLIENT_URL=http://localhost:5173
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

MongoDB Atlas is recommended because the admission, transfer, and discharge workflows use MongoDB transactions for safer bed allocation.

## Installation

Install root helper dependency:

```bash
cd hospital-patient-flow
npm install
```

Install backend dependencies:

```bash
cd server
npm install
```

Install frontend dependencies:

```bash
cd ../client
npm install
```

Or install everything from the root:

```bash
cd hospital-patient-flow
npm run install:all
```

## Seed Database

```bash
cd hospital-patient-flow/server
npm run seed
```

Demo credentials:

```text
Admin: admin@hospital.com / Admin@123
Staff: staff@hospital.com / Staff@123
```

## Run Locally

Start backend:

```bash
cd hospital-patient-flow/server
npm run dev
```

Start frontend:

```bash
cd hospital-patient-flow/client
npm run dev
```

Open:

```text
http://localhost:5173
```

## API Overview

Authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Patients:

- `GET /api/patients`
- `GET /api/patients/:id`
- `POST /api/patients`
- `PUT /api/patients/:id`
- `DELETE /api/patients/:id`

Beds and wards:

- `GET /api/beds`
- `GET /api/beds/available`
- `GET /api/beds/wards`
- `POST /api/beds`
- `PUT /api/beds/:id`
- `DELETE /api/beds/:id`

Workflows:

- `GET /api/admissions`
- `POST /api/admissions`
- `GET /api/transfers`
- `POST /api/transfers`
- `GET /api/discharges`
- `POST /api/discharges`
- `GET /api/recommend-bed`

Dashboard, reports, queue, notifications:

- `GET /api/dashboard/stats`
- `GET /api/dashboard/charts`
- `GET /api/reports`
- `GET /api/waiting-queue`
- `POST /api/waiting-queue`
- `GET /api/notifications`
- `PUT /api/notifications/:id/read`

## Exact Commands

```bash
cd hospital-patient-flow
npm install
npm run install:all
```

Configure MongoDB by creating `server/.env` from `server/.env.example`, then create `client/.env` from `client/.env.example`.

```bash
cd server
npm run seed
npm run dev
```

In a second terminal:

```bash
cd hospital-patient-flow/client
npm run dev
```
