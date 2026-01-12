import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AuthPage from './AuthPage';
import OAuthSuccess from './OauthSucess';
import { LogOut, Mail, ChevronDown } from 'lucide-react';

// SSO Callback Handler
function SSOCallback() {
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      localStorage.setItem('token', token);
      setStatus('success');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } else {
      setStatus('error');
    }
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{ textAlign: 'center', padding: '20px' }}>
        {status === 'processing' && <p>Processing SSO login...</p>}
        {status === 'success' && <p style={{ color: '#10b981' }}>✓ Login successful! Redirecting...</p>}
        {status === 'error' && <p style={{ color: '#ef4444' }}>✗ Login failed</p>}
      </div>
    </div>
  );
}

// Enhanced Dashboard Component with User Profile
function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;

    // Decode JWT token to get user data (email and username are in the token)
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const decoded = JSON.parse(jsonPayload);
      
      // Set user data from JWT token
      setUser({
        id: decoded.id,
        email: decoded.email,
        username: decoded.username
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error decoding token:', error);
      localStorage.removeItem('token');
      window.location.href = '/';
    }
  }, [token]);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          
          {/* User Profile Button */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.username ? user.username.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-sm font-medium text-gray-800">
                  {user?.username || user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-xs text-gray-500">{user?.email || 'No email'}</div>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {user?.username ? user.username.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">
                        {user?.username || user?.email?.split('@')[0] || 'User'}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user?.email || 'No email'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    handleLogout();
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">
            Welcome back, {user?.username || user?.email?.split('@')[0] || 'User'}!
          </h2>
          <p className="text-gray-600">
            Logged in as <span className="font-medium text-gray-800">{user?.email}</span>
          </p>
          
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-gray-700">
              🟢 Authentication Status: <span className="font-semibold text-green-600">Active</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

// Main App Component
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/callback" element={<SSOCallback />} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;