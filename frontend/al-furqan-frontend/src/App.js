import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import AddResident from './pages/AddResident';
import ResidentsList from './pages/ResidentsList';
import AidForm from './pages/AidForm';
import AidHistory from './pages/AidHistory';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import Dashboard from './pages/Dashboard';
import Notifications from './components/Notifications';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { syncOfflineResidents } from './syncOffline'; // ✅ مزامنة البيانات المؤجلة

// ✅ تحميل التوكن إن وُجد
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// ✅ حماية المسارات
const PrivateRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  return isLoggedIn ? children : <Navigate to="/" />;
};

function App() {
  // ✅ عند توفر الإنترنت، أرسل البيانات المؤجلة
  useEffect(() => {
    if (navigator.onLine) {
      syncOfflineResidents();
    }

    window.addEventListener('online', syncOfflineResidents);
    return () => {
      window.removeEventListener('online', syncOfflineResidents);
    };
  }, []);

  return (
    <Router>
      <Navbar />
      <div style={{ marginTop: '80px' }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/add" element={<PrivateRoute><AddResident /></PrivateRoute>} />
          <Route path="/residents" element={<PrivateRoute><ResidentsList /></PrivateRoute>} />
          <Route path="/aid" element={<PrivateRoute><AidForm /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><AidHistory /></PrivateRoute>} />
          <Route path="/stats" element={<PrivateRoute><Statistics /></PrivateRoute>} />
          <Route path="/dash" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        </Routes>
        <Toaster position="top-center" reverseOrder={false} />
      </div>
    </Router>
  );
}

export default App;
