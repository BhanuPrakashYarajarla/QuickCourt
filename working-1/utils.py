import os
import random
import string
from datetime import datetime, timedelta
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from dotenv import load_dotenv
import ssl

# Load environment variables
load_dotenv()

def generate_otp():
    """Generate a random 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))

def get_otp_expiry():
    """Get OTP expiry time (5 minutes from now)"""
    return datetime.utcnow() + timedelta(minutes=5)

def send_otp_email(email, full_name, otp_code):
    """Send OTP email using SendGrid"""
    try:
        # Get SendGrid API key from environment
        sendgrid_api_key = os.getenv('SENDGRID_API_KEY')
        if not sendgrid_api_key:
            raise ValueError("SENDGRID_API_KEY not found in environment variables")
        
        # Create email message
        subject = "Your QuickCourt Signup OTP"
        body = f"""
        Hello {full_name},
        
        Your OTP is: {otp_code}
        
        This OTP will expire in 5 minutes.
        
        If you didn't request this OTP, please ignore this email.
        
        Best regards,
        QuickCourt Team
        """
        
        # Create Mail object - use environment variable for sender email
        message = Mail(
            from_email=os.getenv('SENDER_EMAIL', 'noreply@quickcourt.com'),  # Use env var or fallback
            to_emails=email,
            subject=subject,
            plain_text_content=body.strip()
        )
        
        # Send email with SSL handling
        try:
            # First try with default SSL settings
            sg = SendGridAPIClient(api_key=sendgrid_api_key)
            response = sg.send(message)
            
            print(f"SendGrid Response Status: {response.status_code}")
            print(f"SendGrid Response Headers: {response.headers}")
            print(f"SendGrid Response Body: {response.body}")
            
            if response.status_code in [200, 201, 202]:
                return True, "Email sent successfully"
            else:
                return False, f"Failed to send email. Status: {response.status_code}, Body: {response.body}"
                
        except Exception as ssl_error:
            print(f"SSL Error: {ssl_error}")
            print(f"Error Type: {type(ssl_error)}")
            print(f"Error Details: {str(ssl_error)}")
            
            # Try alternative approach by temporarily disabling SSL verification
            try:
                # Create unverified SSL context
                ssl._create_default_https_context = ssl._create_unverified_context
                
                sg = SendGridAPIClient(api_key=sendgrid_api_key)
                response = sg.send(message)
                
                print(f"Alternative SendGrid Response Status: {response.status_code}")
                print(f"Alternative SendGrid Response Body: {response.body}")
                
                if response.status_code in [200, 201, 202]:
                    return True, "Email sent successfully (SSL verification disabled)"
                else:
                    return False, f"Failed to send email. Status: {response.status_code}, Body: {response.body}"
                    
            except Exception as alt_error:
                print(f"Alternative method failed: {str(alt_error)}")
                return False, f"Alternative email sending failed: {str(alt_error)}"
                
    except Exception as e:
        return False, f"Error sending email: {str(e)}"

def is_otp_expired(expires_at):
    """Check if OTP has expired"""
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    return datetime.utcnow() > expires_at
