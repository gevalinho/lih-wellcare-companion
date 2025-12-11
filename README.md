# WellCare Companion: Your Personalized Health Hub 🩺

<br />

Welcome to **WellCare Companion**, a comprehensive and intuitive health management platform designed to empower patients, caregivers, and doctors in monitoring and improving well-being. This application facilitates seamless data sharing, vital sign tracking, medication management, and personalized health insights, all built with modern web technologies for a secure and responsive experience.

<br />

## 🌟 Features

*   **Secure Authentication**: Robust user authentication and role-based access control (Patient, Caregiver, Doctor) powered by Supabase Auth.
*   **Vital Signs Logger**: Patients can easily log blood pressure, pulse, and other vital signs.
*   **Medication Tracker**: Manage medication regimens, log doses taken, and track adherence.
*   **Health History & Analytics**: Visualize health trends, review historical data, and generate comprehensive health reports.
*   **Data Sharing & Consent Manager**: Patients have full control over who can access their health data, with explicit consent management for caregivers and doctors.
*   **Automated Alerts**: Real-time notifications for critical health events, such as high blood pressure, to designated caregivers and doctors.
*   **Health Tips & Education**: Access a curated library of health tips covering nutrition, exercise, stress management, and more.
*   **Responsive User Interface**: A modern, mobile-friendly design built with React, TypeScript, and Tailwind CSS.

<br />

## 🚀 Technologies Used

