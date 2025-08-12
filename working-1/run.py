#!/usr/bin/env python3
"""
QuickCourt Flask Backend - Startup Script
Run this to start the Flask application
"""

from app import app

if __name__ == '__main__':
    print("🚀 Starting QuickCourt Flask Backend...")
    print("📍 API will be available at: http://localhost:5001")
    print("🔍 Health check: http://localhost:5001/health")
    print("📚 API Documentation: Check README.md")
    print("⏹️  Press Ctrl+C to stop the server")
    print("-" * 50)
    
    app.run(debug=True, host='0.0.0.0', port=5001)
