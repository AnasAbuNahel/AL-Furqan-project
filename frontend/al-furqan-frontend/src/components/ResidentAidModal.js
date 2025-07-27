import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function ResidentAidModal({ residentId, onClose }) {
  const [resident, setResident] = useState(null);

  useEffect(() => {
    axios.get(`https://al-furqan-project-xx60.onrender.com/resident/${residentId}`)
      .then(res => setResident(res.data))
      .catch(err => console.error('خطأ في تحميل بيانات الساكن:', err));
  }, [residentId]);

  if (!resident) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3>📌 تفاصيل المستفيد</h3>
        <p><strong>اسم الزوج:</strong> {resident.husband_name}</p>
        <p><strong>رقم الهوية:</strong> {resident.husband_id}</p>
        <p><strong>رقم الجوال:</strong> {resident.phone}</p>
        <p><strong>عدد أفراد الأسرة:</strong> {resident.family_size}</p>
        <p><strong>الحالة الاجتماعية:</strong> {resident.status}</p>
        <p><strong>ملاحظات:</strong> {resident.notes || '—'}</p>

        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <button onClick={onClose} style={buttonStyle}>❌ إغلاق</button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
  backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
  zIndex: 1000
};

const modalStyle = {
  backgroundColor: 'white', padding: '30px', borderRadius: '10px',
  maxWidth: '500px', width: '90%', fontFamily: 'Arial', direction: 'rtl'
};

const buttonStyle = {
  padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px'
};
