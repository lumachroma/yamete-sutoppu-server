# API Routes Documentation

### Public Routes (No Authentication Required)
Base URL: `/api/public`

**System Routes:**
- `GET /api/public/health` - Health check
- `GET /api/public/info` - API information

**Authentication Routes:**
- `POST /api/public/auth/login` - Request OTP
- `POST /api/public/auth/verify-otp` - Verify OTP and get tokens
- `POST /api/public/auth/refresh-token` - Refresh access token
- `POST /api/public/auth/logout-everywhere` - Logout from all devices

### Private Routes (JWT Authentication Required)
Base URL: `/api/private`

**Identity Routes:**
- `GET /api/private/identity/identity` - Get current user identity
- `GET /api/private/identity/dashboard` - Dashboard welcome message

**User Management Routes:**
- `GET /api/private/users` - List all users (paginated)
- `GET /api/private/users/:id` - Get user by ID
- `POST /api/private/users` - Create new user
- `PUT /api/private/users/:id` - Update user
- `DELETE /api/private/users/:id` - Delete user

## Route Organization

```
routes/
├── index.js             # Main router with legacy compatibility
├── public/
│   ├── index.js         # Public routes aggregator
│   ├── auth.js          # Authentication endpoints
│   └── system.js        # Health/info endpoints
└── private/
    ├── index.js         # Private routes aggregator
    ├── identity.js      # User identity endpoints
    └── users.js         # User management endpoints
```

## Middleware Organization

- `middlewares/auth.js` - Common authentication middleware
  - `requireAuth` - Requires valid JWT token
  - `optionalAuth` - Optional authentication (for mixed endpoints)
