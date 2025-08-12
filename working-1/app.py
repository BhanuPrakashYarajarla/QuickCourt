from flask import Flask, request, jsonify, current_app, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db_connection, init_db, close_db
from models import User, UserRole, OTP
from utils import generate_otp, get_otp_expiry, send_otp_email, is_otp_expired
from file_utils import save_uploaded_file, delete_file
import sqlite3
import re
import os
from datetime import datetime, timedelta
import random
import string

# Configuration
UPLOAD_FOLDER = 'uploads/facility_photos'
ALLOWED_CITIES = ['Ahmedabad', 'Bangalore', 'Delhi', 'Mumbai', 'Hyderabad']

# Create Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Change this in production

# Enable CORS for all routes
CORS(app, origins=["http://localhost:3000", "http://localhost:3001"], supports_credentials=True)

# Initialize database
init_db()

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    return len(password) >= 6

def create_user_from_row(row):
    """Create User object from database row"""
    return User(
        id=row['id'],
        full_name=row['full_name'],
        email=row['email'],
        password_hash=row['password_hash'],
        avatar_url=row['avatar_url'],
        role=UserRole(row['role']),
        created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else None
    )

def create_otp_from_row(row):
    """Create OTP object from database row"""
    return OTP(
        id=row['id'],
        user_id=row['user_id'],
        otp_code=row['otp_code'],
        expires_at=datetime.fromisoformat(row['expires_at']) if row['expires_at'] else None,
        is_used=bool(row['is_used'])
    )

