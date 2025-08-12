'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      console.log('Attempting login with:', { email, password });
      
      const response = await fetch('http://localhost:5001/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        console.error('Login failed:', data.error);
        throw new Error(data.error || 'Login failed');
      }

      console.log('Login successful, user role:', data.user.role);

      // Store user data in localStorage
      localStorage.setItem('userSignedIn', 'true');
      localStorage.setItem('userData', JSON.stringify(data.user));
      
      // Redirect based on user role
      if (data.user.role === 'admin') {
        console.log('Redirecting to admin dashboard');
        router.push('/admin');
      } else if (data.user.role === 'facility_owner') {
        console.log('Redirecting to facilitator dashboard');
        router.push('/facilitator');
      } else {
        console.log('Redirecting to home page');
        router.push('/');
      }

    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
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

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-['Pacifico'] text-black mb-2">QUICKCOURT</h1>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Login Form */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-8 text-center">LOGIN</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-black mb-2">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-all duration-200 font-semibold cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>

          {/* Bottom Links */}
          <div className="text-center space-y-3">
            <p className="text-black">
              Don't have an account?{' '}
              <Link href="/signup" className="text-black hover:text-gray-700 font-semibold cursor-pointer">
                Sign up
              </Link>
            </p>
            <Link href="/forgot-password" className="text-black hover:text-gray-700 text-sm cursor-pointer block">
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}