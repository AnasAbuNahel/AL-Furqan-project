// src/pages/AidStats.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AidStats = () => {
  const [aidCounts, setAidCounts] = useState([]);
  const [aidTypes, setAidTypes] = useState([]);
  const [summary, setSummary] = useState({ total_residents: 0, total_aids: 0 });

  useEffect(() => {
    axios.get('https://al-furqan-project-xx60.onrender.com/api/aids/stats')
      .then(response => {
        const { daily_counts, aid_type_counts, total_residents, total_aids } = response.data;
        setAidCounts(daily_counts);
        setAidTypes(aid_type_counts);
        setSummary({ total_residents, total_aids });
      })
      .catch(error => {
        console.error('خطأ في تحميل الإحصائيات:', error);
      });
  }, []);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1'];

  return (
    <div className="p-6 md:p-8" style={{ direction: 'rtl' }}>
      <h2 className="text-2xl font-bold text-blue-800 mb-6">إحصائيات المساعدات</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow-lg rounded-xl p-6 text-center">
          <p className="text-gray-600">إجمالي السكان</p>
          <h3 className="text-3xl font-semibold text-blue-600">{summary.total_residents}</h3>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6 text-center">
          <p className="text-gray-600">إجمالي المساعدات</p>
          <h3 className="text-3xl font-semibold text-blue-600">{summary.total_aids}</h3>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6 text-center">
          <p className="text-gray-600">أنواع المساعدات</p>
          <h3 className="text-3xl font-semibold text-blue-600">{aidTypes.length}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h4 className="text-xl font-bold text-blue-800 mb-4">عدد المساعدات حسب الأيام</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aidCounts}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-6">
          <h4 className="text-xl font-bold text-blue-800 mb-4">توزيع أنواع المساعدات</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={aidTypes}
                dataKey="count"
                nameKey="aid_type"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {aidTypes.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AidStats;
