import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { jwtDecode } from 'jwt-decode';

const AidForm = () => {
  const [residents, setResidents] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [aidType, setAidType] = useState('');
  const [aidDate, setAidDate] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [otherAidType, setOtherAidType] = useState(''); // الحالة الجديدة لمربع النص
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const decoded = jwtDecode(token);
  const userRole = decoded?.role; // "admin" أو "supervisor"

  useEffect(() => {
    axios.get("https://al-furqan-project-xx60.onrender.com/api/residents", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })
    .then((response) => {
      setResidents(response.data);
    })
    .catch((error) => {
      console.error("خطأ في تحميل السكان:", error);
      toast.error("فشل في تحميل المستفيدين");
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedId || !aidType || !aidDate) {
      toast.error('⚠️ الرجاء تعبئة جميع الحقول.');
      return;
    }

    const proposedAidTypes = ['طرد صحي', 'طرد غذائي', 'طرد خضروات', 'مساعدات نقدية'];

    let finalAidType = aidType;
    if (aidType === 'مساعدات نقدية' && cashAmount) {
      finalAidType += ` - ${cashAmount}`;
    }
    if (aidType === 'غير ذلك' && otherAidType) {
      finalAidType = otherAidType;
    }

    // شرط التكرار على المشرف فقط عند اختيار نوع مقترح
    if (userRole !== 'admin' && proposedAidTypes.includes(aidType)) {
      try {
        const response = await axios.get(`https://al-furqan-project-xx60.onrender.com/api/aids?resident_id=${selectedId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const existingProposedAids = response.data.filter(aid =>
          proposedAidTypes.includes(aid.aid_type.split(' - ')[0]) // تجاهل القيمة الملحقة
        );

        if (existingProposedAids.length > 0) {
          toast.error('⚠️ لا يمكن تسجيل أكثر من مساعدة مقترحة واحدة للمستفيد. يرجى التواصل مع المدير.');
          return;
        }

      } catch (error) {
        console.error('خطأ في التحقق من المساعدات السابقة:', error);
        toast.error('❌ فشل في التحقق من المساعدات السابقة.');
        return;
      }
    }

    // الإرسال الفعلي
    try {
      await axios.post('https://al-furqan-project-xx60.onrender.com/api/aids', {
        resident_id: selectedId,
        aid_type: finalAidType,
        date: aidDate,
        role: userRole
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast.success('✅ تم تسجيل المساعدة بنجاح.');

      // رفع عداد الإشعارات عند النجاح
      if (window.incrementNotificationCount) {
        window.incrementNotificationCount(1);
      }

      setTimeout(() => {
        navigate('/history');
      }, 1500);
    } catch (error) {
      if (error.response && error.response.data?.error) {
        toast.error(`⚠️ ${error.response.data.error}`);
      } else {
        toast.error('❌ حدث خطأ أثناء التسجيل.');
      }
    }
  };

  const styles = {
    formContainer: {
      direction: 'rtl',
      padding: '30px',
      maxWidth: '600px',
      margin: 'auto',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      marginTop: '80px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    heading: {
      textAlign: 'center',
      marginBottom: '20px',
      color: '#004e92',
      fontSize: '22px',
      fontWeight: 'bold'
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#333',
      marginBottom: '5px'
    },
    input: {
      width: '100%',
      padding: '10px',
      marginTop: '5px',
      border: '1px solid #ccc',
      borderRadius: '6px',
      fontSize: '14px',
      boxSizing: 'border-box'
    },
    button: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#004e92',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '16px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      marginTop: '20px',
      transition: 'background 0.3s'
    },
    buttonHover: {
      backgroundColor: '#003c7a'
    }
  };

  const residentOptions = residents.map(res => ({
    value: res.id,
    label: `${res.husband_name} (${res.husband_id})`
  }));

  return (
    <div style={styles.formContainer}>
      <Toaster position="top-center" reverseOrder={false} />
      <h2 style={styles.heading}>تسجيل استلام المساعدة</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={styles.label}>اختر المستفيد:</label>
          <Select
            options={residentOptions}
            onChange={(option) => setSelectedId(option ? option.value : '')}
            placeholder="ابحث واختر مستفيد..."
            isClearable
            styles={{
              control: (base) => ({
                ...base,
                fontSize: '14px',
                borderRadius: '6px',
                direction: 'rtl'
              }),
              menu: (base) => ({
                ...base,
                direction: 'rtl'
              })
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={styles.label}>نوع المساعدة:</label>
          <select
            value={aidType}
            onChange={(e) => {
              setAidType(e.target.value);
              setCashAmount('');
              setOtherAidType('');
            }}
            required
            style={styles.input}
          >
            <option value="">-- اختر نوع المساعدة --</option>
            <option value="طرد صحي">طرد صحي</option>
            <option value="طرد غذائي">طرد غذائي</option>
            <option value="طرد خضروات">طرد خضروات</option>
            <option value="مساعدات نقدية">مساعدات نقدية</option>
            <option value="غير ذلك">غير ذلك</option>
          </select>
        </div>

        {aidType === 'مساعدات نقدية' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={styles.label}>قيمة المساعدة النقدية (شيكل):</label>
            <input
              type="number"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              required
              style={styles.input}
            />
          </div>
        )}

        {aidType === 'غير ذلك' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={styles.label}>اكتب نوع المساعدة:</label>
            <input
              type="text"
              value={otherAidType}
              onChange={(e) => setOtherAidType(e.target.value)}
              required
              style={styles.input}
              placeholder="اكتب نوع المساعدة هنا"
            />
            <small style={{ color: '#777' }}>
              ⚠️ سيتم اعتبار هذه المساعدة كمساعدة مخصصة، ويمكنك تسجيل مساعدات أخرى لاحقًا.
            </small>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={styles.label}>تاريخ المساعدة:</label>
          <input
            type="date"
            value={aidDate}
            onChange={(e) => setAidDate(e.target.value)}
            required
            style={styles.input}
          />
        </div>

        <button
          type="submit"
          style={styles.button}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = styles.button.backgroundColor}
        >
          تسجيل
        </button>
      </form>
    </div>
  );
};

export default AidForm;
