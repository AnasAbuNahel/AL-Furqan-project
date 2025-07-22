import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const Settings = () => {
  const [admins, setAdmins] = useState([]);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const authToken = localStorage.getItem('token');  
  const userRole = localStorage.getItem('role');

  const addNotification = (msg, success = true) => {
    const style = {
      borderRadius: '10px',
      fontWeight: 'bold',
      padding: '16px',
      fontFamily: 'Tahoma',
      direction: 'rtl',
    };

    if (success) {
      toast.success(msg, {
        icon: '✅',
        style: {
          ...style,
          background: '#e6fffa',
          color: '#00796b',
        },
      });
    } else {
      toast.error(msg, {
        icon: '❌',
        style: {
          ...style,
          background: '#ffe6e6',
          color: '#c62828',
        },
      });
    }
  };

  const fetchWithAuth = (url, options = {}) => {
    if (!authToken) {
      addNotification('يرجى تسجيل الدخول أولاً', false);
      return Promise.reject(new Error('No auth token'));
    }

    const headers = {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    return fetch(url, { ...options, headers });
  };

    const loadAdmins = () => {
    fetchWithAuth('https://al-furqan-project-xx60.onrender.com/api/supervisors')
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'فشل تحميل المشرفين');
        return json;
      })
      .then(setAdmins)
      .catch((err) => addNotification(err.message, false));
  };

  const handleAddAdmin = () => {
    if (!newAdminUsername || !newAdminPassword) {
      return addNotification('يرجى ملء جميع الحقول لإضافة مشرف', false);
    }

    fetchWithAuth('https://al-furqan-project-xx60.onrender.com/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: newAdminUsername,
        password: newAdminPassword,
      }),
    })
      .then(async (res) => {
        if (res.status === 401) throw new Error('غير مصرح بالدخول');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'حدث خطأ');
        return json;
      })
      .then((newUser) => {
        addNotification(`تم إضافة مشرف جديد: ${newUser.username}`);
        setNewAdminUsername('');
        setNewAdminPassword('');
        loadAdmins();

      })
      .catch((err) => addNotification(err.message, false));
  };

  const handleRemoveAdmin = () => {
    const id = Number(selectedAdminId);
    if (!id) return addNotification('يرجى اختيار مشرف للحذف', false);

    const userToDelete = admins.find((a) => a.id === id);
    if (!userToDelete) return addNotification('المشرف غير موجود', false);

    fetchWithAuth(`https://al-furqan-project-xx60.onrender.com/api/users/${id}`, {
      method: 'DELETE',
    })
      .then(async (res) => {
        if (res.status === 401) throw new Error('غير مصرح بالحذف');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'فشل الحذف');
        return json;
      })
      .then(() => {
        addNotification(`تم حذف المشرف: ${userToDelete.username}`);
        setSelectedAdminId('');
        loadAdmins();
      })
      .catch((err) => addNotification(err.message, false));
  };

useEffect(() => {
  loadAdmins();
}, []);


  if (userRole !== 'admin') {
    return (
      <div style={styles.container}>
        <h2 style={styles.header}>الإعدادات</h2>
        <p>ليس لديك صلاحيات كافية للوصول لهذه الصفحة.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>الإعدادات</h2>

      {/* إضافة مشرف */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>إضافة مشرف جديد</h3>
        <input
          type="text"
          placeholder="اسم المستخدم"
          value={newAdminUsername}
          onChange={(e) => setNewAdminUsername(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="كلمة المرور"
          value={newAdminPassword}
          onChange={(e) => setNewAdminPassword(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleAddAdmin} style={styles.button}>
          إضافة
        </button>
      </div>

      {/* حذف مشرف */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>حذف مشرف</h3>
        <select
          value={selectedAdminId}
          onChange={(e) => setSelectedAdminId(e.target.value)}
          style={styles.select}
        >
          <option value="">اختر مشرف</option>
          {admins.map((admin) => (
            <option key={admin.id} value={admin.id}>
              {admin.username}
            </option>
          ))}
        </select>
        <button
          onClick={handleRemoveAdmin}
          style={{ ...styles.button, backgroundColor: '#dc3545' }}
        >
          حذف
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '60px 20px 40px',
    fontFamily: 'Tahoma, sans-serif',
    direction: 'rtl',
    maxWidth: '600px',
    margin: '0 auto',
  },
  header: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '30px',
    color: '#003366',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '25px',
    marginBottom: '25px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#004085',
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '15px',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '15px',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
  },
  button: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '12px 25px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    width: '100%',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease',
  },
};

export default Settings;