@app.route('/signup', methods=['POST'])
def signup():
    """Send OTP for signup (account not created yet)"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['full_name', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate email format
        if not validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password strength
        if not validate_password(data['password']):
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
        # Validate role if provided
        role = data.get('role', 'user')
        if role not in ['user', 'facility_owner', 'admin']:
            return jsonify({'error': 'Invalid role. Must be "user", "facility_owner", or "admin"'}), 400
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Check if user already exists
            cursor.execute('SELECT id FROM users WHERE email = ?', (data['email'],))
            if cursor.fetchone():
                return jsonify({'error': 'Email already exists'}), 409
            
            # Generate OTP
            otp_code = generate_otp()
            expires_at = get_otp_expiry()
            
            # Store OTP temporarily (without user_id since user doesn't exist yet)
            cursor.execute('''
                INSERT INTO otps_temp (email, full_name, password_hash, role, avatar_url, otp_code, expires_at, is_used)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                data['email'], 
                data['full_name'], 
                generate_password_hash(data['password']), 
                role, 
                data.get('avatar_url'), 
                otp_code, 
                expires_at.isoformat(), 
                False
            ))
            
            conn.commit()
            
            # Send OTP email
            email_sent, email_message = send_otp_email(data['email'], data['full_name'], otp_code)
            
            if not email_sent:
                print(f"Warning: Failed to send OTP email to {data['email']}: {email_message}")
                return jsonify({'error': 'Failed to send OTP email. Please try again.'}), 500
            
            return jsonify({
                'message': 'OTP sent successfully. Please check your email for verification.',
                'email': data['email'],
                'email_sent': True
            }), 200
            
        except sqlite3.IntegrityError as e:
            conn.rollback()
            if "UNIQUE constraint failed" in str(e):
                return jsonify({'error': 'Email already exists'}), 409
            raise e
        finally:
            close_db(conn)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    """Verify OTP and create user account"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('otp_code'):
            return jsonify({'error': 'Email and OTP code are required'}), 400
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Get temporary OTP data
            cursor.execute('''
                SELECT * FROM otps_temp 
                WHERE email = ? AND otp_code = ? AND is_used = FALSE
                ORDER BY created_at DESC
                LIMIT 1
            ''', (data['email'], data['otp_code']))
            
            otp_temp_row = cursor.fetchone()
            
            if not otp_temp_row:
                return jsonify({'error': 'Invalid or expired OTP'}), 400
            
            # Check if OTP has expired
            expires_at = datetime.fromisoformat(otp_temp_row['expires_at'])
            if is_otp_expired(expires_at):
                return jsonify({'error': 'OTP has expired'}), 400
            
            # Mark OTP as used
            cursor.execute('UPDATE otps_temp SET is_used = TRUE WHERE id = ?', (otp_temp_row['id'],))
            
            # Create the user account
            cursor.execute('''
                INSERT INTO users (full_name, email, password_hash, avatar_url, role)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                otp_temp_row['full_name'],
                otp_temp_row['email'],
                otp_temp_row['password_hash'],
                otp_temp_row['avatar_url'],
                otp_temp_row['role']
            ))
            
            user_id = cursor.lastrowid
            
            # Clean up temporary OTP data
            cursor.execute('DELETE FROM otps_temp WHERE email = ?', (data['email'],))
            
            conn.commit()
            
            return jsonify({
                'message': 'Account created successfully! You can now log in.',
                'user_id': user_id,
                'email': data['email']
            }), 201
            
        finally:
            close_db(conn)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user by email
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE email = ?', (data['email'],))
            user_row = cursor.fetchone()
            
            if not user_row:
                return jsonify({'error': 'Invalid credentials'}), 401
            
            user = create_user_from_row(user_row)
            
            # Check password
            if not check_password_hash(user.password_hash, data['password']):
                return jsonify({'error': 'Invalid credentials'}), 401
            
            # Check if user has verified OTP (skip for admin users)
            if user.role == 'admin':
                otp_verified = True
            else:
                cursor.execute('''
                    SELECT COUNT(*) as verified_count 
                    FROM otps 
                    WHERE user_id = ? AND is_used = TRUE
                ''', (user.id,))
                
                verified_count = cursor.fetchone()['verified_count']
                otp_verified = verified_count > 0
            
            # Return user details
            return jsonify({
                'message': 'Login successful',
                'user': user.to_dict(),
                'otp_verified': otp_verified
            }), 200
            
        finally:
            close_db(conn)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/users', methods=['GET'])
def get_users():
    """Get all users with role='user'"""
    try:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE role = ?', ('user',))
            user_rows = cursor.fetchall()
            
            user_list = []
            for row in user_rows:
                user = create_user_from_row(row)
                user_list.append(user.to_dict())
            
            return jsonify({
                'users': user_list,
                'count': len(user_list)
            }), 200
            
        finally:
            close_db(conn)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/facility-owners', methods=['GET'])
def get_facility_owners():
    """Get all users with role='facility_owner'"""
    try:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE role = ?', ('facility_owner',))
            owner_rows = cursor.fetchall()
            
            owner_list = []
            for row in owner_rows:
                owner = create_user_from_row(row)
                owner_list.append(owner.to_dict())
            
            return jsonify({
                'facility_owners': owner_list,
                'count': len(owner_list)
            }), 200
            
        finally:
            close_db(conn)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin/stats', methods=['GET'])
def get_admin_stats():
    """Get admin dashboard statistics"""
    try:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Get total users count
            cursor.execute('SELECT COUNT(*) FROM users WHERE role = ?', ('user',))
            total_users = cursor.fetchone()[0]
            
            # Get total facility owners count
            cursor.execute('SELECT COUNT(*) FROM users WHERE role = ?', ('facility_owner',))
            total_facility_owners = cursor.fetchone()[0]
            
            # Get total facilities count
            cursor.execute('SELECT COUNT(*) FROM facilities')
            total_facilities = cursor.fetchone()[0]
            
            # Get total bookings count
            cursor.execute('SELECT COUNT(*) FROM bookings')
            total_bookings = cursor.fetchone()[0]
            
            # Get total courts count
            cursor.execute('SELECT COUNT(*) FROM courts')
            total_courts = cursor.fetchone()[0]
            
            # Get pending facility approvals
            cursor.execute('SELECT COUNT(*) FROM facilities WHERE status = ?', ('pending',))
            pending_approvals = cursor.fetchone()[0]
            
            # Get monthly user registrations (last 6 months)
            cursor.execute('''
                SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
                FROM users 
                WHERE created_at >= date('now', '-6 months')
                GROUP BY strftime('%Y-%m', created_at)
                ORDER BY month DESC
            ''')
            monthly_registrations = cursor.fetchall()
            
            # Get monthly bookings (last 6 months)
            cursor.execute('''
                SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
                FROM bookings 
                WHERE created_at >= date('now', '-6 months')
                GROUP BY strftime('%Y-%m', created_at)
                ORDER BY month DESC
            ''')
            monthly_bookings = cursor.fetchall()
            
            # Get most active sports
            cursor.execute('''
                SELECT fc.sport_type, COUNT(b.id) as booking_count
                FROM facility_courts fc
                LEFT JOIN courts c ON fc.facility_id = c.facility_id
                LEFT JOIN bookings b ON c.id = b.court_id
                WHERE b.id IS NOT NULL
                GROUP BY fc.sport_type
                ORDER BY booking_count DESC
                LIMIT 5
            ''')
            most_active_sports = cursor.fetchall()
            
            return jsonify({
                'kpi_data': {
                    'total_users': total_users,
                    'total_facility_owners': total_facility_owners,
                    'total_facilities': total_facilities,
                    'total_bookings': total_bookings,
                    'total_courts': total_courts,
                    'pending_approvals': pending_approvals
                },
                'monthly_registrations': [{'month': row[0], 'count': row[1]} for row in monthly_registrations],
                'monthly_bookings': [{'month': row[0], 'count': row[1]} for row in monthly_bookings],
                'most_active_sports': [{'sport': row[0], 'bookings': row[1]} for row in most_active_sports]
            }), 200
            
        finally:
            close_db(conn)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin/users', methods=['GET'])
def get_all_users():
    """Get all users for admin management"""
    try:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Get all users with their details
            cursor.execute('''
                SELECT u.*, 
                       COUNT(DISTINCT b.id) as total_bookings,
                       COALESCE(SUM(b.total_amount), 0) as total_spent,
                       COUNT(DISTINCT f.id) as facilities_owned
                FROM users u
                LEFT JOIN bookings b ON u.id = b.user_id
                LEFT JOIN facilities f ON u.id = f.owner_id
                GROUP BY u.id
                ORDER BY u.created_at DESC
            ''')
            
            users_data = []
            for row in cursor.fetchall():
                user_data = {
                    'id': row['id'],
                    'full_name': row['full_name'],
                    'email': row['email'],
                    'role': row['role'],
                    'status': 'active',  # Default status
                    'join_date': row['created_at'],
                    'last_active': row['created_at'],  # Default to creation date
                    'total_bookings': row['total_bookings'] or 0,
                    'total_spent': float(row['total_spent'] or 0),
                    'facilities_owned': row['facilities_owned'] or 0
                }
                users_data.append(user_data)
            
            return jsonify({
                'users': users_data,
                'count': len(users_data)
            }), 200
            
        finally:
            close_db(conn)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin/facilities', methods=['GET'])
def get_all_facilities():
    """Get all facilities for admin management"""
    try:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Get all facilities with owner details
            cursor.execute('''
                SELECT f.*, u.full_name as owner_name, u.email as owner_email
                FROM facilities f
                LEFT JOIN users u ON f.owner_id = u.id
                ORDER BY f.created_at DESC
            ''')
            
            facilities_data = []
            for row in cursor.fetchall():
                # Get sports for this facility from facility_courts
                cursor.execute('''
                    SELECT sport_type, court_count
                    FROM facility_courts
                    WHERE facility_id = ?
                ''', (row['id'],))
                sports_data = cursor.fetchall()
                
                # Get photos for this facility
                cursor.execute('''
                    SELECT photo_url, is_primary
                    FROM facility_photos
                    WHERE facility_id = ?
                    ORDER BY is_primary DESC, created_at ASC
                ''', (row['id'],))
                photos_data = cursor.fetchall()
                
                facility_data = {
                    'id': row['id'],
                    'name': row['name'],
                    'owner': row['owner_name'] or 'Unknown Owner',
                    'email': row['owner_email'] or 'No email',
                    'location': f"{row.get('city', 'Unknown')}, {row.get('state', 'Unknown')}",
                    'submission_date': row['created_at'],
                    'status': row.get('status', 'pending'),
                    'description': row.get('description', ''),
                    'sports': [sport['sport_type'] for sport in sports_data],
                    'amenities': ['Parking', 'Restrooms'],  # Default amenities
                    'photos': [photo['photo_url'] for photo in photos_data],
                    'documents': ['Business License']  # Default documents
                }
                facilities_data.append(facility_data)
            
            return jsonify({
                'facilities': facilities_data,
                'count': len(facilities_data)
            }), 200
            
        finally:
            close_db(conn)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin/facilities/<int:facility_id>/approve', methods=['POST'])
def approve_facility(facility_id):
    """Approve or reject a facility"""
    try:
        data = request.get_json()
        action = data.get('action')  # 'approve' or 'reject'
        comments = data.get('comments', '')
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            if action == 'approve':
                cursor.execute('UPDATE facilities SET status = ? WHERE id = ?', ('approved', facility_id))
                message = 'Facility approved successfully'
            elif action == 'reject':
                cursor.execute('UPDATE facilities SET status = ?, rejection_reason = ? WHERE id = ?', ('rejected', comments, facility_id))
                message = 'Facility rejected'
            else:
                return jsonify({'error': 'Invalid action'}), 400
            
            conn.commit()
            
            return jsonify({
                'message': message,
                'facility_id': facility_id,
                'status': action
            }), 200
            
        finally:
            close_db(conn)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/update-profile', methods=['POST'])
def update_profile():
    """Update user profile information"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        full_name = data.get('full_name')
        email = data.get('email')
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not all([user_id, full_name, email]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Check if email is already taken by another user
            cursor.execute('SELECT id FROM users WHERE email = ? AND id != ?', (email, user_id))
            if cursor.fetchone():
                return jsonify({'error': 'Email is already taken by another user'}), 400
            
            # If changing password, verify current password
            if new_password:
                if not current_password:
                    return jsonify({'error': 'Current password is required to change password'}), 400
                
                cursor.execute('SELECT password_hash FROM users WHERE id = ?', (user_id,))
                user = cursor.fetchone()
                if not user:
                    return jsonify({'error': 'User not found'}), 404
                
                if not check_password_hash(current_password, user['password_hash']):
                    return jsonify({'error': 'Current password is incorrect'}), 400
                
                # Hash new password
                new_password_hash = generate_password_hash(new_password)
                cursor.execute('''
                    UPDATE users 
                    SET full_name = ?, email = ?, password_hash = ?
                    WHERE id = ?
                ''', (full_name, email, new_password_hash, user_id))
            else:
                # Update only name and email
                cursor.execute('''
                    UPDATE users 
                    SET full_name = ?, email = ?
                    WHERE id = ?
                ''', (full_name, email, user_id))
            
            conn.commit()
            
            return jsonify({
                'message': 'Profile updated successfully',
                'user_id': user_id,
                'full_name': full_name,
                'email': email
            }), 200
            
        finally:
            close_db(conn)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/check-email-status', methods=['GET'])
def check_email_status():
    """Check email status and OTP storage (for testing)"""
    try:
        email = request.args.get('email')
        if not email:
            return jsonify({'error': 'Email parameter is required'}), 400
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Check if OTP exists for this email
            cursor.execute('''
                SELECT id, full_name, role, otp_code, expires_at, is_used, created_at
                FROM otps_temp 
                WHERE email = ? 
                ORDER BY created_at DESC
                LIMIT 1
            ''', (email,))
            
            otp_data = cursor.fetchone()
            
            if not otp_data:
                return jsonify({
                    'email': email,
                    'status': 'No OTP found',
                    'message': 'No OTP has been sent to this email'
                }), 404
            
            # Check if user already exists
            cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
            user_exists = cursor.fetchone() is not None
            
            return jsonify({
                'email': email,
                'status': 'OTP found',
                'user_exists': user_exists,
                'otp_data': {
                    'id': otp_data['id'],
                    'full_name': otp_data['full_name'],
                    'role': otp_data['role'],
                    'otp_code': otp_data['otp_code'],  # For testing only - remove in production
                    'expires_at': otp_data['expires_at'],
                    'is_used': otp_data['is_used'],
                    'created_at': otp_data['created_at']
                },
                'message': 'OTP found in temporary storage'
            }), 200
            
        finally:
            close_db(conn)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Venue and Facility Management Endpoints

@app.route('/facilities', methods=['GET'])
def get_facilities():
    """Get all active facilities"""
    try:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT f.id, f.name, f.description, f.location, f.city, f.phone, f.email, f.website,
                       f.operating_hours_weekdays, f.operating_hours_weekends, f.status,
                       f.created_at, f.updated_at,
                       u.full_name as owner_name, u.email as owner_email
                FROM facilities f
                JOIN users u ON f.owner_id = u.id
                WHERE f.status = 'active'
                ORDER BY f.created_at DESC
            ''')
            
            # Get reviews for each facility
            cursor.execute('''
                SELECT facility_id, AVG(rating) as avg_rating, COUNT(*) as total_reviews
                FROM reviews
                GROUP BY facility_id
            ''')
            
            reviews_data = {}
            for row in cursor.fetchall():
                reviews_data[row['facility_id']] = {
                    'average_rating': round(row['avg_rating'], 1) if row['avg_rating'] else 0,
                    'total_reviews': row['total_reviews']
                }
            
            # Get the facilities data
            cursor.execute('''
                SELECT f.id, f.name, f.description, f.location, f.city, f.phone, f.email, f.website,
                       f.operating_hours_weekdays, f.operating_hours_weekends, f.status,
                       f.created_at, f.updated_at,
                       u.full_name as owner_name, u.email as owner_email
                FROM facilities f
                JOIN users u ON f.owner_id = u.id
                WHERE f.status = 'active'
                ORDER BY f.created_at DESC
            ''')
            
            # Format facilities with reviews
            facilities = []
            for row in cursor.fetchall():
                facility = {
                    'id': row['id'],
                    'name': row['name'],
                    'description': row['description'],
                    'location': row['location'],
                    'city': row['city'],
                    'phone': row['phone'],
                    'email': row['email'],
                    'website': row['website'],
                    'operating_hours_weekdays': row['operating_hours_weekdays'],
                    'operating_hours_weekends': row['operating_hours_weekends'],
                    'status': row['status'],
                    'owner_name': row['owner_name'],
                    'owner_email': row['owner_email'],
                    'created_at': row['created_at'],
                    'updated_at': row['updated_at']
                }
                
                # Add review stats
                if row['id'] in reviews_data:
                    facility['reviews'] = reviews_data[row['id']]
                else:
                    facility['reviews'] = {'average_rating': 0, 'total_reviews': 0}
                
                # Get sports
                cursor.execute('SELECT sport_type FROM facility_courts WHERE facility_id = ?', (row['id'],))
                facility['sports'] = [sport_row['sport_type'] for sport_row in cursor.fetchall()]
                
                # Get amenities
                cursor.execute('SELECT amenity_name FROM facility_amenities WHERE facility_id = ?', (row['id'],))
                facility['amenities'] = [amenity_row['amenity_name'] for amenity_row in cursor.fetchall()]
                
                # Get photos
                cursor.execute('''
                    SELECT fp.photo_url, fp.caption, fp.is_primary 
                    FROM facility_photos fp
                    WHERE fp.facility_id = ?
                    ORDER BY fp.is_primary DESC, fp.id ASC
                ''', (row['id'],))
                facility['photos'] = [{'url': photo_row['photo_url'], 'caption': photo_row['caption'], 'is_primary': bool(photo_row['is_primary'])} for photo_row in cursor.fetchall()]
                
                facilities.append(facility)
            
            return jsonify({
                'facilities': facilities,
                'count': len(facilities)
            }), 200
            
        finally:
            close_db(conn)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/facilities/my', methods=['GET'])
