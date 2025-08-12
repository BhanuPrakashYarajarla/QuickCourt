#!/usr/bin/env python3
"""
Script to create venue-related database tables for QuickCourt
Run this to add the necessary tables for facility management
"""

import sqlite3
import os

def create_venue_tables():
    """Create all necessary tables for venue management"""
    
    # Connect to the database
    db_path = 'quickcourt.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Create facilities table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS facilities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                owner_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                location TEXT NOT NULL,
                phone TEXT,
                email TEXT,
                website TEXT,
                operating_hours_weekdays TEXT,
                operating_hours_weekends TEXT,
                status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending_approval')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')
        
        # Create facility_sports table (many-to-many relationship)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS facility_sports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                facility_id INTEGER NOT NULL,
                sport_name TEXT NOT NULL,
                FOREIGN KEY (facility_id) REFERENCES facilities (id) ON DELETE CASCADE,
                UNIQUE(facility_id, sport_name)
            )
        ''')
        
        # Create facility_amenities table (many-to-many relationship)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS facility_amenities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                facility_id INTEGER NOT NULL,
                amenity_name TEXT NOT NULL,
                FOREIGN KEY (facility_id) REFERENCES facilities (id) ON DELETE CASCADE,
                UNIQUE(facility_id, amenity_name)
            )
        ''')
        
        # Create facility_photos table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS facility_photos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                facility_id INTEGER NOT NULL,
                photo_url TEXT NOT NULL,
                caption TEXT,
                is_primary BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (facility_id) REFERENCES facilities (id) ON DELETE CASCADE
            )
        ''')
        
        # Create courts table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS courts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                facility_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                sport_type TEXT NOT NULL,
                surface_type TEXT,
                court_number INTEGER,
                hourly_rate DECIMAL(10,2),
                status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (facility_id) REFERENCES facilities (id) ON DELETE CASCADE
            )
        ''')
        
        # Create time_slots table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS time_slots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                court_id INTEGER NOT NULL,
                day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 1=Monday, etc.
                start_time TEXT NOT NULL, -- Format: HH:MM
                end_time TEXT NOT NULL, -- Format: HH:MM
                is_available BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (court_id) REFERENCES courts (id) ON DELETE CASCADE
            )
        ''')
        
        # Create bookings table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                court_id INTEGER NOT NULL,
                facility_id INTEGER NOT NULL,
                booking_date DATE NOT NULL,
                start_time TEXT NOT NULL, -- Format: HH:MM
                end_time TEXT NOT NULL, -- Format: HH:MM
                total_amount DECIMAL(10,2) NOT NULL,
                status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
                payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (court_id) REFERENCES courts (id) ON DELETE CASCADE,
                FOREIGN KEY (facility_id) REFERENCES facilities (id) ON DELETE CASCADE
            )
        ''')
        
        # Create indexes for better performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_facilities_owner_id ON facilities (owner_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_facilities_status ON facilities (status)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_courts_facility_id ON courts (facility_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings (user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_bookings_court_id ON bookings (court_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings (booking_date)')
        
        # Commit the changes
        conn.commit()
        
        print("✅ All venue-related tables created successfully!")
        
        # Show the created tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        tables = cursor.fetchall()
        
        print("\n📋 Created tables:")
        for table in tables:
            print(f"   - {table[0]}")
            
    except Exception as e:
        print(f"❌ Error creating tables: {str(e)}")
        conn.rollback()
        
    finally:
        conn.close()

