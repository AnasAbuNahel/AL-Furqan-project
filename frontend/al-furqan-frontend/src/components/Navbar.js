import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaUsers, FaPlus, FaHandsHelping, FaHistory, FaChartPie,
  FaSignOutAlt, FaBars, FaBell, FaCog, FaHome
} from 'react-icons/fa';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedCount = parseInt(localStorage.getItem('notificationCount')) || 0;
    setNotificationCount(storedCount);
    const storedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    setNotifications(storedNotifications);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch("https://al-furqan-project-xx60.onrender.com/api/notifications", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();

        setNotifications(data);

        const newCount = data.filter(n => n.isNew).length;

        if (location.pathname === '/notifications') {
          setNotificationCount(0);
          localStorage.setItem('notificationCount', '0');
        } else {
          setNotificationCount(newCount);
          localStorage.setItem('notificationCount', newCount.toString());
        }

        localStorage.setItem('notifications', JSON.stringify(data));
      } catch (err) {
        console.error("فشل تحميل الإشعارات:", err);
      }
    };

    fetchNotifications();
  }, [location.pathname]);

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const isSameDate = (d1, d2) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    if (isSameDate(date, today)) {
      return "اليوم - " + date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
    } else if (isSameDate(date, yesterday)) {
      return "أمس - " + date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
    } else {
      return date.toLocaleDateString("ar-EG", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }) + " - " + date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleHover = (e, isEnter) => {
    e.currentTarget.style.backgroundColor = isEnter
      ? 'rgba(14, 0, 94, 0.15)'
      : 'rgba(19, 0, 104, 0.05)';
  };

  const handleNotificationClick = async () => {
    setDropdownOpen(!dropdownOpen);
    if (!dropdownOpen) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch("https://al-furqan-project-xx60.onrender.com/api/notifications", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setNotifications(data);
      } catch (err) {
        console.error("فشل تحميل الإشعارات:", err);
      }
    }
  };

  return (
    <>
      <nav style={styles.nav}>
        <div style={styles.logoContainer}>
          <div
            style={styles.logoWrapper}
            onClick={() => setIsImageOpen(true)}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <img src="/logo.png" alt="شعار لجنة طوارئ الفرقان" style={styles.logo} />
          </div>
          <h2 style={styles.title}>لجنة طوارئ الفرقان</h2>
        </div>

        {isLoggedIn && (
          <>
            <div style={styles.actionsContainer}>
              {/* إشعارات */}
              <div style={styles.notificationWrapper}>
                <FaBell style={styles.notificationIcon} onClick={handleNotificationClick} />
                {notificationCount > 0 && (
                  <span style={styles.notificationBadge}>{notificationCount}</span>
                )}
                {dropdownOpen && (
                  <div style={styles.notificationDropdownFixed}>
                    <h4 style={styles.dropdownHeader}>آخر الإشعارات</h4>
                    <ul style={styles.dropdownList}>
                      {notifications.length > 0 ? (
                        notifications.slice(0, 6).map((notif) => (
                          <li key={notif.id} style={{
                            ...styles.dropdownItem,
                            backgroundColor: notif.isNew ? "#eef2ff" : "white",
                            borderRight: notif.isNew ? "4px solid #6366f1" : "none",
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '18px', color: '#444' }}>
                                {notif.action === "إضافة" ? "➕" : notif.action === "تعديل" ? "✏️" : notif.action === "حذف" ? "🗑️" : "ℹ️"}
                              </span>
                              <span style={{ fontWeight: 'bold', color: '#1e40af' }}>{notif.username}</span>
                              <span style={{ color: '#333' }}>قام بـ</span>
                              <span style={{ color: '#0ea5e9', fontWeight: 'bold' }}>{notif.action}</span>
                              {notif.target_name && <span style={{ color: '#444' }}>{notif.target_name}</span>}
                            </div>
                            <small style={styles.dropdownTime}>{formatDateTime(notif.timestamp)}</small>
                          </li>
                        ))
                      ) : (
                        <li style={{ padding: '10px', color: '#666', textAlign: 'center' }}>
                          لا توجد إشعارات حالياً
                        </li>
                      )}
                    </ul>
                    <div style={styles.viewAll}>
                      <Link to="/notifications" onClick={() => setDropdownOpen(false)}>مشاهدة الكل</Link>
                    </div>
                  </div>
                )}
              </div>

              {/* قائمة جانبية */}
              <button onClick={() => setMenuOpen(!menuOpen)} style={styles.burger}>
                <FaBars />
              </button>
            </div>

            <div style={{ ...styles.dropdownContainer, left: menuOpen ? '0' : '-260px' }}>
              <ul style={styles.mobileNavList}>
                {[ 
                  { to: '/dash', icon: <FaHome />, label: 'الرئيسية' },
                  { to: '/residents', icon: <FaUsers />, label: 'قائمة المستفيدين' },
                  { to: '/add', icon: <FaPlus />, label: 'إضافة مستفيد' },
                  { to: '/aid', icon: <FaHandsHelping />, label: 'تسجيل المساعدة' },
                  { to: '/history', icon: <FaHistory />, label: 'سجل المساعدات' },
                  { to: '/Child', icon: <FaUsers />, label: 'سجل الأطفال' },
                  { to: '/stats', icon: <FaChartPie />, label: 'الاحصائيات' },
                  { to: '/settings', icon: <FaCog />, label: 'الإعدادات' },
                ].map((item, i) => (
                  <li key={i}>
                    <Link
                      to={item.to}
                      style={styles.link}
                      onClick={() => setMenuOpen(false)}
                      onMouseEnter={e => handleHover(e, true)}
                      onMouseLeave={e => handleHover(e, false)}
                    >
                      {item.icon} {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <button
                    onClick={() => { setMenuOpen(false); handleLogout(); }}
                    style={{ ...styles.link, background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => handleHover(e, true)}
                    onMouseLeave={e => handleHover(e, false)}
                  >
                    <FaSignOutAlt style={styles.icon} /> تسجيل الخروج
                  </button>
                </li>
              </ul>
            </div>
          </>
        )}
      </nav>

      {isImageOpen && (
        <div style={styles.overlay} onClick={() => setIsImageOpen(false)}>
          <img src="/logo.png" alt="شعار مكبر" style={styles.fullImage} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
};

const styles = {

  nav: {
    background: 'linear-gradient(to left, #004e92, #000428)',
    color: 'white',
    padding: '10px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    direction: 'rtl',
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    zIndex: 1000,
    boxShadow: '0 3px 8px rgba(0, 0, 0, 0.2)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoWrapper: {
    height: '45px',
    width: '45px',
    borderRadius: '50%',
    backgroundColor: 'white',
    padding: '5px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
    transition: 'transform 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  logo: { height: '100%', width: '100%', objectFit: 'contain', borderRadius: '50%' },
  title: { margin: 0, fontSize: '18px', fontWeight: 'bold', whiteSpace: 'nowrap' },
  actionsContainer: { display: 'flex', alignItems: 'center', gap: '15px' },
  notificationWrapper: { position: 'relative', display: 'inline-block' },
  notificationIcon: { fontSize: '22px', color: 'white', cursor: 'pointer' },
  notificationBadge: {
    position: 'absolute', top: '-8px', left: '-6px',
    backgroundColor: 'red', color: 'white', borderRadius: '50%',
    width: '16px', height: '16px', fontSize: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 'bold',
  },
  notificationDropdownFixed: {
    position: 'absolute',
    top: '35px',
    left: '50%',
    transform: 'translateX(-27%)',
    width: '280px',
    backgroundColor: 'white',
    color: 'black',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    zIndex: 1200,
    maxHeight: '350px',
    overflowY: 'auto',
    textAlign: 'right',
  },
  dropdownHeader: {
    margin: '10px', fontWeight: 'bold', fontSize: '15px', borderBottom: '1px solid #ccc', paddingBottom: '5px',
  },
  dropdownList: { listStyle: 'none', padding: '0 10px', margin: 0 },
  dropdownItem: {
    padding: '8px 5px', borderBottom: '1px solid #eee',
    display: 'flex', flexDirection: 'column', fontSize: '14px',
  },
  dropdownTime: { fontSize: '11px', color: '#666', marginTop: '2px' },
  viewAll: { textAlign: 'center', padding: '10px', borderTop: '1px solid #ddd' },
  burger: { fontSize: '22px', color: 'white', background: 'none', border: 'none', cursor: 'pointer' },
  dropdownContainer: {
    top: '60px', position: 'fixed', height: 'calc(100% - 60px)', background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(10px)', width: '250px', transition: 'left 0.4s ease', zIndex: 1100,
    padding: '20px 15px', overflowY: 'auto', borderTopRightRadius: '12px', borderBottomRightRadius: '12px',
  },
  mobileNavList: {
    listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', margin: 0, padding: 0,
  },
  link: {
    color: 'white', textDecoration: 'none', fontSize: '18px', fontWeight: '500',
    display: 'flex', alignItems: 'center', padding: '10px 18px',
    borderRadius: '10px', gap: '12px', backgroundColor: 'rgba(2, 0, 102, 0.05)',
  },
  icon: { fontSize: '19px', minWidth: '20px' },
  overlay: {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center',
    alignItems: 'center', zIndex: 2000,
  },
  fullImage: {
    maxWidth: '90%', maxHeight: '90%', borderRadius: '12px',
    boxShadow: '0 0 20px rgba(0, 12, 82, 0.5)',
  },
};

export default Navbar;
