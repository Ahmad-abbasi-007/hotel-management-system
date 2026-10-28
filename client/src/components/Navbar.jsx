import { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinksByRole = {
    guest: [
      { to: '/', label: 'Dashboard' },
      { to: '/rooms', label: 'Browse Rooms' },
      { to: '/my-bookings', label: 'My Bookings' }
    ],
    receptionist: [
      { to: '/', label: 'Dashboard' },
      { to: '/receptionist', label: 'Receptionist Panel' },
      { to: '/rooms', label: 'Rooms' }
    ],
    admin: [
      { to: '/', label: 'Dashboard' },
      { to: '/dashboard', label: 'Analytics' },
      { to: '/admin', label: 'Manage Rooms' },
      { to: '/services', label: 'Services' },
      { to: '/receptionist', label: 'Reception' }
    ]
  };

  const links = (user && navLinksByRole[user.role]) ? navLinksByRole[user.role] : [
    { to: '/', label: 'Dashboard' },
    { to: '/rooms', label: 'Rooms' }
  ];

  const roleBadgeStyle = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'receptionist':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'guest':
      default:
        return 'bg-green-100 text-green-700 border-green-300';
    }
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-50 bg-blue-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-90 transition">
              <span>🏨</span>
              <span>Zenvio Hotel</span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-2">
              {links.map((link) => {
                const active = isActive(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                      active
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-blue-100 hover:bg-blue-600 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Desktop Right Side: User badge + Logout */}
          <div className="hidden md:flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 bg-blue-800/60 px-3 py-1 rounded-full text-sm">
                <span className="font-medium text-white">{user.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize border ${roleBadgeStyle(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-3.5 py-1.5 rounded-md text-sm font-semibold transition shadow-sm"
            >
              Logout
            </button>
          </div>

          {/* Mobile hamburger menu button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-600 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-blue-800 px-4 pt-2 pb-4 space-y-2 border-t border-blue-600">
          {user && (
            <div className="flex items-center justify-between py-2 border-b border-blue-700 mb-2">
              <span className="font-semibold text-white text-sm">{user.name}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize border ${roleBadgeStyle(
                  user.role
                )}`}
              >
                {user.role}
              </span>
            </div>
          )}

          <div className="space-y-1">
            {links.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition ${
                    active
                      ? 'bg-white text-blue-700 font-semibold'
                      : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-semibold transition shadow-sm text-center"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