def create_sample_facility():
    """Create a sample facility for testing"""
    
    db_path = 'quickcourt.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Get the first facility owner user
        cursor.execute('SELECT id FROM users WHERE role = "facility_owner" LIMIT 1')
        owner = cursor.fetchone()
        
        if not owner:
            print("❌ No facility owner found. Please create a facility owner user first.")
            return
        
        owner_id = owner[0]
        
        # Insert sample facility
        cursor.execute('''
            INSERT INTO facilities (owner_id, name, description, location, phone, email, website, 
                                  operating_hours_weekdays, operating_hours_weekends, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            owner_id,
            'Elite Sports Complex',
            'A premier sports facility offering world-class courts and fields for various sports. Our complex features state-of-the-art equipment, professional lighting, and comfortable amenities for players and spectators.',
            '123 Sports Avenue, Athletic City, AC 12345',
            '+1 (555) 123-4567',
            'info@elitesportscomplex.com',
            'www.elitesportscomplex.com',
            '6:00 AM - 10:00 PM',
            '7:00 AM - 11:00 PM',
            'active'
        ))
        
        facility_id = cursor.lastrowid
        
        # Add sports
        sports = ['Tennis', 'Basketball', 'Badminton', 'Football', 'Volleyball']
        for sport in sports:
            cursor.execute('INSERT INTO facility_sports (facility_id, sport_name) VALUES (?, ?)', (facility_id, sport))
        
        # Add amenities
        amenities = ['Parking', 'Restrooms', 'Changing Rooms', 'Equipment Rental', 'Cafeteria', 'Pro Shop', 'WiFi', 'Air Conditioning']
        for amenity in amenities:
            cursor.execute('INSERT INTO facility_amenities (facility_id, amenity_name) VALUES (?, ?)', (facility_id, amenity))
        
        # Add sample photos
        sample_photos = [
            'https://readdy.ai/api/search-image?query=modern%20sports%20complex%20exterior%20with%20multiple%20courts%20and%20facilities%2C%20professional%20architecture%2C%20clear%20blue%20sky%2C%20well%20maintained%20grounds&width=400&height=300&seq=facility1&orientation=landscape',
            'https://readdy.ai/api/search-image?query=indoor%20tennis%20courts%20with%20professional%20lighting%2C%20clean%20white%20walls%2C%20modern%20sports%20facility%20interior&width=400&height=300&seq=facility2&orientation=landscape',
            'https://readdy.ai/api/search-image?query=basketball%20court%20with%20wooden%20floor%2C%20professional%20lighting%2C%20modern%20sports%20arena%20interior&width=400&height=300&seq=facility3&orientation=landscape'
        ]
        
        for i, photo_url in enumerate(sample_photos):
            is_primary = (i == 0)  # First photo is primary
            cursor.execute('''
                INSERT INTO facility_photos (facility_id, photo_url, is_primary)
                VALUES (?, ?, ?)
            ''', (facility_id, photo_url, is_primary))
        
        # Add sample courts
        courts_data = [
            ('Tennis Court 1', 'Tennis', 'Hard Court', 1, 45.00),
            ('Tennis Court 2', 'Tennis', 'Clay Court', 2, 50.00),
            ('Basketball Court A', 'Basketball', 'Wooden Floor', 1, 35.00),
            ('Badminton Court 1', 'Badminton', 'Wooden Floor', 1, 25.00),
            ('Football Field 1', 'Football', 'Natural Grass', 1, 80.00)
        ]
        
        for court_name, sport_type, surface_type, court_number, hourly_rate in courts_data:
            cursor.execute('''
                INSERT INTO courts (facility_id, name, sport_type, surface_type, court_number, hourly_rate)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (facility_id, court_name, sport_type, surface_type, court_number, hourly_rate))
        
        conn.commit()
        print(f"✅ Sample facility 'Elite Sports Complex' created with ID: {facility_id}")
        
    except Exception as e:
        print(f"❌ Error creating sample facility: {str(e)}")
        conn.rollback()
        
    finally:
        conn.close()

if __name__ == "__main__":
    print("QuickCourt Venue Tables Creator")
    print("=" * 40)
    
    # Create the tables
    create_venue_tables()
    
    # Create a sample facility
    print("\n" + "=" * 40)
    create_sample_facility()
    
    print("\n🎉 Database setup completed!")
    print("\nNext steps:")
    print("1. Update the Flask backend to include venue endpoints")
    print("2. Modify the frontend to fetch real data")
    print("3. Test the facility management functionality")
