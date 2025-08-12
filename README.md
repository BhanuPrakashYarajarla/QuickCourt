# QuickCourt – Local Sports Facility Booking Platform

QuickCourt is a full-stack web application that enables sports enthusiasts to book local sports facilities (e.g., badminton courts, turf grounds, tennis tables) and create or join matches with others in their area. The platform ensures a smooth booking experience, accurate scheduling, and community engagement.

## 🚀 Features

### **User Authentication**
- **Signup/Login** using email & password
- Avatar upload during signup
- OTP verification via **SendGrid API**
- Role selection: **User / Facility Owner / Admin**

### **User Role**
- Browse popular venues & sports
- Search and filter by:
  - Sport type
  - Price
  - Venue type
  - Rating
- Venue details page:
  - Name, description, amenities, gallery
  - Reviews section
  - Book Now option
- Court booking:
  - Select court & time slot
  - View price & total
  - **Simulated payment via Razorpay API**
  - Booking history with status tracking
- Profile management

### **Facility Owner Role**
- Dashboard with KPIs:
  - Daily/Weekly/Monthly booking trends
  - Earnings summary
  - Peak booking hours
- Facility management:
  - Add/Edit facility details
  - Manage courts, pricing, operating hours
  - Block time slots for maintenance
- Booking overview & calendar

### **Admin Role**
- Approve/reject facility registrations
- View and manage all users/facility owners
- Global stats dashboard:
  - Total users, bookings, active courts
  - Booking trends, most active sports, earnings simulation

---

## 🛠 Tech Stack

### **Frontend**
- **Next.js** (React framework)
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- Client-side API calls to Flask backend

### **Backend**
- **Python** with **Flask**
- **SQLite** database with **SQLAlchemy ORM**
- **SendGrid API** for OTP email verification
- **Razorpay API** for payment simulation
- RESTful API endpoints

---


---

## ⚙️ Installation & Setup

### **Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
flask run

```
```bash
cd frontend
npm install
npm run dev
```

# QuickCourt Backend API Documentation

## Authentication

### POST /auth/signup  
- Registers a new user with OTP verification.  
- Generates a random OTP and sends it to the user’s email via SendGrid.

### POST /auth/login  
- Logs in an existing user.

### POST /auth/verify-otp  
- Verifies the OTP submitted by the user to confirm their email.

---

## Venues

### GET /venues  
- Retrieves a list of all venues.  
- Supports filters (e.g., location, availability).

### GET /venues/:id  
- Retrieves detailed information about a specific venue by its ID.

---

## Bookings

### POST /bookings  
- Creates a new booking with integrated payment processing via Razorpay API.

### GET /bookings/user  
- Retrieves all bookings made by the logged-in user.

### DELETE /bookings/:id  
- Cancels a booking by its ID.

---

## Payment Flow (Razorpay API)

1. User selects a court and time slot on the frontend.  
2. Backend creates an order via the Razorpay API.  
3. Frontend opens the Razorpay checkout with order details.  
4. After payment, confirmation is sent back to the backend for verification.

---

## OTP Flow (SendGrid API)

1. On user signup, backend generates a random OTP.  
2. Backend sends the OTP to the user’s email using the SendGrid API.  
3. User submits the OTP to verify their account via `/auth/verify-otp`.

---


---

## Hackathon Context

This project was developed for **Odoo Hackathon 2025 – Final Round**, addressing **Problem Statement 1: QuickCourt** — a fast, seamless court booking system with secure payments and OTP-based authentication.

---


