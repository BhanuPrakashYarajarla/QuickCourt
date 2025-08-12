#!/usr/bin/env python3
"""
Script to create sample users for QuickCourt
Run this after starting the Flask app to populate the database with test data
"""

import requests
import json

# API base URL
BASE_URL = "http://localhost:5001"

def create_sample_users():
    """Create sample users for testing"""
    
    # Sample user data
    sample_users = [
        {
            "full_name": "John Doe",
            "email": "john.doe@example.com",
            "password": "password123",
            "avatar_url": "https://example.com/avatars/john.jpg",
            "role": "user"
        },
        {
            "full_name": "Jane Smith",
            "email": "jane.smith@example.com",
            "password": "password123",
            "avatar_url": "https://example.com/avatars/jane.jpg",
            "role": "facility_owner"
        }
    ]
    
    print("Creating sample users...")
    
    for user_data in sample_users:
        try:
            response = requests.post(
                f"{BASE_URL}/signup",
                json=user_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 201:
                user = response.json()['user']
                print(f"✅ Created {user['role']}: {user['full_name']} ({user['email']})")
            else:
                print(f"❌ Failed to create user {user_data['email']}: {response.json().get('error', 'Unknown error')}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Cannot connect to Flask app. Make sure it's running on http://localhost:5000")
            break
        except Exception as e:
            print(f"❌ Error creating user {user_data['email']}: {str(e)}")
    
    print("\nSample data creation completed!")

def test_endpoints():
    """Test the API endpoints"""
    print("\nTesting API endpoints...")
    
    try:
        # Test health check
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check: OK")
        else:
            print("❌ Health check: Failed")
        
        # Test getting users
        response = requests.get(f"{BASE_URL}/users")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Users endpoint: {data['count']} users found")
        else:
            print("❌ Users endpoint: Failed")
        
        # Test getting facility owners
        response = requests.get(f"{BASE_URL}/facility-owners")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Facility owners endpoint: {data['count']} owners found")
        else:
            print("❌ Facility owners endpoint: Failed")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Flask app. Make sure it's running on http://localhost:5000")
    except Exception as e:
        print(f"❌ Error testing endpoints: {str(e)}")

if __name__ == "__main__":
    print("QuickCourt Sample Data Creator")
    print("=" * 40)
    
    # First create sample users
    create_sample_users()
    
    # Then test the endpoints
    test_endpoints()
    
    print("\nTo test the API manually:")
    print("1. Start the Flask app: python app.py")
    print("2. Use the endpoints:")
    print("   - POST /signup - Create new user")
    print("   - POST /login - Login user")
    print("   - GET /users - Get all users")
    print("   - GET /facility-owners - Get all facility owners")
    print("   - GET /health - Health check")
