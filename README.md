# Care in India — REST API & Backend Service

[![Node.js Version](https://img.shields.io/badge/Node.js-18%2B-brightgreen.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.x-lightgrey.svg)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB%20Atlas-green.svg)](https://www.mongodb.com/)
[![Mongoose](https://img.shields.io/badge/ODM-Mongoose%208-red.svg)](https://mongoosejs.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT%20Bearer-orange.svg)](https://jwt.io/)

Backend service for **Care in India**, providing authentication, role-based access control (RBAC), provider synchronization, real-time appointment time slot locking, and dynamic doctor/hospital queries against MongoDB Atlas.

---

## Table of Contents

- [1. Backend Architecture](#1-backend-architecture)
- [2. Features & Business Logic](#2-features--business-logic)
  - [Role-Based Access Control & Credential Locking](#role-based-access-control--credential-locking)
  - [Healthcare Provider Synchronization](#healthcare-provider-synchronization)
  - [Real-Time Appointment Slot Locking & Concurrency](#real-time-appointment-slot-locking--concurrency)
  - [Doctor–Patient Live Connection](#doctorpatient-live-connection)
  - [Dynamic Querying & Search Engine](#dynamic-querying--search-engine)
- [3. Database Models & Schema Definitions](#3-database-models--schema-definitions)
- [4. REST API Documentation](#4-rest-api-documentation)
- [5. Environment Variables & Setup](#5-environment-variables--setup)

---

## 1. Backend Architecture

```
caresinindiaBackend/
├── controllers/
│   ├── appointmentController.js   # Slot locking, booking, status transitions
│   ├── cINcontroller.js           # Auth (register, login, me, logout) with role cross-check
│   ├── doctorController.js        # Doctor directory, search, multi-field filters
│   ├── hospitalController.js      # Hospital directory, regional networks, metadata
│   ├── patientReviewController.js # Reviews and medical blogs
│   ├── providerController.js      # Provider registration & auto-sync to Doctor/Hospital
│   └── specialityController.js    # Medical disciplines and procedures
├── middleware/
│   └── auth.js                    # JWT verify (`protect`) & role guard (`authorize`)
├── models/
│   ├── Appointment.js             # Booking record, status lifecycle, slot locking
│   ├── Doctor.js                  # Patient-facing doctor directory & time slots
│   ├── DoctorHospital.js          # Provider registration & clinical profile
│   ├── Hospital.js                # Hospital facilities, infrastructure, beds & OTs
│   ├── HospitalMetadata.js        # Regional network trees and categories
│   ├── OpenScheema.js             # User accounts & RBAC roles
│   ├── PatientReview.js           # Verified patient feedback & blogs
│   └── Speciality.js              # Medical departments, procedures, and FAQs
├── routes/
│   ├── appointmentRoutes.js       # /api/appointments
│   ├── authRoutes.js              # /api/auth
│   ├── doctorRoutes.js            # /api/doctors
│   ├── hospitalRoutes.js          # /api/hospitals
│   ├── patientReviewRoutes.js     # /api/patient-reviews
│   ├── providerRoutes.js          # /api/provider
│   └── specialityRoutes.js        # /api/specialities
├── server.js                      # Express configuration, CORS, middleware & port
└── package.json
```

---

## 2. Features & Business Logic

### Role-Based Access Control & Credential Locking
- In `cINcontroller.js`, `exports.login` validates that the credentials match the user's registered role in MongoDB:
  - If a user chooses `patient` with Doctor credentials $\rightarrow$ **403 Forbidden**.
  - If a user chooses `doctor/hospital` with Patient credentials $\rightarrow$ **403 Forbidden**.

### Healthcare Provider Synchronization
- In `providerController.js`, when a doctor or hospital registers or updates via `POST /api/provider`:
  - **Individual Doctor**: Auto-synced into `Doctor` collection, their clinic into `Hospital` collection, and their practice areas into `Speciality` collection.
  - **Hospital**: Auto-synced into `Hospital` collection, its doctor roster into `Doctor` collection, and clinical departments into `Speciality` collection.
  - Ensures new providers immediately become visible to patients on the frontend.

### Real-Time Appointment Slot Locking & Concurrency
- **Locked Statuses**: An appointment with status `Confirmed`, `Scheduled`, or `In-Progress` locks that `(doctor, date, time)` slot.
- **Query**: `GET /api/appointments/booked-slots` returns an array of locked slot strings.
- **Conflict Block**: `POST /api/appointments` rejects concurrent bookings for an already-locked slot with **409 Conflict**.
- **Unlocking**:
  - The slot automatically unlocks when the doctor marks the consultation as `Completed`.
  - The slot unlocks if either the patient or doctor sets the status to `Cancelled`.

### Doctor–Patient Live Connection
- Both doctor (`/doctor/dashboard`) and patient (`/my-appointments`) query the same `Appointment` collection.
- Status changes (`In-Progress`, `Completed`, `Cancelled`) made by one party immediately reflect for the other.

---

## 3. Database Models & Schema Definitions

### 1. `Appointment` (`models/Appointment.js`)
- `patient`: Reference to `openSchema` (Patient User ID).
- `patientName`, `patientPhone`, `patientEmail`: Patient details.
- `doctor`: Reference to `openSchema` (Doctor User ID).
- `doctorId`: Doctor slug or identifier.
- `doctorName`, `doctorSpeciality`, `hospitalName`: Clinical assignment.
- `appointmentDate`, `appointmentTime`: Targeted consultation time slot.
- `consultType`: `["hospital", "video", "clinic"]`.
- `symptoms`: Clinical complaints.
- `status`: `["Confirmed", "Scheduled", "In-Progress", "Completed", "Cancelled"]`.
- `cancelledBy`: `["patient", "doctor", "hospital", ""]`.
- `completedAt`: Date timestamp of consultation completion.
- `bookingId`: Unique token string (`APT-XXXXXX`).

### 2. `Doctor` (`models/Doctor.js`)
- `id`: Unique slug.
- `name`: Doctor's formatted name.
- `position`, `speciality`, `allSpecialities`: Clinical specialization.
- `experience`, `experienceYears`: Clinical tenure.
- `consultationFee`, `feeAmount`: OPD consultation charge.
- `hospital`, `hospitalName`, `clinicAddress`, `city`: Facility details.
- `availability`: Weekly consulting schedule.
- `user`: Reference to `openSchema`.

### 3. `Hospital` (`models/Hospital.js`)
- `id`: Unique slug.
- `name`, `shortName`, `group`: Facility identifiers.
- `city`, `state`, `address`: Geolocation.
- `bedsCount`, `icuBeds`, `operationTheatres`: Infrastructure metrics.
- `accreditations`: NABH, NABL, JCI, etc.
- `specialities`: Medical disciplines available.
- `user`: Reference to `openSchema` (Account Owner).

---

## 4. REST API Documentation

### Auth Endpoints
- `POST /api/register` — Create account (`patient`, `doctor`, `doctor/hospital`).
- `POST /api/login` — Sign in with role validation.
- `POST /api/logout` — Clear auth cookie.
- `GET /api/me` — Fetch logged-in user profile.

### Appointment Endpoints
- `GET /api/appointments/booked-slots?doctorName=&appointmentDate=` — Check locked slots for a doctor on a specific date.
- `POST /api/appointments` — Book an appointment (Patient only; enforces slot lock).
- `GET /api/appointments/my` — Fetch logged-in patient's appointments.
- `GET /api/appointments/doctor` — Fetch logged-in doctor's appointment queue.
- `PUT /api/appointments/:id/cancel` — Cancel appointment (Patient or Doctor; unlocks slot).
- `PUT /api/appointments/:id/status` — Update appointment status (`In-Progress`, `Completed`, `Cancelled`).

### Provider Endpoints
- `POST /api/provider` — Save provider profile & sync to patient discovery.
- `GET /api/provider/me` — Fetch current provider profile.
- `GET /api/doctors` — Search and filter doctors by speciality, hospital, and rating.
- `GET /api/doctors/:id` — Get single doctor profile.
- `GET /api/hospitals` — Search and filter hospitals by zone, state, and group.
- `GET /api/hospitals/:id` — Get single hospital details.
- `GET /api/specialities` — Get medical disciplines and procedures.

---

## 5. Environment Variables & Setup

Create a `.env` file in the root of `caresinindiaBackend`:

```env
PORT=8080
MONGO_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/cIn?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_2026
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

Install dependencies and start the server:
```bash
npm install
npm run dev
```
Server runs on port `8080`.
