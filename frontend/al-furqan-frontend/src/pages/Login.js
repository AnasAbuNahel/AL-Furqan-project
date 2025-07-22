import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
      const response = await axios.post('https://al-furqan-project-xx60.onrender.com/api/login', {
        username,
        password,
      });

      if (response.data.success && response.data.token) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        localStorage.setItem('role', response.data.role);
        localStorage.setItem('token', response.data.token);

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
      {/* خلفية الشعار */}
      <div style={styles.backgroundWrapper}>
        <div style={styles.blurLayer}></div>
      </div>

      {/* الفورم */}
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

const styles = {
  pageContainer: {
    height: '86vh',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Cairo', sans-serif",
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
backgroundWrapper: {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundImage: 'url("/logo1.png")',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center center',
  backgroundSize: '85% 165%', 
  zIndex: 0,
},
blurLayer: {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '160%',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
},

  overlay: {
    backdropFilter: 'blur(10px)',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    padding: '30px',
    borderRadius: '20px',
    maxWidth: '450px',
    width: '90%',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    position: 'relative',
    zIndex: 2,
  },
  formContainer: {
    direction: 'rtl',
    zIndex: 3,
    position: 'relative',
  },
  logoWrapper: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  logo: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
  },
  logoText: {
    marginTop: '20px',
    fontSize: '30px',
    fontWeight: 'bold',
    color: '#003c72',
  },
  field: {
    marginBottom: '14px',
  },
  arabicTitle: {
    fontSize: '30px',
    fontWeight: 'bold',
    color: '#455f28',
    marginBottom: '0px',
  },
  englishTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#247d80',
    marginTop: '5px',
    marginBottom: '25px',
  },
  label: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#222',
    marginBottom: '6px',
    display: 'block',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ccc',
    borderRadius: '10px',
    fontSize: '15px',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
  },
  togglePassword: {
    marginTop: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '5px',
  },
  button: {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(to left, #1e90ff, #004e92)',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '17px',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, background 0.3s ease',
  },
  loadingMessage: {
    marginTop: '15px',
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#004e92',
  },
};

export default Login;