def get_my_facilities():
    """Get facilities owned by the authenticated user"""
    try:
        # Get user ID from query parameter (in a real app, use JWT tokens)
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Verify user exists and is a facility owner
            cursor.execute('SELECT id, role FROM users WHERE id = ?', (user_id,))
            user = cursor.fetchone()
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            if user['role'] != 'facility_owner':
                return jsonify({'error': 'User is not a facility owner'}), 403
            
            # Get facilities owned by this user
            cursor.execute('''
                SELECT * FROM facilities 
                WHERE owner_id = ? 
                ORDER BY created_at DESC
            ''', (user_id,))
            
            facilities = []
            for row in cursor.fetchall():
                # Get sports for this facility
                cursor.execute('SELECT sport_type FROM facility_courts WHERE facility_id = ?', (row['id'],))
                sports = [sport_row['sport_type'] for sport_row in cursor.fetchall()]
                
                # Get amenities for this facility
                cursor.execute('SELECT amenity_name FROM facility_amenities WHERE facility_id = ?', (row['id'],))
                amenities = [amenity_row['amenity_name'] for amenity_row in cursor.fetchall()]
                
                # Get all photos
                cursor.execute('SELECT photo_url, caption, is_primary FROM facility_photos WHERE facility_id = ? ORDER BY is_primary DESC, created_at ASC', (row['id'],))
                photos = [{'url': photo_row['photo_url'], 'caption': photo_row['caption'], 'is_primary': photo_row['is_primary']} for photo_row in cursor.fetchall()]
                
                # Get courts count
                cursor.execute('SELECT COUNT(*) as court_count FROM courts WHERE facility_id = ?', (row['id'],))
                court_count = cursor.fetchone()['court_count']
                
                facility = {
                    'id': row['id'],
                    'name': row['name'],
                    'description': row['description'],
                    'location': row['location'],
                    'phone': row['phone'],
                    'email': row['email'],
                    'website': row['website'],
                    'operating_hours_weekdays': row['operating_hours_weekdays'],
                    'operating_hours_weekends': row['operating_hours_weekends'],
                    'status': row['status'],
                    'sports': sports,
                    'amenities': amenities,
                    'photos': photos,
                    'court_count': court_count,
                    'created_at': row['created_at'],
                    'updated_at': row['updated_at']
                }
                facilities.append(facility)
            
            return jsonify({
                'facilities': facilities,
                'count': len(facilities)
            }), 200
            
        finally:
            close_db(conn)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/facilities/<int:facility_id>', methods=['GET'])
