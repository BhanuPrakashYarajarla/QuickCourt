import enum
from datetime import datetime

class UserRole(enum.Enum):
    USER = "user"
    FACILITY_OWNER = "facility_owner"
    ADMIN = "admin"

class User:
    def __init__(self, id=None, full_name=None, email=None, password_hash=None, 
                 avatar_url=None, role=UserRole.USER, created_at=None):
        self.id = id
        self.full_name = full_name
        self.email = email
        self.password_hash = password_hash
        self.avatar_url = avatar_url
        self.role = role
        self.created_at = created_at
    
    def to_dict(self):
        """Convert user to dictionary for JSON response"""
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'avatar_url': self.avatar_url,
            'role': self.role.value if isinstance(self.role, UserRole) else self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role.value if isinstance(self.role, UserRole) else self.role}')>"

class OTP:
    def __init__(self, id=None, user_id=None, otp_code=None, expires_at=None, is_used=False):
        self.id = id
        self.user_id = user_id
        self.otp_code = otp_code
        self.expires_at = expires_at
        self.is_used = is_used
    
    def to_dict(self):
        """Convert OTP to dictionary for JSON response (excluding sensitive data)"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_used': self.is_used
        }
    
    def __repr__(self):
        return f"<OTP(id={self.id}, user_id={self.user_id}, is_used={self.is_used})>"
