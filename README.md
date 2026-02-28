# SlotMeIn 🗓️

SlotMeIn is an intuitive shift scheduling and talent management platform. It streamlines the process of managing personnel, configuring shifts, and generating optimized schedules with automated constraint validation.

---

Experience the live application here: **[SlotMeIn Live Demo 🚀 ](https://slotmein.onrender.com)**  

### Note
> This app is invite-only by design. Therefore you cannot create your own account.
> To explore the platform, use:

- username: test.user
- password: Password@123

The only downside of this is that you dont have access to user creation endpoints, meaning you cannot sent invites to new users. 
However, the core functionality of the app is fully available.
The test database is configured with AI generated test data.


---

## 👥 User Roles & Access

SlotMeIn supports two primary user roles, each with tiered access to features:

### 👑 Superuser (Admin)
Full system access for organizational management:
- **User Management**: Invite new users, manage active accounts, and assign roles.
- **System Configuration**: Define shift periods, templates, and global scheduling constraints.
- **Talent Management**: Create, update, and manage the personnel database.
- **Schedule Management**: Generate, override, and publish schedules.

### 👤 Regular User
Focuses on day-to-day operational visibility:
- **Dashboard**: View high-level metrics and upcoming shifts.
- **Schedules**: Access and view published schedules.
- **Talent List**: View talent profiles and availability (Read-only).

---

## 🛠️ Tech Stack

### Frontend
- **React 19**: Modern UI library with functional components and hooks.
- **Vite**: Ultra-fast build tool and development server.
- **Sass (SCSS Modules)**: Professional styling with scoped CSS.
- **Axios**: Robust HTTP client for API communication.
- **React Router 7**: Sophisticated routing for single-page applications.

---

## 📂 Project Structure (Client)

```text
src/
├── api/            # Axios services for all modules (Auth, Schedule, Talents, etc.)
├── components/     # Reusable UI components (Modals, Toast, Layout, Sidebar)
├── context/        # React Context providers (AuthContext for global state)
├── pages/          # Feature-specific views (Dashboard, Schedule, Talents, Admin)
├── styles/         # Global styles and SCSS variables
└── utils/          # Helper functions and formatting utilities
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- **Node.js**: (v18 or higher recommended)
- **npm** or **yarn**

### 2. Environment Configuration
Create a `.env` file in the root directory:
```bash
VITE_API_URL="https://slotmein.onrender.com"
```

### 3. Installation
```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```
The app will be available at `http://localhost:5173`.

---

## 🔌 API Endpoints Reference

The client communicates with the backend via the following key modules:

### 🔐 Authentication (`/users`)
> The user end points are not available in the live demo
- `POST /users/login_token`: Login and retrieve JWT.
- `POST /users/set_new_password`: Set password after invitation.
- `GET /users/list`: List all users (Superuser only).
- `POST /users/create`: Create a new user account.
- `POST /users/send_invite`: Send email invitation.

### 📅 Scheduling (`/schedule`)
- `GET /schedule/`: Retrieve all schedules.
- `POST /schedule/generate`: Trigger automated schedule generation.
- `POST /schedule/commit`: Save a generated draft.
- `PATCH /schedule/{id}/status`: Publish a schedule (set status to 'final').
- `POST /schedule/assignments/`: Create manual shift assignment.
- `POST /schedule/validate_assignment`: Check for constraint violations.

### 🎭 Talents (`/talents`)
- `GET /talents/retrieve_talents`: List all talent profiles.
- `POST /talents/create`: Create a new talent.
- `PUT /talents/update/{id}`: Edit talent details.

### ⚙️ Shift Config (`/shift_periods` & `/shift_templates`)
- `GET /shift_periods/retrieve_all_periods`: List all shift periods.
- `POST /shift_periods/create`: Define a new shift period (e.g., Morning, Night).
- `GET /shift_templates/retrieve_all_templates`: List scheduling templates.

---

## 📄 License

MIT


### Developed by Maua Imani