def get_facility(facility_id):
    """Get a specific facility by ID with all details"""
    try:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Get facility with owner details
            cursor.execute('''
                SELECT f.id, f.name, f.description, f.location, f.city, f.phone, f.email, f.website,
                       f.operating_hours_weekdays, f.operating_hours_weekends, f.status,
                       f.created_at, f.updated_at,
                       u.full_name as owner_name, u.email as owner_email
                FROM facilities f
                JOIN users u ON f.owner_id = u.id
                WHERE f.id = ? AND f.status = 'active'
            ''', (facility_id,))
            
            facility = cursor.fetchone()
            if not facility:
                return jsonify({'error': 'Facility not found'}), 404
            
            # Get photos for this facility
            cursor.execute('''
                SELECT fp.photo_url, fp.caption, fp.is_primary 
                FROM facility_photos fp
                WHERE fp.facility_id = ?
                ORDER BY fp.is_primary DESC, fp.id ASC
            ''', (facility_id,))
            
            photos = []
            for photo_row in cursor.fetchall():
                photos.append({
                    'url': photo_row['photo_url'],
                    'is_primary': bool(photo_row['is_primary'])
                })
            
            # Get sports for this facility
            cursor.execute('SELECT sport_type FROM facility_courts WHERE facility_id = ?', (facility_id,))
            sports = [sport_row['sport_type'] for sport_row in cursor.fetchall()]
            
            # Get amenities for this facility
            cursor.execute('SELECT amenity_name FROM facility_amenities WHERE facility_id = ?', (facility_id,))
            amenities = [amenity_row['amenity_name'] for amenity_row in cursor.fetchall()]
            
            # Get reviews for this facility
            cursor.execute('''
                SELECT AVG(rating) as average_rating, COUNT(*) as total_reviews
                FROM reviews
                WHERE facility_id = ?
            ''', (facility_id,))
            
            review_stats = cursor.fetchone()
            reviews = {
                'average_rating': float(review_stats['average_rating'] or 0),
                'total_reviews': review_stats['total_reviews'] or 0
            }
            
            facility_data = {
                'id': facility['id'],
                'name': facility['name'],
                'description': facility['description'],
                'city': facility['city'],
                'state': 'Gujarat',  # Default state
                'address': facility['location'],
                'operating_hours': f"{facility['operating_hours_weekdays']} / {facility['operating_hours_weekends']}",
                'photos': photos,
                'facility_courts': [{'sport_type': sport, 'court_count': 1} for sport in sports],
                'amenities': amenities,
                'owner_name': facility['owner_name'],
                'created_at': facility['created_at']
            }
            
            return jsonify({
                'facility': facility_data
            }), 200
            
        finally:
            close_db(conn)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/facilities', methods=['POST'])
