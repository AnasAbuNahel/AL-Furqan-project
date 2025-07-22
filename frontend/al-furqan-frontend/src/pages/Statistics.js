import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
} from 'recharts';

const COLORS = ['#42a5f5', '#66bb6a', '#ffca28', '#ab47bc', '#ff7043', '#26c6da'];

function Statistics() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get('https://al-furqan-project-xx60.onrender.com/api/residents/stats')
      .then(response => setStats(response.data))
      .catch(error => console.error('خطأ في تحميل الإحصائيات:', error));
  }, []);

  if (!stats) return <div style={styles.loading}>جارٍ تحميل البيانات...</div>;

  const damageData = [
    { name: 'هدم كلي', value: stats.total_full_damage },
    { name: 'جزئي بليغ', value: stats.total_severe_partial_damage },
    { name: 'طفيف', value: stats.total_partial_damage },
    { name: 'سليم', value: stats.total_no_damage },
  ];

  const beneficiariesData = [
    { name: 'مستفيدون', value: stats.total_beneficiaries },
    { name: 'غير مستفيدين', value: stats.total_non_beneficiaries },
  ];

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>📊 الإحصائيات العامة</h2>

      {/* الصناديق العليا */}
      <div style={styles.statsBox}>
      <div style={styles.statItem}>👥 إجمالي السكان: <strong>{stats.total_residents}</strong></div>
      <div style={styles.statItem}>🎁 إجمالي المساعدات: <strong>{stats.total_aids}</strong></div>
      <div style={styles.statItem}>✅ مستفيدون: <strong>{stats.total_beneficiaries}</strong></div>
      <div style={styles.statItem}>🚫 غير مستفيدين: <strong>{stats.total_non_beneficiaries}</strong></div>
    </div>

      {/* صندوق تفاصيل الأضرار */}
      <div style={styles.statsBox}>
        <div style={styles.statItem}>🔥 هدم كلي: <strong>{stats.total_full_damage}</strong></div>
        <div style={styles.statItem}>💥 جزئي بليغ: <strong>{stats.total_severe_partial_damage}</strong></div>
        <div style={styles.statItem}>🧱 طفيف: <strong>{stats.total_partial_damage}</strong></div>
        <div style={styles.statItem}> لا يوجد ضرر: <strong>{stats.total_no_damage}</strong></div>
      </div>

      {/* الرسومات البيانية */}
      <div style={styles.chartGrid}>
        <div style={styles.chartContainer}>
          <h3 style={styles.chartTitle}>توزيع أنواع الأضرار (Pie Chart)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={damageData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {damageData.map((entry, index) => (
                  <Cell key={`cell-damage-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartContainer}>
          <h3 style={styles.chartTitle}>تفاصيل الأضرار (Bar Chart)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={damageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill={COLORS[2]}>
                <LabelList dataKey="value" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartContainer}>
          <h3 style={styles.chartTitle}>نسبة المستفيدين (Pie Chart)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={beneficiariesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {beneficiariesData.map((entry, index) => (
                  <Cell key={`cell-beneficiary-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartContainer}>
          <h3 style={styles.chartTitle}>تفاصيل المستفيدين (Bar Chart)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={beneficiariesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill={COLORS[4]}>
                <LabelList dataKey="value" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '5%',
    direction: 'rtl',
    fontFamily: 'Tajawal, sans-serif',
    backgroundColor: '#fafafa',
    minHeight: '100vh',
    color: '#333',
  },
  header: {
    color: '#1f3c88',
    marginBottom: '30px',
    fontSize: '30px',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsBox: {
    display: 'flex',
    gap: '20px',
    marginBottom: '30px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statItem: {
    backgroundColor: '#ffffff',
    padding: '20px 25px',
    borderRadius: '15px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    fontSize: '18px',
    minWidth: '220px',
    textAlign: 'center',
    color: '#333',
    transition: 'all 0.3s ease-in-out',
  },
  statItemHover: {
    transform: 'scale(1.05)',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
  },
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '15px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  chartTitle: {
    marginBottom: '10px',
    color: '#333',
    fontSize: '18px',
    textAlign: 'center',
  },
  loading: {
    textAlign: 'center',
    padding: '100px',
    fontSize: '24px',
    color: '#666',
  },
};

export default Statistics;
