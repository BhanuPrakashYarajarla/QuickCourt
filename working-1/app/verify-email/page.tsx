
'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Get email from localStorage (set during signup)
    const signupEmail = localStorage.getItem('signup_email');
    if (signupEmail) {
      setEmail(signupEmail);
    } else {
      // If no email found, redirect back to signup
      router.push('/signup');
    }
  }, [router]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`code-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = code.join('');
    
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch('http://localhost:5001/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          otp_code: otpCode
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'OTP verification failed');
      }

      setSuccess('Account created successfully! You can now log in.');
      
      // Clear the stored email
      localStorage.removeItem('signup_email');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (error: any) {
      setError(error.message || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Call signup again to generate new OTP
      const response = await fetch('http://localhost:5001/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: 'Resend OTP', // We don't have the full name here, but backend will handle it
          email: email,
          password: 'temp_password', // Temporary password for resend
          role: 'user'
        }),
      });

      if (response.ok) {
        setSuccess('New OTP sent to your email!');
        setCode(['', '', '', '', '', '']); // Clear the code inputs
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to resend OTP');
      }

    } catch (error: any) {
      setError(error.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to check if email was actually sent (for testing)
  const checkEmailStatus = async () => {
    try {
      const response = await fetch('http://localhost:5001/health');
      if (response.ok) {
        console.log('Backend is running. Check your email for OTP.');
        // You can also check the database directly to see if OTP was stored
      }
    } catch (error) {
      console.error('Backend connection failed:', error);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img 
          src="https://readdy.ai/api/search-image?query=Professional%20modern%20sports%20complex%20with%20multiple%20badminton%20courts%2C%20realistic%20photography%2C%20bright%20natural%20lighting%20streaming%20through%20large%20windows%2C%20polished%20wooden%20floors%2C%20white%20ceiling%20with%20exposed%20beams%2C%20players%20in%20action%2C%20vibrant%20green%20and%20blue%20court%20markings%2C%20athletic%20equipment%20visible%2C%20contemporary%20sports%20facility%20architecture%20with%20clean%20lines&width=800&height=1000&seq=login-realistic&orientation=portrait"
          alt="Sports Facility"
          className="w-full h-full object-cover object-top"
        />
      </div>

      {/* Right side - Verification Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-3xl font-['Pacifico'] text-black mb-2">QUICKCOURT</h1>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {success}
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Lock Icon */}
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 flex items-center justify-center">
                <i className="ri-lock-line text-2xl text-orange-600"></i>
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-black mb-4">VERIFY YOUR EMAIL</h2>

          {/* Description */}
          <p className="text-green-600 mb-8 text-sm">
            We have sent a code to your email: {email}
          </p>

          {/* Verification Code Input */}
          <div className="flex justify-center gap-3 mb-8">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 border-2 border-gray-300 rounded-lg text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
                disabled={isLoading}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            type="button"
            onClick={handleVerify}
            disabled={isLoading}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-all duration-200 font-semibold cursor-pointer whitespace-nowrap mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Verify & Continue'}
          </button>

          {/* Bottom Links */}
          <div className="space-y-3">
            <p className="text-black text-sm">
              Did not receive the code?{' '}
              <button 
                onClick={handleResendOTP}
                disabled={isLoading}
                className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer disabled:opacity-50"
              >
                Resend OTP
              </button>
            </p>
            <p className="text-black text-sm">
              Wrong email?{' '}
              <Link href="/signup" className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer">
                Edit Email
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