def create_facility():
    """Create a new facility with file upload support"""
    try:
        # Check if request is multipart/form-data for file uploads
        if request.content_type.startswith('multipart/form-data'):
            data = request.form.to_dict()
            
            # Convert string values to lists/dicts if needed
            if 'sports' in data:
                data['sports'] = data['sports'].split(',')
            if 'amenities' in data:
                data['amenities'] = data['amenities'].split(',')
                
            # Handle file uploads
            uploaded_files = request.files.getlist('photos')
            photo_paths = []
            
            # Create upload directory if it doesn't exist
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            
            # Save uploaded files
            for file in uploaded_files:
                if file.filename:  # Only process if file is selected
                    filename, filepath = save_uploaded_file(file, UPLOAD_FOLDER)
                    if filename:
                        photo_paths.append({
                            'url': f'/static/facility_photos/{filename}',
                            'path': filepath,
                            'is_primary': len(photo_paths) == 0  # First photo is primary
                        })
            
            data['photos'] = [p['url'] for p in photo_paths]
        else:
            data = request.get_json()
            photo_paths = [{'url': url, 'path': None, 'is_primary': i == 0} 
                          for i, url in enumerate(data.get('photos', []))]
        
        # Validate required fields
        required_fields = ['owner_id', 'name', 'location', 'city']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate city
        if data['city'] not in ALLOWED_CITIES:
            return jsonify({'error': f'Invalid city. Must be one of: {ALLOWED_CITIES}'}), 400
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Verify user exists and is a facility owner
            cursor.execute('SELECT id, role FROM users WHERE id = ?', (data['owner_id'],))
            user = cursor.fetchone()
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            if user['role'] != 'facility_owner':
                return jsonify({'error': 'User is not a facility owner'}), 403
            
            # Insert facility
            cursor.execute('''
                INSERT INTO facilities (
                    owner_id, name, description, location, city, phone, email, website,
                    operating_hours_weekdays, operating_hours_weekends, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                data['owner_id'],
                data['name'],
                data.get('description', ''),
                data['location'],
                data['city'],
                data.get('phone', ''),
                data.get('email', ''),
                data.get('website', ''),
                data.get('operating_hours_weekdays', ''),
                data.get('operating_hours_weekends', ''),
                'active'
            ))
            
            facility_id = cursor.lastrowid
            
            # Add sports
            if data.get('sports'):
                for sport in data['sports']:
                    cursor.execute('INSERT INTO facility_sports (facility_id, sport_name) VALUES (?, ?)', 
                                 (facility_id, sport.strip()))
            
            # Add amenities
            if data.get('amenities'):
                for amenity in data['amenities']:
                    cursor.execute('INSERT INTO facility_amenities (facility_id, amenity_name) VALUES (?, ?)', 
                                 (facility_id, amenity.strip()))
            
            # Add courts based on sport types and counts
            if data.get('sportCourts'):
                sport_courts = data['sportCourts'].split(',')
                for sport_court in sport_courts:
                    if ':' in sport_court:
                        sport_type, count_str = sport_court.split(':', 1)
                        try:
                            count = int(count_str)
                            if count > 0:
                                # Add to facility_courts table
                                cursor.execute('''
                                    INSERT INTO facility_courts (facility_id, sport_type, court_count)
                                    VALUES (?, ?, ?)
                                ''', (facility_id, sport_type.strip(), count))
                                
                                # Create individual court records
                                for i in range(count):
                                    court_name = f"{sport_type.strip()} Court {i + 1}"
                                    cursor.execute('''
                                        INSERT INTO courts (facility_id, name, sport_type, surface_type, court_number, hourly_rate, status)
                                        VALUES (?, ?, ?, ?, ?, ?, ?)
                                    ''', (
                                        facility_id,
                                        court_name,
                                        sport_type.strip(),
                                        'Standard',  # Default surface type
                                        i + 1,  # Court number
                                        50.00,  # Default hourly rate
                                        'active'
                                    ))
                        except ValueError:
                            continue
            
            # Add photos to file storage and facility_photos
            for i, photo in enumerate(photo_paths):
                cursor.execute('''
                    INSERT INTO file_storage 
                    (file_name, file_path, file_type, file_size, uploaded_by)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    os.path.basename(photo['url']),
                    photo['path'] or '',
                    'image/jpeg',  # Default, could be more specific
                    os.path.getsize(photo['path']) if photo['path'] else 0,
                    data['owner_id']
                ))
                
                file_storage_id = cursor.lastrowid
                
                cursor.execute('''
                    INSERT INTO facility_photos 
                    (facility_id, photo_url, file_storage_id, caption, is_primary)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    facility_id,
                    photo['url'],
                    file_storage_id if photo['path'] else None,
                    '',
                    photo['is_primary']
                ))
            
            conn.commit()
            
            return jsonify({
                'message': 'Facility created successfully',
                'facility_id': facility_id,
                'photos': [p['url'] for p in photo_paths]
            }), 201
            
        except Exception as e:
            # Clean up any uploaded files if there was an error
            if 'photo_paths' in locals():
                for photo in photo_paths:
                    if photo.get('path') and os.path.exists(photo['path']):
                        os.remove(photo['path'])
            raise e
            
        finally:
            close_db(conn)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/facilities/<int:facility_id>', methods=['PUT'])
def update_facility(facility_id):
    """Update an existing facility"""
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Check if facility exists and get current data
            cursor.execute('SELECT * FROM facilities WHERE id = ?', (facility_id,))
            facility = cursor.fetchone()
            
            if not facility:
                return jsonify({'error': 'Facility not found'}), 404
            
            # Update facility fields
            update_fields = ['name', 'description', 'location', 'phone', 'email', 'website', 
                           'operating_hours_weekdays', 'operating_hours_weekends']
            
            update_values = []
            update_sql = []
            
            for field in update_fields:
                if field in data:
                    update_values.append(data[field])
                    update_sql.append(f'{field} = ?')
            
            if update_sql:
                update_sql.append('updated_at = CURRENT_TIMESTAMP')
                update_values.append(facility_id)
                
                cursor.execute(f'''
                    UPDATE facilities 
                    SET {', '.join(update_sql)}
                    WHERE id = ?
                ''', update_values)
            
            # Update sports if provided
            if 'sports' in data:
                # Remove existing sports
                cursor.execute('DELETE FROM facility_sports WHERE facility_id = ?', (facility_id,))
                # Add new sports
                for sport in data['sports']:
                    cursor.execute('INSERT INTO facility_courts (facility_id, sport_type, court_count) VALUES (?, ?, 1)', (facility_id, sport))
            
            # Update amenities if provided
            if 'amenities' in data:
                # Remove existing amenities
                cursor.execute('DELETE FROM facility_amenities WHERE facility_id = ?', (facility_id,))
                # Add new amenities
                for amenity in data['amenities']:
                    cursor.execute('INSERT INTO facility_amenities (facility_id, amenity_name) VALUES (?, ?)', (facility_id, amenity))
            
            # Update photos if provided
            if 'photos' in data:
                # Remove existing photos
                cursor.execute('DELETE FROM facility_photos WHERE facility_id = ?', (facility_id,))
                # Add new photos
                for i, photo in enumerate(data['photos']):
                    is_primary = (i == 0)  # First photo is primary
                    cursor.execute('''
                        INSERT INTO facility_photos (facility_id, photo_url, caption, is_primary)
                        VALUES (?, ?, ?, ?)
                    ''', (facility_id, photo, '', is_primary))
            
            conn.commit()
            
            return jsonify({
                'message': 'Facility updated successfully',
                'facility_id': facility_id
            }), 200
            
        finally:
            close_db(conn)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/facilities/<int:facility_id>', methods=['DELETE'])
def delete_facility(facility_id):
    """Delete a facility (soft delete by setting status to inactive)"""
    try:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Check if facility exists
            cursor.execute('SELECT id FROM facilities WHERE id = ?', (facility_id,))
            if not cursor.fetchone():
                return jsonify({'error': 'Facility not found'}), 404
            
            # Soft delete by setting status to inactive
            cursor.execute('UPDATE facilities SET status = "inactive", updated_at = CURRENT_TIMESTAMP WHERE id = ?', (facility_id,))
            
            conn.commit()
            
            return jsonify({
                'message': 'Facility deleted successfully',
                'facility_id': facility_id
            }), 200
            
        finally:
            close_db(conn)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Court Management Endpoints

@app.route('/courts', methods=['GET'])
def get_courts():
    """Get all courts for a specific facility"""
    try:
        facility_id = request.args.get('facility_id')
        if not facility_id:
            return jsonify({'error': 'Facility ID is required'}), 400
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Get courts for the facility
            cursor.execute('''
                SELECT * FROM courts 
                WHERE facility_id = ? 
                ORDER BY court_number, name
            ''', (facility_id,))
            
            courts = []
            for row in cursor.fetchall():
                court = {
                    'id': row['id'],
                    'facility_id': row['facility_id'],
                    'name': row['name'],
                    'sport_type': row['sport_type'],
                    'surface_type': row['surface_type'],
                    'court_number': row['court_number'],
                    'hourly_rate': float(row['hourly_rate']) if row['hourly_rate'] else 0,
                    'status': row['status'],
                    'created_at': row['created_at']
                }
                courts.append(court)
            
            return jsonify({
                'courts': courts,
                'count': len(courts)
            }), 200
            
        finally:
            close_db(conn)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/courts', methods=['POST'])
def create_court():
    """Create a new court"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['facility_id', 'name', 'sport_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Verify facility exists and belongs to the user
            cursor.execute('SELECT id, owner_id FROM facilities WHERE id = ?', (data['facility_id'],))
            facility = cursor.fetchone()
            
            if not facility:
                return jsonify({'error': 'Facility not found'}), 404
            
            # Insert court
            cursor.execute('''
                INSERT INTO courts (
                    facility_id, name, sport_type, surface_type, court_number, hourly_rate, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                data['facility_id'],
                data['name'],
                data['sport_type'],
                data.get('surface_type', ''),
                data.get('court_number', 1),
                data.get('hourly_rate', 0),
                'active'
            ))
            
            court_id = cursor.lastrowid
            
            conn.commit()
            
            return jsonify({
                'message': 'Court created successfully',
                'court_id': court_id
            }), 201
            
        finally:
            close_db(conn)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/courts/<int:court_id>', methods=['PUT'])
def update_court(court_id):
    """Update an existing court"""
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Check if court exists
            cursor.execute('SELECT * FROM courts WHERE id = ?', (court_id,))
            court = cursor.fetchone()
            
            if not court:
                return jsonify({'error': 'Court not found'}), 404
            
            # Update court fields
            update_fields = ['name', 'sport_type', 'surface_type', 'court_number', 'hourly_rate', 'status']
            
            update_values = []
            update_sql = []
            
            for field in update_fields:
                if field in data:
                    update_values.append(data[field])
                    update_sql.append(f'{field} = ?')
            
            if update_sql:
                update_values.append(court_id)
                
                cursor.execute(f'''
                    UPDATE courts 
                    SET {', '.join(update_sql)}
                    WHERE id = ?
                ''', update_values)
            
            conn.commit()
            
            return jsonify({
                'message': 'Court updated successfully',
                'court_id': court_id
            }), 200
            
        finally:
            close_db(conn)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/courts/<int:court_id>', methods=['DELETE'])
