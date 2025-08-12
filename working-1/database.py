import sqlite3
import os
from datetime import datetime

# Database file path
DB_FILE = "quickcourt.db"

def get_db_connection():
    """Get a database connection"""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database with required tables"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            avatar_url TEXT,
            role TEXT NOT NULL CHECK (role IN ('user', 'facility_owner', 'admin')) DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create otps table (for existing users)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS otps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            otp_code TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            is_used BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    # Create otps_temp table (for new signups before account creation)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS otps_temp (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            full_name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('user', 'facility_owner', 'admin')),
            avatar_url TEXT,
            otp_code TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            is_used BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_otps_user_id ON otps (user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON otps (expires_at)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_otps_temp_email ON otps_temp (email)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_otps_temp_expires_at ON otps_temp (expires_at)')
    
    # Create reviews table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            facility_id INTEGER NOT NULL,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            review_text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (facility_id) REFERENCES facilities (id)
        )
    ''')
    
    # Create facility_courts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS facility_courts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            facility_id INTEGER NOT NULL,
            sport_type TEXT NOT NULL,
            court_count INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (facility_id) REFERENCES facilities (id)
        )
    ''')
    
    # Create or update bookings table with new columns
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            court_id INTEGER NOT NULL,
            facility_id INTEGER,
            booking_date DATE NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            duration INTEGER DEFAULT 1,
            total_amount DECIMAL(10,2) NOT NULL,
            payment_method TEXT DEFAULT 'pay_at_venue',
            status TEXT DEFAULT 'confirmed',
            payment_status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (court_id) REFERENCES courts (id)
        )
    ''')
    
    # Add missing columns to existing bookings table if they don't exist
    cursor.execute('PRAGMA table_info(bookings)')
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'duration' not in columns:
        cursor.execute('ALTER TABLE bookings ADD COLUMN duration INTEGER DEFAULT 1')
    
    if 'payment_method' not in columns:
        cursor.execute('ALTER TABLE bookings ADD COLUMN payment_method TEXT DEFAULT "pay_at_venue"')
    
    if 'updated_at' not in columns:
        cursor.execute('ALTER TABLE bookings ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
    
    # Create time_slots table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS time_slots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            court_id INTEGER NOT NULL,
            day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            is_available BOOLEAN DEFAULT TRUE,
            reason TEXT,
            is_maintenance BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (court_id) REFERENCES courts (id)
        )
    ''')
    
    # Create indexes for new tables
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_reviews_facility_id ON reviews (facility_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews (user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_facility_courts_facility_id ON facility_courts (facility_id)')
    
    conn.commit()
    conn.close()

def close_db(conn):
    """Close database connection"""
    if conn:
        conn.close()