| Category     | Technology                                                                                                                                                                                                                                                                  | Description                                                                     |
| :----------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------ |
| **Frontend** | [React](https://react.dev/)                                                                                                                                                                                                                                                 | A JavaScript library for building user interfaces.                              |
|              | [TypeScript](https://www.typescriptlang.org/)                                                                                                                                                                                                                               | A typed superset of JavaScript that compiles to plain JavaScript.               |
|              | [Vite](https://vitejs.dev/)                                                                                                                                                                                                                                                 | A fast build tool and development server for modern web projects.               |
|              | [Tailwind CSS](https://tailwindcss.com/)                                                                                                                                                                                                                                  | A utility-first CSS framework for rapidly styling web applications.             |
|              | [shadcn/ui](https://ui.shadcn.com/)                                                                                                                                                                                                                                         | Reusable UI components built with Radix UI and Tailwind CSS.                    |
|              | [Recharts](https://recharts.org/en-US/)                                                                                                                                                                                                                                     | Composable charting library built on React components.                          |
| **Backend**  | [Hono](https://hono.dev/)                                                                                                                                                                                                                                                   | A small, fast, and lightweight web framework for Node.js, Deno, and Cloudflare Workers. |
|              | [Supabase](https://supabase.com/)                                                                                                                                                                                                                                           | Open-source Firebase alternative providing a PostgreSQL database, Authentication, Edge Functions (for Hono), and more. |
|              | [Supabase Edge Functions](https://supabase.com/docs/guides/functions)                                                                                                                                                                                                       | Server-side logic deployed to a global CDN, running Hono API.                   |
|              | [Supabase Auth](https://supabase.com/docs/guides/auth)                                                                                                                                                                                                                      | Integrated authentication system for user management and JWT.                   |
|              | [Supabase Database (KV Store)](https://supabase.com/docs/guides/database/jsonb)                                                                                                                                                                                             | PostgreSQL database used as a key-value store for application data.             |
| **Deployment** | [Sevalla](https://sevalla.com/)                                                                                                                                                                                                                                             | Hosting platform for static sites and applications.                             |

<br />

---

# WellCare Companion API

## Overview
The WellCare Companion API is a secure backend service built with Hono on Supabase Edge Functions, utilizing Supabase Auth for user management and a PostgreSQL database (accessed via a KV store abstraction) for data persistence. It provides endpoints for user authentication, vital signs tracking, medication management, data sharing consent, and notifications for patients, caregivers, and doctors.

## Features
- **Hono Framework**: Lightweight and fast API development.
- **Supabase Auth**: Handles user registration, login, and session management.
- **Supabase KV Store**: Persistent storage for user profiles, vital signs, medications, and consent data.
- **Role-Based Access Control**: Middleware to ensure authenticated users have appropriate permissions.
- **CORS Support**: Configured for cross-origin requests.
- **Automated Health Alerts**: Triggers alerts for critical vital sign readings.
- **Notification System**: Delivers alerts to associated caregivers and doctors.

## Getting Started
### Installation
The backend API is deployed as a Supabase Edge Function. To set up or update the function:

1.  **Install Supabase CLI**:
    ```bash
    npm install -g supabase
    ```
2.  **Login to Supabase**:
    ```bash
    supabase login
    ```
3.  **Link to your Supabase Project**:
    Replace `your-project-ref` with your actual Supabase project reference.
    ```bash
    supabase link --project-ref your-project-ref
    ```
4.  **Deploy the Edge Function**:
    The Hono server is bundled as a single Edge Function.
    ```bash
    supabase functions deploy make-server-6e6f3496 --no-verify-jwt
    ```
    *Note: `--no-verify-jwt` is used for simplicity in this setup. In production, consider robust JWT verification.*

### Environment Variables
The Supabase Edge Function requires the following environment variables to be set in your Supabase project settings:

| Variable                  | Example Value                                       | Description                                                              |
| :------------------------ | :-------------------------------------------------- | :----------------------------------------------------------------------- |
| `SUPABASE_URL`            | `https://<your-project-ref>.supabase.co`            | The URL of your Supabase project.                                        |
| `SUPABASE_ANON_KEY`       | `eyJhbGciOiJIUzI1NiI...`                            | Your Supabase `anon` public key.                                         |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiI...`                            | Your Supabase `service_role` key (granting full access). **Keep this secure.** |
| `SUPABASE_DB_URL`         | `postgresql://postgres:password@db.supabase.co:5432/postgres` | Direct database connection string for `kv_store`.                        |

## API Documentation
### Base URL
All API requests should be prefixed with the following base URL:
`https://<your-supabase-project-ref>.supabase.co/functions/v1/make-server-6e6f3496`
*(Replace `<your-supabase-project-ref>` with your actual project reference from `SUPABASE_URL`)*

### Endpoints

#### GET /health
Checks the health of the API server.
**Request**:
No payload required.

**Response**:
```json
{
  "status": "ok"
}
```

**Errors**:
- `500 Internal Server Error`: Generic server error.

#### POST /auth/signup
Registers a new user with the specified role and profile data.
**Request**:
```json
{
  "email": "user@example.com",           // string, required
  "password": "StrongPassword123",       // string, required (min 6 characters)
  "name": "John Doe",                    // string, required
  "role": "patient",                     // string, required ("patient", "caregiver", or "doctor")
  "profileData": {                       // object, optional (role-specific details)
    "age": 30,                           // number, optional (for patient)
    "sex": "male",                       // string, optional ("male", "female", "other") (for patient)
    "conditions": "Hypertension",        // string, optional (for patient)
    "emergencyContact": "Jane Doe",      // string, optional (for patient)
    "emergencyPhone": "+1234567890",     // string, optional (for patient)
    "relationship": "Spouse",            // string, optional (for caregiver)
    "specialization": "Cardiology"       // string, optional (for doctor)
  }
}
```

**Response**:
```json
{
  "success": true,
  "userId": "uuid-of-new-user",
  "message": "User created successfully"
}
```

**Errors**:
- `400 Bad Request`: Missing required fields (`email`, `password`, `name`, `role`) or invalid `role`.
- `400 Bad Request`: `Failed to create user: {error_message}` (e.g., email already registered, password too weak).
- `500 Internal Server Error`: Signup failed due to unexpected server issue.

#### GET /auth/profile
Retrieves the profile of the authenticated user.
**Request**:
Authorization Header: `Bearer <access_token>`

**Response**:
```json
{
  "profile": {
    "id": "uuid-of-user",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "patient",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "age": 30,
    "sex": "male",
    "conditions": "Hypertension",
    "emergencyContact": "Jane Doe",
    "emergencyPhone": "+1234567890"
  }
}
```

**Errors**:
- `401 Unauthorized`: Missing or invalid authorization token.
- `404 Not Found`: Profile not found for the authenticated user.
- `500 Internal Server Error`: Failed to retrieve profile.

#### PUT /auth/profile
Updates the profile of the authenticated user.
**Request**:
Authorization Header: `Bearer <access_token>`
Payload:
```json
{
  "name": "John A. Doe",                  // string, optional
  "age": 31,                               // number, optional
  "conditions": "Hypertension, Diabetes"   // string, optional
  // Other profile fields can be updated, but `id`, `email`, `role` are immutable.
}
```

**Response**:
```json
{
  "success": true,
  "profile": {
    "id": "uuid-of-user",
    "email": "user@example.com",
    "name": "John A. Doe",
    "role": "patient",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-02T10:30:00.000Z",
    "age": 31,
    "conditions": "Hypertension, Diabetes"
  }
}
```

**Errors**:
- `401 Unauthorized`: Missing or invalid authorization token.
- `404 Not Found`: Profile not found for the authenticated user.
- `500 Internal Server Error`: Failed to update profile.

#### POST /vitals
Records new vital signs for the authenticated patient.
**Request**:
Authorization Header: `Bearer <access_token>`
Payload:
```json
{
  "systolic": 120,                        // number, required (e.g., 120 mmHg)
  "diastolic": 80,                        // number, required (e.g., 80 mmHg)
  "pulse": 72,                            // number, optional (e.g., 72 bpm)
  "notes": "Feeling good after walk",     // string, optional
  "timestamp": "2024-01-02T10:35:00.000Z" // string (ISO 8601), optional (defaults to current time)
}
```

**Response**:
```json
{
  "success": true,
  "vital": {
    "id": "vital:uuid-of-user:timestamp",
    "userId": "uuid-of-user",
    "systolic": 120,
    "diastolic": 80,
    "pulse": 72,
    "notes": "Feeling good after walk",
    "timestamp": "2024-01-02T10:35:00.000Z",
    "createdAt": "2024-01-02T10:35:00.000Z"
  },
  "alert": null // Or an alert object if a high BP is detected
}
```

**Response (with Alert Example)**:
```json
{
  "success": true,
  "vital": { /* ... vital details ... */ },
  "alert": {
    "id": "alert:uuid-of-user:timestamp",
    "userId": "uuid-of-user",
    "type": "high_bp",
    "severity": "warning", // or "critical"
    "message": "High blood pressure detected: 145/95 mmHg",
    "vital": "vital:uuid-of-user:timestamp",
    "timestamp": "2024-01-02T10:40:00.000Z",
    "read": false
  }
}
```

**Errors**:
- `401 Unauthorized`: Missing or invalid authorization token.
- `400 Bad Request`: Missing `systolic` or `diastolic` values.
- `500 Internal Server Error`: Failed to add vital signs.

#### GET /vitals
Retrieves the vital signs history for the authenticated user or a specified patient (if authorized).
**Request**:
Authorization Header: `Bearer <access_token>`
Query Parameters:
- `patientId`: `string`, optional (If provided by a caregiver/doctor to view a patient's vitals).

**Response**:
```json
{
  "vitals": [
    {
      "id": "vital:uuid-of-user:timestamp2",
      "userId": "uuid-of-user",
      "systolic": 125,
      "diastolic": 82,
      "pulse": 70,
      "notes": "",
      "timestamp": "2024-01-02T10:35:00.000Z",
      "createdAt": "2024-01-02T10:35:00.000Z"
    },
    {
      "id": "vital:uuid-of-user:timestamp1",
      "userId": "uuid-of-user",
      "systolic": 120,
      "diastolic": 80,
      "pulse": 72,
      "notes": "Feeling good after walk",
      "timestamp": "2024-01-01T09:00:00.000Z",
      "createdAt": "2024-01-01T09:00:00.000Z"
    }
  ]
}
```
*(Vitals are returned sorted by `timestamp` in descending order.)*

**Errors**:
- `401 Unauthorized`: Missing or invalid authorization token.
- `403 Forbidden`: Access denied if `patientId` is provided and the requester is not authorized.
- `500 Internal Server Error`: Failed to retrieve vitals.

#### POST /medications
Adds a new medication to the authenticated patient's regimen.
**Request**:
Authorization Header: `Bearer <access_token>`
Payload:
```json
{
  "name": "Lisinopril",                  // string, required
  "dosage": "10mg",                      // string, required
  "schedule": "Once daily with breakfast", // string, optional (defaults to "as needed")
  "notes": "Take with food"              // string, optional
}
```

**Response**:
```json
{
  "success": true,
  "medication": {
    "id": "medication:uuid-of-user:timestamp",
    "userId": "uuid-of-user",
    "name": "Lisinopril",
    "dosage": "10mg",
    "schedule": "Once daily with breakfast",
    "notes": "Take with food",
    "active": true,
    "createdAt": "2024-01-02T11:00:00.000Z"
  }
}
```

**Errors**:
- `401 Unauthorized`: Missing or invalid authorization token.
- `400 Bad Request`: Missing `name` or `dosage`.
- `500 Internal Server Error`: Failed to add medication.

#### GET /medications
Retrieves the list of medications for the authenticated user or a specified patient (if authorized).
**Request**:
Authorization Header: `Bearer <access_token>`
Query Parameters:
- `patientId`: `string`, optional (If provided by a caregiver/doctor to view a patient's medications).

**Response**:
```json
{
  "medications": [
    {
      "id": "medication:uuid-of-user:timestamp1",
      "userId": "uuid-of-user",
      "name": "Lisinopril",
      "dosage": "10mg",
      "schedule": "Once daily with breakfast",
      "notes": "Take with food",
      "active": true,
      "createdAt": "2024-01-02T11:00:00.000Z"
    },
    {
      "id": "medication:uuid-of-user:timestamp2",
      "userId": "uuid-of-user",
      "name": "Metformin",
      "dosage": "500mg",
      "schedule": "Twice daily",
      "notes": "",
      "active": true,
      "createdAt": "2024-01-01T08:00:00.000Z"
    }
  ]
}
```

**Errors**:
- `401 Unauthorized`: Missing or invalid authorization token.
- `403 Forbidden`: Access denied if `patientId` is provided and the requester is not authorized.
- `500 Internal Server Error`: Failed to retrieve medications.

#### POST /medications/log
Logs a dose of a medication, indicating whether it was taken or missed.
**Request**:
Authorization Header: `Bearer <access_token>`
Payload:
```json
{
  "medicationId": "medication:uuid-of-user:timestamp1", // string, required
  "taken": true,                                       // boolean, optional (defaults to true)
  "timestamp": "2024-01-02T12:00:00.000Z",             // string (ISO 8601), optional (defaults to current time)
  "notes": "Taken with lunch"                          // string, optional
}
```

**Response**:
```json
{
  "success": true,
  "log": {
    "id": "medlog:uuid-of-user:timestamp",
    "userId": "uuid-of-user",
    "medicationId": "medication:uuid-of-user:timestamp1",
    "taken": true,
    "timestamp": "2024-01-02T12:00:00.000Z",
    "notes": "Taken with lunch"
  }
}
```

**Errors**:
- `401 Unauthorized`: Missing or invalid authorization token.
- `400 Bad Request`: Missing `medicationId`.
- `500 Internal Server Error`: Failed to log medication dose.

#### GET /medications/logs
Retrieves the medication dose logs for the authenticated user or a specified patient (if authorized).
**Request**:
Authorization Header: `Bearer <access_token>`
Query Parameters:
- `patientId`: `string`, optional (If provided by a caregiver/doctor to view a patient's logs).

**Response**:
```json
{
  "logs": [
    {
      "id": "medlog:uuid-of-user:timestamp2",
      "userId": "uuid-of-user",
      "medicationId": "medication:uuid-of-user:timestamp1",
      "taken": true,
      "timestamp": "2024-01-02T12:00:00.000Z",
      "notes": "Taken with lunch"
    },
    {
      "id": "medlog:uuid-of-user:timestamp1",
      "userId": "uuid-of-user",
      "medicationId": "medication:uuid-of-user:timestamp2",
      "taken": false,
      "timestamp": "2024-01-01T08:00:00.000Z",
      "notes": ""
    }
  ]
}
```
*(Logs are returned sorted by `timestamp` in descending order.)*

**Errors**:
- `401 Unauthorized`: Missing or invalid authorization token.
- `403 Forbidden`: Access denied if `patientId` is provided and the requester is not authorized.
- `500 Internal Server Error`: Failed to retrieve medication logs.

#### POST /consent/grant
Grants access to the authenticated patient's health data to another user.
**Request**:
Authorization Header: `Bearer <access_token>`
Payload:
```json
{
  "granteeEmail": "caregiver@example.com", // string, required (email of the user to grant access)
  "accessLevel": "view"                     // string, required ("view" or "full")
}
```

**Response**:
```json
{
  "success": true,
  "consent": {
    "id": "consent:patient-uuid:grantee-uuid",
    "patientId": "patient-uuid",
    "granteeId": "grantee-uuid",
    "granteeEmail": "caregiver@example.com",
    "accessLevel": "view",
    "granted": true,
    "grantedAt": "2024-01-02T13:00:00.000Z"
  }
}
```

**Errors**:
- `401 Unauthorized`: Missing or invalid authorization token.
- `400 Bad Request`: Missing `granteeEmail` or `accessLevel`.
- `404 Not Found`: User with `granteeEmail` not found.
- `500 Internal Server Error`: Failed to grant consent.

#### POST /consent/revoke
Revokes access to the authenticated patient's health data from another user.
**Request**:
Authorization Header: `Bearer <access_token>`
Payload:
```json
{
  "granteeEmail": "caregiver@example.com" // string, required (email of the user to revoke access from)
}
```

**Response**:
```json
{
  "success": true
}
```

**Errors**:
- `401 Unauthorized`: Missing or invalid authorization token.
- `400 Bad Request`: Missing `granteeEmail`.
- `404 Not Found`: User with `granteeEmail` not found.
- `500 Internal Server Error`: Failed to revoke consent.

#### GET /consent/granted
Retrieves a list of users who have been granted access to the authenticated patient's data.
**Request**:
Authorization Header: `Bearer <access_token>`

**Response**:
```json
{
  "consents": [
    {
      "id": "consent:patient-uuid:caregiver-uuid",
      "patientId": "patient-uuid",
      "granteeId": "caregiver-uuid",
      "granteeEmail": "caregiver@example.com",
      "accessLevel": "view",
      "granted": true,
      "grantedAt": "2024-01-02T13:00:00.000Z"
    }
  ]
}
```

**Errors**:
- `401 Unauthorized`: Missing or invalid authorization token.
- `500 Internal Server Error`: Failed to retrieve granted consents.

#### GET /consent/patients
Retrieves a list of patients whose data the authenticated caregiver/doctor has access to.
**Request**:
Authorization Header: `Bearer <access_token>`

**Response**:
```json
{
  "patients": [
    {
      "id": "patient-uuid-1",
      "email": "patient1@example.com",
      "name": "Patient One",
      "role": "patient",
      "createdAt": "2024-01-01T10:00:00.000Z",
      "age": 45,
      "conditions": "Diabetes",
      "accessLevel": "full",
      "grantedAt": "2024-01-02T13:00:00.000Z"
    },
    {
      "id": "patient-uuid-2",
      "email": "patient2@example.com",
      "name": "Patient Two",
      "role": "patient",
      "createdAt": "2024-01-01T11:00:00.000Z",
      "age": 60,
      "conditions": "Hypertension",
      "accessLevel": "view",
      "grantedAt": "2024-01-02T14:00:00.000Z"
    }
  ]
}
```

**Errors**:
- `401 Unauthorized`: Missing or invalid authorization token.
- `500 Internal Server Error`: Failed to retrieve patients.

#### GET /alerts
Retrieves a list of alerts for the authenticated user or a specified patient (if authorized).
**Request**:
Authorization Header: `Bearer <access_token>`
Query Parameters:
- `patientId`: `string`, optional (For caregivers/doctors to view a patient's alerts).

**Response**:
```json
{
  "alerts": [
    {
      "id": "alert:uuid-of-user:timestamp2",
      "userId": "uuid-of-user",
      "type": "high_bp",
      "severity": "warning",
      "message": "High blood pressure detected: 145/95 mmHg",
      "vital": "vital:uuid-of-user:timestamp-ref",
      "timestamp": "2024-01-02T10:40:00.000Z",
      "read": false
    },
    {
      "id": "alert:uuid-of-user:timestamp1",
      "userId": "uuid-of-user",
      "type": "missed_medication",
      "severity": "info",
      "message": "You missed your Metformin dose.",
      "medicationLog": "medlog:uuid-of-user:timestamp-ref",
      "timestamp": "2024-01-01T18:00:00.000Z",
      "read": true
    }
  ]
}
```
*(Alerts are returned sorted by `timestamp` in descending order.)*

**Errors**:
- `401 Unauthorized`: Missing or invalid authorization token.
- `403 Forbidden`: Access denied if `patientId` is provided and the requester is not authorized.
- `500 Internal Server Error`: Failed to retrieve alerts.

#### PUT /alerts/:alertId/read
Marks a specific alert as read.
**Request**:
Authorization Header: `Bearer <access_token>`
Path Parameters:
- `alertId`: `string`, required (The ID of the alert to mark as read).

**Response**:
```json
{
  "success": true,
  "alert": {
    "id": "alert:uuid-of-user:timestamp",
    "userId": "uuid-of-user",
    "type": "high_bp",
    "severity": "warning",
    "message": "High blood pressure detected: 145/95 mmHg",
    "vital": "vital:uuid-of-user:timestamp-ref",
    "timestamp": "2024-01-02T10:40:00.000Z",
    "read": true // Updated to true
  }
}
```

**Errors**:
- `401 Unauthorized`: Missing or invalid authorization token.
- `404 Not Found`: Alert with `alertId` not found.
- `500 Internal Server Error`: Failed to mark alert as read.

#### GET /notifications
Retrieves a list of notifications for the authenticated user (caregiver/doctor).
**Request**:
Authorization Header: `Bearer <access_token>`

**Response**:
```json
{
  "notifications": [
    {
      "id": "notification:grantee-uuid:timestamp2",
      "userId": "grantee-uuid",
      "patientId": "patient-uuid",
      "type": "high_bp",
      "message": "Patient John Doe: High blood pressure detected: 150/98 mmHg",
      "alertId": "alert:patient-uuid:timestamp-ref",
      "timestamp": "2024-01-02T15:00:00.000Z",
      "read": false
    },
    {
      "id": "notification:grantee-uuid:timestamp1",
      "userId": "grantee-uuid",
      "patientId": "patient-uuid",
      "type": "consent_granted",
      "message": "Patient Jane Smith has granted you view access to their data.",
      "timestamp": "2024-01-02T13:00:00.000Z",
      "read": true
    }
  ]
}
```
*(Notifications are returned sorted by `timestamp` in descending order.)*

**Errors**:
- `401 Unauthorized`: Missing or invalid authorization token.
- `500 Internal Server Error`: Failed to retrieve notifications.

---

## 💻 Installation

To get the WellCare Companion application up and running on your local machine, follow these steps:

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/gevalinho/lih-wellcare-companion.git
    cd lih-wellcare-companion
    ```

2.  **Install Frontend Dependencies**
    The project uses `npm` for dependency management.
    ```bash
    npm install
    ```

3.  **Configure Supabase Client**
    Ensure your `src/utils/supabase/info.tsx` file correctly points to your Supabase project. This file is often auto-generated by Supabase CLI, but you can manually set `projectId` and `publicAnonKey` if needed.

    ```tsx
    // src/utils/supabase/info.tsx
    export const projectId = "YOUR_SUPABASE_PROJECT_REF"; // e.g., "vhfjpbdkrncpubntetsz"
    export const publicAnonKey = "YOUR_SUPABASE_ANON_KEY"; // Your project's anon key
    ```

4.  **Start the Frontend Development Server**
    ```bash
    npm run dev
    ```
    This will start the Vite development server, usually at `http://localhost:3000`. The application will automatically open in your browser.

<br />

## 🏃‍♀️ Usage

Once the application is running:

1.  **Access the Application**: Open your browser to `http://localhost:3000`.
2.  **Sign Up or Log In**:
    *   If you're a new user, navigate to the "Sign up" page and create an account. You can register as a `Patient`, `Caregiver`, or `Doctor`.
    *   If you already have an account, sign in using your credentials.
3.  **Explore Dashboards**:
    *   **Patients**: Log vital signs, track medications, view health history, manage data sharing, and get health tips.
    *   **Caregivers**: Monitor patients who have granted them access, review vital trends and medication adherence, and receive alerts.
    *   **Doctors**: Oversee multiple patients, analyze comprehensive health data, track medication adherence, manage alerts, and generate health reports.
4.  **Interact with Features**:
    *   Use the navigation sidebar (or mobile menu) to switch between different sections like "Log Vitals," "Medications," and "Data Sharing."
    *   Enter your blood pressure and pulse readings in the "Log Vitals" section.
    *   Add new medications and log doses in the "Medications" tracker.
    *   Explore graphs and historical data in the "Health History & Analytics" section.
    *   Patients can grant access to caregivers/doctors via email in "Data Sharing."

<br />

## 🤝 Contributing

We welcome contributions to the WellCare Companion project! To contribute:

*   **Fork the repository**.
*   **Create a new branch** for your feature or bug fix: `git checkout -b feature/your-feature-name`.
*   **Make your changes** and ensure they adhere to the project's coding standards.
*   **Test your changes** thoroughly.
*   **Commit your changes** with a clear and descriptive message.
*   **Push your branch** to your forked repository.
*   **Open a Pull Request** to the `main` branch of the original repository.

<br />


## 📜 License

This project is licensed under the MIT License.

<br />

---

<!-- Badges -->
[![GitHub top language](https://img.shields.io/github/languages/top/gevalinho/lih-wellcare-companion)](https://github.com/gevalinho/lih-wellcare-companion)
[![GitHub language count](https://img.shields.io/github/languages/count/gevalinho/lih-wellcare-companion)](https://github.com/gevalinho/lih-wellcare-companion)
[![GitHub repo size](https://img.shields.io/github/repo-size/gevalinho/lih-wellcare-companion)](https://github.com/gevalinho/lih-wellcare-companion)
[![GitHub last commit](https://img.shields.io/github/last-commit/gevalinho/lih-wellcare-companion)](https://github.com/gevalinho/lih-wellcare-companion)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Hono](https://img.shields.io/badge/Hono-F9D100?style=for-the-badge&logo=hono&logoColor=black)](https://hono.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)
  
