'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if user is signed in and get user role
    const userSignedIn = localStorage.getItem('userSignedIn') === 'true';
    const userData = localStorage.getItem('userData');
    
    if (userSignedIn && userData) {
      try {
        const user = JSON.parse(userData);
        setUserRole(user.role || '');
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    setIsSignedIn(userSignedIn);
  }, []);

  const handleProfileClick = () => {
    if (isSignedIn) {
      if (userRole === 'facility_owner') {
        router.push('/facilitator');
      } else {
        router.push('/profile');
      }
    } else {
      router.push('/login');
    }
  };

  const handleAuthClick = () => {
    if (isSignedIn) {
      // Sign out
      localStorage.removeItem('userSignedIn');
      localStorage.removeItem('userData');
      setIsSignedIn(false);
      setUserRole('');
      router.push('/');
    } else {
      router.push('/login');
    }
  };

  const getProfileButtonText = () => {
    if (userRole === 'facility_owner') {
      return 'Dashboard';
    }
    return 'Profile';
  };

  return (
    <header className="bg-black border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="text-2xl font-['Pacifico'] text-white">QuickCourt</div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-white hover:text-gray-300 transition-colors duration-200 font-medium">
              Home
            </Link>
            <Link href="/venues" className="text-white hover:text-gray-300 transition-colors duration-200 font-medium">
              Venues
            </Link>
            <button
              onClick={handleProfileClick}
              className="text-white hover:text-gray-300 transition-colors duration-200 font-medium cursor-pointer"
            >
              {getProfileButtonText()}
            </button>
            <button
              onClick={handleAuthClick}
              className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 font-semibold whitespace-nowrap cursor-pointer"
            >
              {isSignedIn ? 'Sign Out' : 'Login / Sign Up'}
            </button>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white cursor-pointer"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <i className={`ri-${isMenuOpen ? 'close' : 'menu'}-line text-xl`}></i>
            </div>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="flex flex-col space-y-4">
              <Link href="/" className="text-white hover:text-gray-300 transition-colors duration-200 font-medium">
                Home
              </Link>
              <Link href="/venues" className="text-white hover:text-gray-300 transition-colors duration-200 font-medium">
                Venues
              </Link>
              <button
                onClick={handleProfileClick}
                className="text-white hover:text-gray-300 transition-colors duration-200 font-medium text-left cursor-pointer"
              >
                {getProfileButtonText()}
              </button>
              <button
                onClick={handleAuthClick}
                className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 font-semibold whitespace-nowrap cursor-pointer w-fit"
              >
                {isSignedIn ? 'Sign Out' : 'Login / Sign Up'}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}