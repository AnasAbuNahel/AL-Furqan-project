import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { styles } from './styles';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('isLoggedIn') === 'true') {
      navigate('/dash');
    }

    const handleBeforeUnload = () => {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      localStorage.removeItem('token');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
    const response = await axios.post(
  'https://al-furqan-project-82pm.onrender.com/api/login',
  { username, password },
  {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false, // فقط ضع true لو كنت ترسل كوكيز بين الدومينات
  }
);

      if (response.data.success && response.data.token) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        localStorage.setItem('role', response.data.role);
        localStorage.setItem('token', response.data.token);

        axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;

        toast.success('✅ تم تسجيل الدخول بنجاح');

        setTimeout(() => {
          navigate('/dash');
        }, 1500);
      } else {
        toast.error('❌ اسم المستخدم أو كلمة المرور غير صحيحة');
      }
    } catch (err) {
      console.error(err);
      toast.error('❌ حدث خطأ أثناء الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.backgroundWrapper}>
        <div style={styles.blurLayer}></div>
      </div>

      <div style={styles.overlay}>
        <div style={styles.formContainer}>
          <ToastContainer position="top-center" />

          <div style={styles.logoWrapper}>
            <img src="/logo.png" alt="شعار لجنة الفرقان" style={styles.logo} />
            <h1 style={styles.arabicTitle}>طوارئ الفرقان</h1>
            <h2 style={styles.englishTitle}>AL-FURQAN EMERGENCY</h2>
          </div>

          {loading && <p style={styles.loadingMessage}>جاري التحقق من تسجيل الدخول...</p>}

          <form onSubmit={handleLogin}>
            <div style={styles.field}>
              <label style={styles.label}>اسم المستخدم:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={styles.input}
                placeholder="أدخل اسم المستخدم"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>كلمة المرور:</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
                placeholder="أدخل كلمة المرور"
              />
              <div style={styles.togglePassword}>
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  id="togglePassword"
                />
                <label htmlFor="togglePassword" style={{ marginRight: '8px' }}>
                  إظهار كلمة المرور
                </label>
              </div>
            </div>
            <button type="submit" style={styles.button}>دخول</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
