
'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userType, setUserType] = useState('user');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'user' | 'facility_owner'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Map userType to role
    const role = userType === 'facility-owner' ? 'facility_owner' : 'user';
    
    try {
      setIsLoading(true);
      
      const response = await fetch('http://localhost:5001/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          role: role
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      setSuccess('OTP sent successfully! Please check your email for verification.');
      
      // Store email for OTP verification
      localStorage.setItem('signup_email', formData.email);
      
      // Redirect to OTP verification after a short delay
      setTimeout(() => {
        router.push('/verify-email');
      }, 2000);

    } catch (error: any) {
      setError(error.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Right side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
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

          {/* Signup Form */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-8 text-center">SIGN UP</h2>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Sign up as dropdown */}
              <div className="relative">
                <label className="block text-sm font-medium text-black mb-2">Sign up as:</label>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black bg-white text-left cursor-pointer flex items-center justify-between"
                >
                  <span className="capitalize">{userType === 'user' ? 'User' : 'Facility Owner'}</span>
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className={`ri-arrow-${isDropdownOpen ? 'up' : 'down'}-s-line text-lg`}></i>
                  </div>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                    <button
                      type="button"
                      onClick={() => {
                        setUserType('user');
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 cursor-pointer"
                    >
                      User
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserType('facility-owner');
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 cursor-pointer border-t border-gray-200"
                    >
                      Facility Owner
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
                  placeholder="Enter your email"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-black mb-2">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-11 text-gray-500 hover:text-black cursor-pointer"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className={`ri-eye${showPassword ? '' : '-off'}-line text-lg`}></i>
                  </div>
                </button>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-black mb-2">Confirm Password</label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-11 text-gray-500 hover:text-black cursor-pointer"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className={`ri-eye${showConfirmPassword ? '' : '-off'}-line text-lg`}></i>
                  </div>
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-all duration-200 font-semibold cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>
          </div>

          {/* Bottom Links */}
          <div className="text-center">
            <p className="text-black">
              Already have an account?{' '}
              <Link href="/login" className="text-black hover:text-gray-700 font-semibold cursor-pointer">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