def delete_court(court_id):
    """Delete a court"""
    try:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Check if court exists
            cursor.execute('SELECT id FROM courts WHERE id = ?', (court_id,))
            if not cursor.fetchone():
                return jsonify({'error': 'Court not found'}), 404
            
            # Delete the court
            cursor.execute('DELETE FROM courts WHERE id = ?', (court_id,))
            
            conn.commit()
            
            return jsonify({
                'message': 'Court deleted successfully',
                'court_id': court_id
            }), 200
            
        finally:
            close_db(conn)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Time Slot Management Endpoints

@app.route('/time-slots', methods=['GET'])
def get_time_slots():
    """Get time slots for a specific court and date"""
    try:
        court_id = request.args.get('court_id')
        date = request.args.get('date')
        day_of_week = request.args.get('day_of_week')
        
        if not court_id:
            return jsonify({'error': 'Court ID is required'}), 400
        
        # Accept either date or day_of_week parameter
        if not date and day_of_week is None:
            return jsonify({'error': 'Either date or day_of_week parameter is required'}), 400
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Determine day_of_week
            if date:
                target_day_of_week = get_day_of_week(date)
            else:
                target_day_of_week = int(day_of_week)
            
            # Get time slots for the court and day
            cursor.execute('''
                SELECT ts.*, 
                       CASE WHEN b.id IS NOT NULL THEN FALSE ELSE ts.is_available END as is_actually_available
                FROM time_slots ts
                LEFT JOIN (
                    SELECT b.id, b.start_time, b.end_time
                    FROM bookings b
                    WHERE b.court_id = ? 
                    AND b.booking_date = ? 
                    AND b.status != 'cancelled'
                ) b ON (
                    ts.start_time >= b.start_time AND ts.start_time < b.end_time
                )
                WHERE ts.court_id = ? AND ts.day_of_week = ?
                ORDER BY ts.start_time
            ''', (court_id, date, court_id, target_day_of_week))
            
            time_slots = []
            for row in cursor.fetchall():
                time_slot = {
                    'id': row['id'],
                    'court_id': row['court_id'],
                    'day_of_week': row['day_of_week'],
                    'start_time': row['start_time'],
                    'end_time': row['end_time'],
                    'is_available': bool(row['is_actually_available']),
                    'created_at': row['created_at']
                }
                time_slots.append(time_slot)
            
            return jsonify({
                'time_slots': time_slots,
                'count': len(time_slots)
            }), 200
            
        finally:
            close_db(conn)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/time-slots', methods=['POST'])
def create_time_slots():
    """Create time slots for a court"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['court_id', 'day_of_week', 'start_time', 'end_time']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Verify court exists
            cursor.execute('SELECT id FROM courts WHERE id = ?', (data['court_id'],))
            if not cursor.fetchone():
                return jsonify({'error': 'Court not found'}), 404
            
            # Insert time slot
            cursor.execute('''
                INSERT INTO time_slots (
                    court_id, day_of_week, start_time, end_time, is_available
                ) VALUES (?, ?, ?, ?, ?)
            ''', (
                data['court_id'],
                data['day_of_week'],
                data['start_time'],
                data['end_time'],
                data.get('is_available', True)
            ))
            
            time_slot_id = cursor.lastrowid
            
            conn.commit()
            
            return jsonify({
                'message': 'Time slot created successfully',
                'time_slot_id': time_slot_id
            }), 201
            
        finally:
            close_db(conn)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/time-slots/<int:time_slot_id>', methods=['PUT'])
def update_time_slot(time_slot_id):
    """Update a time slot"""
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Check if time slot exists
            cursor.execute('SELECT * FROM time_slots WHERE id = ?', (time_slot_id,))
            if not cursor.fetchone():
                return jsonify({'error': 'Time slot not found'}), 404
            
            # Update time slot fields
            update_fields = ['start_time', 'end_time', 'is_available']
            
            update_values = []
            update_sql = []
            
            for field in update_fields:
                if field in data:
                    update_values.append(data[field])
                    update_sql.append(f'{field} = ?')
            
            if update_sql:
                update_values.append(time_slot_id)
                
                cursor.execute(f'''
                    UPDATE time_slots 
                    SET {', '.join(update_sql)}
                    WHERE id = ?
                ''', update_values)
            
            conn.commit()
            
            return jsonify({
                'message': 'Time slot updated successfully',
                'time_slot_id': time_slot_id
            }), 200
            
        finally:
            close_db(conn)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/time-slots/bulk-update', methods=['POST'])
def bulk_update_time_slots():
    """Bulk update time slots for blocking/unblocking"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['court_id', 'day_of_week', 'start_time', 'end_time', 'is_available']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Verify court exists
            cursor.execute('SELECT id FROM courts WHERE id = ?', (data['court_id'],))
            if not cursor.fetchone():
                return jsonify({'error': 'Court not found'}), 404
            
            # Update time slots in the range
            cursor.execute('''
                UPDATE time_slots 
                SET is_available = ?
                WHERE court_id = ? AND day_of_week = ? 
                AND start_time >= ? AND end_time <= ?
            ''', (
                data['is_available'],
                data['court_id'],
                data['day_of_week'],
                data['start_time'],
                data['end_time']
            ))
            
            affected_rows = cursor.rowcount
            
            conn.commit()
            
            return jsonify({
                'message': f'{affected_rows} time slots updated successfully',
                'affected_rows': affected_rows
            }), 200
            
        finally:
            close_db(conn)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Booking Management Endpoints

@app.route('/bookings', methods=['GET'])
def get_bookings():
    """Get all bookings for a user"""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Get bookings with court, facility, and venue details
            cursor.execute('''
                SELECT 
                    b.id, b.booking_date, b.start_time, b.end_time, b.duration, 
                    b.total_amount, b.payment_method, b.status, b.created_at,
                    c.name as court_name, c.sport_type,
                    f.name as facility_name, f.location as facility_location,
                    u.full_name as user_name
                FROM bookings b
                JOIN courts c ON b.court_id = c.id
                JOIN facilities f ON c.facility_id = f.id
                JOIN users u ON b.user_id = u.id
                WHERE b.user_id = ?
                ORDER BY b.booking_date DESC, b.start_time ASC
            ''', (user_id,))
            
            bookings = []
            for row in cursor.fetchall():
                booking = {
                    'id': row['id'],
                    'booking_date': row['booking_date'],
                    'start_time': row['start_time'],
                    'end_time': row['end_time'],
                    'duration': row['duration'],
                    'total_amount': row['total_amount'],
                    'payment_method': row['payment_method'],
                    'status': row['status'],
                    'created_at': row['created_at'],
                    'court_name': row['court_name'],
                    'sport_type': row['sport_type'],
                    'facility_name': row['facility_name'],
                    'facility_location': row['facility_location'],
                    'user_name': row['user_name']
                }
                bookings.append(booking)
            
            return jsonify({
                'bookings': bookings,
                'count': len(bookings)
            }), 200
            
        finally:
            close_db(conn)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/bookings', methods=['POST'])
