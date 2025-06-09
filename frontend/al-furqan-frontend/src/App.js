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
import { getAllOfflineResidents, clearOfflineResidents } from './utils/idb';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// ✅ إعداد الهيدر للـ Authorization عند بدء التطبيق
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
  // ✅ مزامنة المستفيدين المحفوظين محليًا عند الاتصال بالإنترنت
  useEffect(() => {
    const syncOfflineData = async () => {
      if (navigator.onLine) {
        const residents = await getAllOfflineResidents();
        if (residents.length > 0) {
          const token = localStorage.getItem('token');
          for (const resident of residents) {
            try {
              await axios.post(
                'https://al-furqan-project-uqs4.onrender.com/api/residents',
                resident,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
            } catch (err) {
              console.error('❌ فشل في مزامنة مستفيد:', err);
              toast.error('❌ فشل في مزامنة بعض المستفيدين.');
              return;
            }
          }
          await clearOfflineResidents();
          toast.success('✅ تمت مزامنة جميع البيانات المحفوظة محليًا.');
        }
      }
    };

    window.addEventListener('online', syncOfflineData);
    syncOfflineData(); // للمزامنة عند أول تحميل إذا كان هناك اتصال

    return () => {
      window.removeEventListener('online', syncOfflineData);
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
          <Route path="/settings" element={<PrivateRoute><Settings /><Toaster position="top-center" reverseOrder={false} /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
