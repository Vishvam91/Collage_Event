# CHARUSAT Event Management System

## Project Structure

```
FSD HACKATHON/
├── backend/                 # Node.js + Express.js backend
│   ├── models/             # MongoDB models
│   │   ├── User.js         # User model (Student/Organizer/Admin)
│   │   └── Event.js        # Event model
│   ├── routes/             # API routes
│   │   ├── auth.js         # Authentication routes
│   │   ├── events.js       # Event management routes
│   │   └── users.js        # User management routes
│   ├── middleware/         # Custom middleware
│   │   └── auth.js         # JWT authentication middleware
│   ├── package.json        # Backend dependencies
│   ├── server.js           # Main server file
│   └── .env               # Environment variables (not in git)
├── frontend/               # Frontend HTML/CSS/JS
│   └── index.html         # Main application interface
└── .gitignore             # Git ignore rules
```

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Database**: MongoDB

## Features Implemented

1. **User Authentication & Roles**
   - Student registration with student ID and department
   - Organizer/Admin registration
   - JWT-based login system
   - Role-based access control

2. **Event Management**
   - Create events (organizers/admins only)
   - View all events
   - Event categories and filtering
   - Seat limit management

3. **Event Registration**
   - Students can register/unregister for events
   - Real-time seat availability
   - Registration validation

4. **Dashboard**
   - Student dashboard with registered events
   - Organizer dashboard with created events
   - Statistics and event management

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event (auth required)
- `GET /api/events/:id` - Get single event
- `POST /api/events/:id/register` - Register for event (auth required)
- `POST /api/events/:id/unregister` - Unregister from event (auth required)
- `PUT /api/events/:id` - Update event (auth required)
- `DELETE /api/events/:id` - Delete event (auth required)

### Users
- `GET /api/users/profile` - Get user profile (auth required)
- `GET /api/users/my-events` - Get registered events (auth required)
- `GET /api/users/my-organized-events` - Get organized events (auth required)
- `GET /api/users/all` - Get all users (admin only)
- `PUT /api/users/profile` - Update profile (auth required)

## Setup Instructions

1. Clone the repository
2. Navigate to backend folder: `cd backend`
3. Install dependencies: `npm install`
4. Create `.env` file with required environment variables
5. Start MongoDB service
6. Start the server: `npm start`
7. Open `frontend/index.html` in a web browser

## Environment Variables

Create a `.env` file in the backend folder:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/charusat_events
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
```