def create_booking():
    """Create a new booking"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_id', 'court_id', 'booking_date', 'start_time', 'end_time', 'duration', 'total_amount', 'payment_method', 'status']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Check if court exists and is available
            cursor.execute('SELECT id, status, facility_id FROM courts WHERE id = ?', (data['court_id'],))
            court = cursor.fetchone()
            
            if not court:
                return jsonify({'error': 'Court not found'}), 404
            
            if court['status'] != 'active':
                return jsonify({'error': 'Court is not available for booking'}), 400
            
            # Check if time slot is available
            day_of_week = get_day_of_week(data['booking_date'])
            
            # Check if the specific time slot is already booked
            cursor.execute('''
                SELECT b.id FROM bookings b
                JOIN courts c ON b.court_id = c.id
                WHERE b.court_id = ? 
                AND b.booking_date = ? 
                AND b.status != 'cancelled'
                AND (
                    (b.start_time <= ? AND b.end_time > ?) OR
                    (b.start_time < ? AND b.end_time >= ?) OR
                    (b.start_time >= ? AND b.end_time <= ?)
                )
            ''', (
                data['court_id'], 
                data['booking_date'], 
                data['start_time'], 
                data['start_time'],
                data['end_time'],
                data['end_time'],
                data['start_time'],
                data['end_time']
            ))
            
            conflicting_booking = cursor.fetchone()
            if conflicting_booking:
                return jsonify({'error': 'This time slot is already booked. Please choose a different time.'}), 400
            
            # Also check if the time slot exists and is available in the time_slots table
            cursor.execute('''
                SELECT id FROM time_slots 
                WHERE court_id = ? AND day_of_week = ? AND start_time = ? AND is_available = TRUE
            ''', (data['court_id'], day_of_week, data['start_time']))
            
            if not cursor.fetchone():
                return jsonify({'error': 'Selected time slot is not available'}), 400
            
            # Create booking
            cursor.execute('''
                INSERT INTO bookings (user_id, court_id, facility_id, booking_date, start_time, end_time, duration, total_amount, payment_method, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ''', (
                data['user_id'],
                data['court_id'],
                court['facility_id'],  # Get facility_id from court
                data['booking_date'],
                data['start_time'],
                data['end_time'],
                data['duration'],
                data['total_amount'],
                data['payment_method'],
                data['status']
            ))
            
            booking_id = cursor.lastrowid
            
            # Update time slot availability
            cursor.execute('''
                UPDATE time_slots 
                SET is_available = FALSE 
                WHERE court_id = ? AND day_of_week = ? AND start_time = ?
            ''', (data['court_id'], day_of_week, data['start_time']))
            
            conn.commit()
            
            return jsonify({
                'message': 'Booking created successfully',
                'booking_id': booking_id
            }), 201
            
        finally:
            close_db(conn)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/bookings/<int:booking_id>', methods=['PUT'])
def update_booking(booking_id):
    """Update a booking status"""
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Check if booking exists
            cursor.execute('SELECT * FROM bookings WHERE id = ?', (booking_id,))
            if not cursor.fetchone():
                return jsonify({'error': 'Booking not found'}), 404
            
            # Update booking fields
            update_fields = ['status', 'payment_status']
            
            update_values = []
            update_sql = []
            
            for field in update_fields:
                if field in data:
                    update_values.append(data[field])
                    update_sql.append(f'{field} = ?')
            
            if update_sql:
                update_values.append(booking_id)
                
                cursor.execute(f'''
                    UPDATE bookings 
                    SET {', '.join(update_sql)}
                    WHERE id = ?
                ''', update_values)
            
            conn.commit()
            
            return jsonify({
                'message': 'Booking updated successfully',
                'booking_id': booking_id
            }), 200
            
        finally:
            close_db(conn)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/bookings/stats', methods=['GET'])
def get_booking_stats():
    """Get booking statistics for a facility"""
    try:
        facility_id = request.args.get('facility_id')
        if not facility_id:
            return jsonify({'error': 'Facility ID is required'}), 400
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Get total bookings
            cursor.execute('SELECT COUNT(*) as total FROM bookings WHERE facility_id = ?', (facility_id,))
            total = cursor.fetchone()['total']
            
            # Get upcoming bookings
            cursor.execute('''
                SELECT COUNT(*) as upcoming FROM bookings 
                WHERE facility_id = ? AND booking_date >= DATE('now') AND status = 'confirmed'
            ''', (facility_id,))
            upcoming = cursor.fetchone()['upcoming']
            
            # Get completed bookings
            cursor.execute('''
                SELECT COUNT(*) as completed FROM bookings 
                WHERE facility_id = ? AND status = 'completed'
            ''', (facility_id,))
            completed = cursor.fetchone()['completed']
            
            # Get cancelled bookings
            cursor.execute('''
                SELECT COUNT(*) as cancelled FROM bookings 
                WHERE facility_id = ? AND status = 'cancelled'
            ''', (facility_id,))
            cancelled = cursor.fetchone()['cancelled']
            
            # Get total revenue
            cursor.execute('''
                SELECT COALESCE(SUM(total_amount), 0) as revenue FROM bookings 
                WHERE facility_id = ? AND payment_status = 'paid'
            ''', (facility_id,))
            revenue = cursor.fetchone()['revenue']
            
            stats = {
                'total': total,
                'upcoming': upcoming,
                'completed': completed,
                'cancelled': cancelled,
                'revenue': float(revenue) if revenue else 0
            }
            
            return jsonify(stats), 200
            
        finally:
            close_db(conn)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_day_of_week(date_str):
    """Convert date string to day of week (0=Sunday, 1=Monday, etc.) - matches JavaScript getDay()"""
    from datetime import datetime
    date_obj = datetime.strptime(date_str, '%Y-%m-%d')
    # weekday() returns 0=Monday, 1=Tuesday, ..., 6=Sunday
    # We want 0=Sunday, 1=Monday, ..., 6=Saturday
    weekday = date_obj.weekday()
    return (weekday + 1) % 7

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'QuickCourt Backend API'
    }), 200

@app.route('/health/db', methods=['GET'])
def database_health_check():
    """Test database connection"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT 1')
        result = cursor.fetchone()
        close_db(conn)
        
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/change-password', methods=['POST'])
def change_password():
    """Change user password"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_id', 'current_password', 'new_password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Get user's current password hash
            cursor.execute('SELECT password_hash FROM users WHERE id = ?', (data['user_id'],))
            user = cursor.fetchone()
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Verify current password
            if not check_password_hash(user['password_hash'], data['current_password']):
                return jsonify({'error': 'Current password is incorrect'}), 400
            
            # Hash new password and update
            new_password_hash = generate_password_hash(data['new_password'])
            cursor.execute('UPDATE users SET password_hash = ? WHERE id = ?', 
                         (new_password_hash, data['user_id']))
            
            conn.commit()
            return jsonify({'message': 'Password changed successfully'}), 200
            
        finally:
            close_db(conn)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/reviews', methods=['POST'])
def create_review():
    """Create a new review for a facility"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_id', 'facility_id', 'rating', 'review_text']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate rating
        rating = data['rating']
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({'error': 'Rating must be an integer between 1 and 5'}), 400
        
        # Validate review text
        if len(data['review_text'].strip()) < 10:
            return jsonify({'error': 'Review text must be at least 10 characters long'}), 400
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Check if user already reviewed this facility
            cursor.execute('SELECT id FROM reviews WHERE user_id = ? AND facility_id = ?', 
                         (data['user_id'], data['facility_id']))
            if cursor.fetchone():
                return jsonify({'error': 'You have already reviewed this facility'}), 400
            
            # Create review
            cursor.execute('''
                INSERT INTO reviews (user_id, facility_id, rating, review_text)
                VALUES (?, ?, ?, ?)
            ''', (data['user_id'], data['facility_id'], rating, data['review_text']))
            
            conn.commit()
            return jsonify({'message': 'Review created successfully'}), 201
            
        finally:
            close_db(conn)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/reviews/facility/<int:facility_id>', methods=['GET'])
