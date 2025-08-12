# QuickCourt Flask Backend

A Python backend API for QuickCourt built with Flask and SQLite for user management and authentication with OTP verification.

## Features

- **User Management**: Signup with OTP verification, login, and role-based access control
- **OTP System**: 6-digit OTP sent via SendGrid email for signup verification
- **Role System**: Support for "user" and "facility_owner" roles
- **Secure Authentication**: Password hashing and OTP verification
- **Database**: SQLite with direct SQL operations (no ORM dependencies)
- **RESTful API**: Clean endpoints for all operations

## Project Structure

```
├── app.py                 # Main Flask application
├── models.py              # User & OTP model classes
├── database.py            # SQLite database operations
├── utils.py               # OTP generation & SendGrid email utilities
├── create_sample_data.py  # Script to populate database with sample data
├── test_api.py            # Comprehensive test suite
├── run.py                 # Startup script
├── requirements.txt       # Python dependencies
├── env.example            # Environment variables template
├── quickcourt.db          # SQLite database file (created automatically)
└── README.md             # This file
```

## Setup Instructions

### 1. Install Dependencies

```bash
pip3 install -r requirements.txt
```

### 2. Configure SendGrid

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and add your SendGrid API key:
   ```
   SENDGRID_API_KEY=your_actual_sendgrid_api_key_here
   SENDER_EMAIL=noreply@yourdomain.com
   ```

3. Verify your sender email in SendGrid dashboard

### 3. Run the Application

**Option 1: Using the startup script (recommended)**
```bash
python3 run.py
```

**Option 2: Direct execution**
```bash
python3 app.py
```

The Flask app will start on `http://localhost:5001`

### 4. Create Sample Data (Optional)

```bash
python3 create_sample_data.py
```

### 5. Run Tests (Optional)

```bash
python3 test_api.py
```

## API Endpoints

### Authentication

#### POST /signup
Create a new user account with OTP verification.

**Request Body:**
```json
{
    "full_name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "avatar_url": "https://example.com/avatar.jpg",  // optional
    "role": "user"  // optional, defaults to "user"
}
```

**Response (201):**
```json
{
    "message": "User created successfully. Please check your email for OTP verification.",
    "user_id": 1,
    "email": "john@example.com",
    "email_sent": true
}
```

**Note:** User account is created but requires OTP verification before login.

#### POST /verify-otp
Verify the OTP sent during signup.

**Request Body:**
```json
{
    "email": "john@example.com",
    "otp_code": "123456"
}
```

**Response (200):**
```json
{
    "message": "OTP verified successfully. You can now log in.",
    "user_id": 1,
    "email": "john@example.com"
}
```

#### POST /login
Authenticate a verified user.

**Request Body:**
```json
{
    "email": "john@example.com",
    "password": "password123"
}
```

**Response (200):**
```json
{
    "message": "Login successful",
    "user": {
        "id": 1,
        "full_name": "John Doe",
        "email": "john@example.com",
        "avatar_url": "https://example.com/avatar.jpg",
        "role": "user",
        "created_at": "2024-01-01T00:00:00"
    },
    "otp_verified": true
}
```

### User Queries

#### GET /users
Get all users with role="user".

#### GET /facility-owners
Get all users with role="facility_owner".

### Utility

#### GET /health
Health check endpoint.

## OTP System

### How It Works

1. **Signup**: User provides details → Account created → 6-digit OTP generated → Email sent via SendGrid
2. **Verification**: User enters OTP → System validates → Account activated → User can login
3. **Security**: OTP expires in 5 minutes, can only be used once

### OTP Features

- **6-digit numeric codes** (e.g., 123456)
- **5-minute expiration** from generation
- **Single-use only** (marked as used after verification)
- **Email delivery** via SendGrid API
- **No plain text logging** for security

### Email Template

**Subject:** "Your QuickCourt Signup OTP"

**Body:**
```
Hello [Name],

Your OTP is: [OTP_CODE]

This OTP will expire in 5 minutes.

If you didn't request this OTP, please ignore this email.

Best regards,
QuickCourt Team
```

## Database Schema

### Users Table

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Integer | Primary Key, Auto-increment | Unique user identifier |
| full_name | Text | Not Null | User's full name |
| email | Text | Not Null, Unique, Indexed | User's email address |
| password_hash | Text | Not Null | Hashed password |
| avatar_url | Text | Nullable | URL to user's avatar image |
| role | Text | Not Null, Check constraint | User role ("user" or "facility_owner") |
| created_at | Timestamp | Auto-set | User creation timestamp |

### OTPs Table

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Integer | Primary Key, Auto-increment | Unique OTP identifier |
| user_id | Integer | Foreign Key, Not Null | Reference to users.id |
| otp_code | Text | Not Null | 6-digit OTP code |
| expires_at | Timestamp | Not Null | OTP expiration time |
| is_used | Boolean | Default False | Whether OTP has been used |

## Security Features

- **Password Hashing**: Uses Werkzeug's `generate_password_hash` and `check_password_hash`
- **OTP Security**: Time-limited, single-use verification codes
- **Input Validation**: Email format and password strength validation
- **SQL Injection Protection**: Parameterized queries prevent SQL injection
- **Unique Constraints**: Email uniqueness enforced at database level
- **No OTP Logging**: OTP codes never logged in plain text

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- **400**: Bad Request (validation errors, invalid OTP)
- **401**: Unauthorized (invalid credentials)
- **404**: Not Found (user not found)
- **409**: Conflict (email already exists)
- **500**: Internal Server Error

## Testing the API

### Complete Signup Flow

```bash
# 1. Signup
curl -X POST http://localhost:5001/signup \
  -H "Content-Type: application/json" \
  -d '{"full_name": "Test User", "email": "test@example.com", "password": "password123"}'

# 2. Check email for OTP (or check database)
sqlite3 quickcourt.db "SELECT otp_code FROM otps WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com');"

# 3. Verify OTP
curl -X POST http://localhost:5001/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "otp_code": "123456"}'

# 4. Login
curl -X POST http://localhost:5001/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

## Development

### Running in Development Mode

```bash
python3 run.py
```

The app runs with debug mode enabled and auto-reloads on code changes.

### Database Reset

To reset the database, simply delete the `quickcourt.db` file and restart the application. The tables will be recreated automatically.

### Environment Variables

Create a `.env` file with:
```
SENDGRID_API_KEY=your_sendgrid_api_key
SENDER_EMAIL=noreply@yourdomain.com
```

## Production Considerations

- Change the `SECRET_KEY` in `app.py`
- Use environment variables for all configuration
- Verify sender email in SendGrid dashboard
- Implement proper logging
- Add rate limiting for OTP generation
- Use HTTPS in production
- Implement JWT tokens for session management
- Consider OTP resend functionality

## Troubleshooting

### Common Issues

1. **SendGrid errors**: Check API key and sender email verification
2. **OTP not received**: Check email spam folder, verify SendGrid configuration
3. **Port conflicts**: Change port in `run.py` if needed
4. **Database errors**: Ensure database file has write permissions

### Logs

Check the Flask console output for detailed error messages, including email sending failures.

## Technical Notes

This implementation uses:
- **Flask**: Web framework
- **SQLite**: Lightweight database
- **Direct SQL**: No ORM dependencies for better compatibility
- **Werkzeug**: Password hashing and security utilities
- **SendGrid**: Email delivery service
- **OTP Generation**: Secure random 6-digit codes

The backend is designed to be lightweight and compatible with various Python versions, including Python 3.13.
