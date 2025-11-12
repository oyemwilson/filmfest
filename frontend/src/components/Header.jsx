import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const TopNav = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const getActiveClass = (path, color) => {
    const isActive = location.pathname === path;
    return `px-4 py-1 text-lg font-medium transition-all duration-200 ${
      isActive
        ? `text-white transform scale-105 shadow-lg ${color}`
        : `text-gray-600 hover:${color} hover:text-white`
    }`;
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white shadow-md border-b border-gray-200'
          : 'bg-white'
      } py-5`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center">
            <img src="/images/logo.png" alt="Logo" className="w-32 object-contain" />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-1">
              <Link to="/" className={getActiveClass('/', 'bg-[rgba(197,25,45,1)]')}>
                Home
              </Link>
              <Link to="/about" className={getActiveClass('/about', 'bg-[rgba(63,126,68,1)]')}>
                About
              </Link>
              <Link to="/contact" className={getActiveClass('/contact', 'bg-[rgba(253,105,37,1)]')}>
                Contact
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          isMobileMenuOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
              location.pathname === '/'
                ? 'text-white bg-[rgba(197,25,45,1)]'
                : 'text-gray-600 hover:bg-[rgba(197,25,45,1)] hover:text-white'
            }`}
          >
            Home
          </Link>
          <Link
            to="/about"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
              location.pathname === '/about'
                ? 'text-white bg-[rgba(63,126,68,1)]'
                : 'text-gray-600 hover:bg-[rgba(63,126,68,1)] hover:text-white'
            }`}
          >
            About
          </Link>
          <Link
            to="/contact"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
              location.pathname === '/contact'
                ? 'text-white bg-[rgba(253,105,37,1)]'
                : 'text-gray-600 hover:bg-[rgba(253,105,37,1)] hover:text-white'
            }`}
          >
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