def get_facility_reviews(facility_id):
    """Get all reviews for a specific facility"""
    try:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT r.id, r.rating, r.review_text, r.created_at,
                       u.full_name, u.avatar_url
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                WHERE r.facility_id = ?
                ORDER BY r.created_at DESC
            ''', (facility_id,))
            
            reviews = []
            for row in cursor.fetchall():
                reviews.append({
                    'id': row['id'],
                    'rating': row['rating'],
                    'review_text': row['review_text'],
                    'created_at': row['created_at'],
                    'user_name': row['full_name'],
                    'user_avatar': row['avatar_url']
                })
            
            return jsonify({'reviews': reviews}), 200
            
        finally:
            close_db(conn)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/reviews/facility/<int:facility_id>/stats', methods=['GET'])
def get_facility_review_stats(facility_id):
    """Get review statistics for a facility"""
    try:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Get average rating and total reviews
            cursor.execute('''
                SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
                FROM reviews
                WHERE facility_id = ?
            ''', (facility_id,))
            
            stats = cursor.fetchone()
            if stats and stats['total_reviews'] > 0:
                return jsonify({
                    'average_rating': round(stats['avg_rating'], 1),
                    'total_reviews': stats['total_reviews']
                }), 200
            else:
                return jsonify({
                    'average_rating': 0,
                    'total_reviews': 0
                }), 200
            
        finally:
            close_db(conn)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/reviews/can-review/<int:facility_id>', methods=['GET'])
def can_user_review_facility(facility_id):
    """Check if a user can review a facility (must have completed booking)"""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Check if user has completed any bookings for this facility
            cursor.execute('''
                SELECT COUNT(*) as completed_bookings
                FROM bookings b
                JOIN courts c ON b.court_id = c.id
                WHERE b.user_id = ? AND c.facility_id = ? AND b.status = 'completed'
            ''', (user_id, facility_id))
            
            result = cursor.fetchone()
            can_review = result['completed_bookings'] > 0
            
            return jsonify({
                'can_review': can_review,
                'completed_bookings': result['completed_bookings']
            }), 200
            
        finally:
            close_db(conn)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/facility-courts', methods=['GET'])
def get_facility_courts():
    """Get facility courts information"""
    try:
        facility_id = request.args.get('facility_id')
        if not facility_id:
            return jsonify({'error': 'facility_id is required'}), 400
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT sport_type, court_count
                FROM facility_courts
                WHERE facility_id = ?
                ORDER BY sport_type
            ''', (facility_id,))
            
            facility_courts = []
            for row in cursor.fetchall():
                facility_courts.append({
                    'sport_type': row['sport_type'],
                    'court_count': row['court_count']
                })
            
            return jsonify({'facility_courts': facility_courts}), 200
            
        finally:
            close_db(conn)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/bookings/check-conflict', methods=['POST'])
def check_booking_conflict():
    """Check if a booking conflicts with existing bookings"""
    try:
        data = request.get_json()
        required_fields = ['court_id', 'booking_date', 'start_time', 'end_time']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Check for conflicts with existing bookings
            cursor.execute('''
                SELECT id, start_time, end_time, user_id
                FROM bookings 
                WHERE court_id = ? 
                AND booking_date = ? 
                AND status != 'cancelled'
                AND (
                    (start_time <= ? AND end_time > ?) OR
                    (start_time < ? AND end_time >= ?) OR
                    (start_time >= ? AND end_time <= ?)
                )
            ''', (
                data['court_id'], 
                data['booking_date'], 
                data['start_time'], 
                data['start_time'],
                data['end_time'], 
                data['end_time'],
                data['start_time'], 
                data['end_time']
            ))
            
            conflicts = cursor.fetchall()
            
            if conflicts:
                return jsonify({
                    'has_conflict': True,
                    'conflicts': [
                        {
                            'id': conflict['id'],
                            'start_time': conflict['start_time'],
                            'end_time': conflict['end_time'],
                            'user_id': conflict['user_id']
                        } for conflict in conflicts
                    ],
                    'message': 'This time slot conflicts with existing bookings'
                }), 409
            else:
                return jsonify({
                    'has_conflict': False,
                    'message': 'Time slot is available'
                }), 200
            
        finally:
            close_db(conn)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/bookings/<int:booking_id>/cancel', methods=['POST'])
def cancel_booking(booking_id):
    """Cancel a booking"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Get booking details
            cursor.execute('''
                SELECT b.*, c.id as court_id, c.facility_id
                FROM bookings b
                JOIN courts c ON b.court_id = c.id
                WHERE b.id = ? AND b.user_id = ?
            ''', (booking_id, user_id))
            
            booking = cursor.fetchone()
            if not booking:
                return jsonify({'error': 'Booking not found or unauthorized'}), 404
            
            if booking['status'] == 'cancelled':
                return jsonify({'error': 'Booking is already cancelled'}), 400
            
            # Cancel the booking
            cursor.execute('''
                UPDATE bookings 
                SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (booking_id,))
            
            # Free up the time slot
            day_of_week = get_day_of_week(booking['booking_date'])
            cursor.execute('''
                UPDATE time_slots 
                SET is_available = TRUE 
                WHERE court_id = ? AND day_of_week = ? AND start_time = ?
            ''', (booking['court_id'], day_of_week, booking['start_time']))
            
            conn.commit()
            
            return jsonify({'message': 'Booking cancelled successfully'}), 200
            
        finally:
            close_db(conn)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/time-slots/clear', methods=['POST'])
def clear_time_slots():
    """Clear all existing time slots (for reinitializing)"""
    try:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Delete all existing time slots
            cursor.execute('DELETE FROM time_slots')
            deleted_count = cursor.rowcount
            
            conn.commit()
            
            return jsonify({
                'message': f'Cleared {deleted_count} time slots',
                'deleted_count': deleted_count
            }), 200
            
        finally:
            close_db(conn)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/time-slots/initialize', methods=['POST'])
def initialize_time_slots():
    """Initialize time slots for all courts (for testing)"""
    try:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Get all courts
            cursor.execute('SELECT id FROM courts')
            courts = cursor.fetchall()
            
            if not courts:
                return jsonify({'error': 'No courts found'}), 404
            
            # Create time slots for each court (7 AM to 11 PM, 1-hour slots)
            time_slots_created = 0
            for court in courts:
                for day in range(7):  # 0 = Sunday, 6 = Saturday
                    for hour in range(7, 23):  # 7 AM to 11 PM
                        start_time = f"{hour:02d}:00"
                        end_time = f"{hour+1:02d}:00"
                        
                        # Check if time slot already exists
                        cursor.execute('''
                            SELECT id FROM time_slots 
                            WHERE court_id = ? AND day_of_week = ? AND start_time = ?
                        ''', (court['id'], day, start_time))
                        
                        if not cursor.fetchone():
                            cursor.execute('''
                                INSERT INTO time_slots (court_id, day_of_week, start_time, end_time, is_available)
                                VALUES (?, ?, ?, ?, TRUE)
                            ''', (court['id'], day, start_time, end_time))
                            time_slots_created += 1
            
            conn.commit()
            
            return jsonify({
                'message': f'Initialized {time_slots_created} time slots',
                'courts_count': len(courts)
            }), 200
            
        finally:
            close_db(conn)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Error handling middleware
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(Exception)
def handle_exception(e):
    return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
