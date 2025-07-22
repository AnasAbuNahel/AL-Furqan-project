import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ResidentsList = () => {
  const [residents, setResidents] = useState([]);
  const [filteredResidents, setFilteredResidents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResident, setSelectedResident] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // فلاتر مخصصة
  const [filterOperator, setFilterOperator] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [damageFilterValue, setDamageFilterValue] = useState('');
  const [delegateFilterValue, setDelegateFilterValue] = useState('');
  const [aidFilterValue, setAidFilterValue] = useState('');

  // تحكم في نوافذ التصفية
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [showDamageFilterPopup, setShowDamageFilterPopup] = useState(false);
  const [showDelegateFilterPopup, setShowDelegateFilterPopup] = useState(false);
  const [showAidFilterPopup, setShowAidFilterPopup] = useState(false);

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('https://al-furqan-project-xx60.onrender.com/api/residents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sortedData = res.data.sort((a, b) => {
        const nameA = a.husband_name?.toLowerCase() || '';
        const nameB = b.husband_name?.toLowerCase() || '';
        return nameA.localeCompare(nameB, 'ar');
      });
      setResidents(sortedData);
      setFilteredResidents(sortedData);
      setErrorMsg('');
    } catch (err) {
      console.error('فشل في جلب البيانات:', err);
      setErrorMsg('تعذر تحميل البيانات حاليًا. الرجاء المحاولة لاحقًا.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyAllFilters();
  }, [searchTerm, filterOperator, filterValue, damageFilterValue, delegateFilterValue, aidFilterValue]);

  const applyAllFilters = () => {
    let filtered = [...residents];

    if (searchTerm) {
      filtered = filtered.filter((r) =>
        r.husband_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.husband_id_number?.includes(searchTerm)
      );
    }

    if (filterOperator && filterValue !== '') {
      const val = parseInt(filterValue);
      filtered = filtered.filter((r) => {
        if (filterOperator === '>') return r.num_family_members > val;
        if (filterOperator === '<') return r.num_family_members < val;
        if (filterOperator === '=') return r.num_family_members === val;
        return true;
      });
    }

    if (damageFilterValue) {
      filtered = filtered.filter((r) => r.damage_level === damageFilterValue);
    }

    if (delegateFilterValue) {
      filtered = filtered.filter((r) => r.neighborhood === delegateFilterValue);
    }

    if (aidFilterValue !== '') {
      filtered = filtered.filter((r) =>
        aidFilterValue === 'received' ? r.has_received_aid : !r.has_received_aid
      );
    }

    setFilteredResidents(filtered);
  };
  const handleSearch = (e) => setSearchTerm(e.target.value);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const openDetails = (resident, edit = false) => {
    setSelectedResident(resident);
    setFormData(resident);
    setIsEditMode(edit);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedResident(null);
    setIsEditMode(false);
    setShowModal(false);
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`https://al-furqan-project-xx60.onrender.com/api/residents/${formData.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('✅ تم حفظ التعديلات بنجاح.');
      closeModal();
      fetchResidents();
    } catch (err) {
      toast.error('❌ حدث خطأ أثناء الحفظ. الرجاء المحاولة مرة أخرى.');
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`https://al-furqan-project-xx60.onrender.com/api/residents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('تم الحذف بنجاح');
      fetchResidents();
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف. حاول مرة أخرى');
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredResidents);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Residents');
    XLSX.writeFile(workbook, 'كشف بيانات حي الفرقان.xlsx');
  };

  const importFromExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const data = new FormData();
    data.append('file', file);
    const token = localStorage.getItem('token');
    axios
      .post('https://al-furqan-project-xx60.onrender.com/api/residents/import', data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        toast.success('تم استيراد البيانات بنجاح');
        fetchResidents();
      })
      .catch(() => {
        toast.error('حدث خطأ أثناء استيراد الملف.');
      });
  };

    const isInvalidId = (id) => {
    return !id || id.length !== 9 || !/^[0-9]{9}$/.test(id);
  };

    const isInvalidField = (val) => {
    if (val === null || val === undefined) return true;
    const stringVal = String(val).trim();
    return stringVal === '' || stringVal === '—' || stringVal.includes('_');
  };

  const renderField = (label, name, isTextArea = false) => (
    <div style={styles.modalField}>
      <label style={styles.modalLabel}>{label}:</label>
      {isEditMode ? (
        isTextArea ? (
          <textarea name={name} value={formData[name] || ''} onChange={handleChange} style={styles.modalInputArea} />
        ) : (
          <input name={name} value={formData[name] || ''} onChange={handleChange} style={styles.modalInput} />
        )
      ) : (
        <div style={styles.modalValue}>{selectedResident[name]}</div>
      )}
    </div>
  );
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🔹 كشف بيانات حي الفرقان</h2>

      {errorMsg ? (
        <div style={styles.errorBox}>⚠️ {errorMsg}</div>
      ) : (
        <>
          <div style={styles.controls}>
            <input
              type="text"
              placeholder="ابحث بالاسم أو الهوية"
              value={searchTerm}
              onChange={handleSearch}
              style={styles.searchInput}
            />
            <button onClick={exportToExcel} style={styles.exportBtn}>📤 تصدير Excel</button>
            <label style={styles.importBtn}>
              📥 استيراد Excel
              <input type="file" accept=".xlsx, .xls" onChange={importFromExcel} style={{ display: 'none' }} />
            </label>
          </div>

          {loading ? (
            <p>⏳ جاري تحميل البيانات...</p>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead style={styles.tableHeader}>
                  <tr>
                    <th>الرقم</th>
                    <th>اسم الزوج</th>
                    <th>رقم الهوية</th>
                    <th onClick={() => setShowFilterPopup(true)} style={styles.clickableHeader}>عدد الأفراد 🔽</th>
                    <th onClick={() => setShowDamageFilterPopup(true)} style={styles.clickableHeader}>الضرر 🔽</th>
                    <th onClick={() => setShowDelegateFilterPopup(true)} style={styles.clickableHeader}>المندوب 🔽</th>
                    <th onClick={() => setShowAidFilterPopup(true)} style={styles.clickableHeader}>الاستفادة 🔽</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResidents.map((res, index) => (
                    <tr key={res.id} style={styles.tableRow}>
                      <td>{index + 1}</td>
                    <td style={isInvalidField(res.husband_name) ? styles.invalidCell : null}>
                      {res.husband_name || '—'}
                    </td>
                    <td style={isInvalidId(res.husband_id_number) ? styles.invalidCell : null}>
                      {res.husband_id_number || '—'}
                    </td>
                    <td style={isInvalidField(res.num_family_members) ? styles.invalidCell : null}>
                      {res.num_family_members || '—'}
                    </td>
                    <td style={isInvalidField(res.damage_level) ? styles.invalidCell : null}>
                      {res.damage_level || '—'}
                    </td>
                    <td style={isInvalidField(res.neighborhood) ? styles.invalidCell : null}>
                      {res.neighborhood || '—'}
                    </td>
                    <td>{res.has_received_aid ? '✅' : '❌'}</td>
                    <td>
                      <button onClick={() => openDetails(res, false)} style={styles.btnDetails}>تفاصيل</button>
                      <button onClick={() => openDetails(res, true)} style={styles.btnEdit}>تعديل</button>
                      <button onClick={() => handleDelete(res.id)} style={styles.btnDelete}>حذف</button>
                    </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showModal && selectedResident && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <h3 style={styles.modalTitle}>
              {isEditMode ? '✏️ تعديل بيانات المستفيد' : '📋 تفاصيل المستفيد'}
            </h3>
            {renderField('اسم الزوج', 'husband_name')}
            {renderField('رقم هوية الزوج', 'husband_id_number')}
            {renderField('اسم الزوجة', 'wife_name')}
            {renderField('رقم هوية الزوجة', 'wife_id_number')}
            {renderField('رقم الجوال', 'phone_number')}
            {renderField('عدد الأفراد', 'num_family_members')}
            {renderField('الإصابات', 'injuries')}
            {renderField('الأمراض', 'diseases')}
            {renderField('الضرر', 'damage_level')}
            {renderField('المندوب', 'neighborhood')}
            {renderField('ملاحظات', 'notes', true)}
            <div style={styles.modalButtons}>
              {isEditMode && <button onClick={handleSave} style={styles.btnSave}>💾 حفظ</button>}
              <button onClick={closeModal} style={styles.btnClose}>❌ إغلاق</button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
      {showFilterPopup && (
  <div style={styles.popupOverlay}>
    <div style={styles.popupBox}>
      <h3 style={styles.popupTitle}>تصفية حسب عدد الأفراد</h3>
      <select
        value={filterOperator}
        onChange={(e) => setFilterOperator(e.target.value)}
        style={styles.select}
      >
        <option value="">اختر شرط التصفية</option>
        <option value=">">أكبر من</option>
        <option value="<">أصغر من</option>
        <option value="=">يساوي</option>
      </select>
      <input
        type="number"
        value={filterValue}
        onChange={(e) => setFilterValue(e.target.value)}
        placeholder="أدخل العدد"
        style={styles.input}
      />
      <div style={styles.popupButtons}>
        <button onClick={() => setShowFilterPopup(false)} style={styles.popupApply}>تطبيق</button>
        <button onClick={() => { setFilterOperator(''); setFilterValue(''); setShowFilterPopup(false); }} style={styles.popupCancel}>مسح</button>
      </div>
    </div>
  </div>
)}

{showDamageFilterPopup && (
  <div style={styles.popupOverlay}>
    <div style={styles.popupBox}>
      <h3 style={styles.popupTitle}>تصفية حسب الضرر</h3>
      <select
        value={damageFilterValue}
        onChange={(e) => setDamageFilterValue(e.target.value)}
        style={styles.select}
      >
        <option value="">الكل</option>
        <option value="طفيف">طفيف</option>
        <option value="جزئي بليغ">جزئي بليغ</option>
        <option value="كلي">كلي</option>
      </select>
      <div style={styles.popupButtons}>
        <button onClick={() => setShowDamageFilterPopup(false)} style={styles.popupApply}>تطبيق</button>
        <button onClick={() => { setDamageFilterValue(''); setShowDamageFilterPopup(false); }} style={styles.popupCancel}>مسح</button>
      </div>
    </div>
  </div>
)}

{showDelegateFilterPopup && (
  <div style={styles.popupOverlay}>
    <div style={styles.popupBox}>
      <h3 style={styles.popupTitle}>تصفية حسب اسم المندوب</h3>
      <select
        value={delegateFilterValue}
        onChange={(e) => {
          setDelegateFilterValue(e.target.value);
          setShowDelegateFilterPopup(false); 
        }}
        style={styles.select}
      >
        <option value="">كل المناديب</option>
        {Array.from(new Set(residents.map((r) => r.neighborhood).filter(Boolean))).map((delegate, idx) => (
          <option key={idx} value={delegate}>
            {delegate}
          </option>
        ))}
      </select>
      <div style={styles.popupButtons}>
        <button onClick={() => setShowDelegateFilterPopup(false)} style={styles.popupApply}>إغلاق</button>
        <button onClick={() => { setDelegateFilterValue(''); setShowDelegateFilterPopup(false); }} style={styles.popupCancel}>مسح</button>
      </div>
    </div>
  </div>
)}

{showAidFilterPopup && (
  <div style={styles.popupOverlay}>
    <div style={styles.popupBox}>
      <h3 style={styles.popupTitle}>تصفية حسب حالة الاستفادة</h3>
      <select
        value={aidFilterValue}
        onChange={(e) => setAidFilterValue(e.target.value)}
        style={styles.select}
      >
        <option value="">الكل</option>
        <option value="received">استفاد</option>
        <option value="not_received">لم يستفد</option>
      </select>
      <div style={styles.popupButtons}>
        <button onClick={() => setShowAidFilterPopup(false)} style={styles.popupApply}>تطبيق</button>
        <button onClick={() => { setAidFilterValue(''); setShowAidFilterPopup(false); }} style={styles.popupCancel}>مسح</button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    fontFamily: 'Tajawal, Arial, sans-serif',
    backgroundColor: '#f9fafb',
    minHeight: '100vh',
    direction: 'rtl',
  },
  title: {
    fontSize: '26px',
    marginBottom: '20px',
    textAlign: 'center',
    color: '#1f2937',
  },
  errorBox: {
    backgroundColor: '#fef3c7',
    padding: '15px',
    borderRadius: '6px',
    marginBottom: '20px',
    color: '#92400e',
    fontWeight: 'bold',
  },
  controls: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '20px',
    justifyContent: 'center'
  },
  searchInput: {
    flex: 1,
    minWidth: '200px',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '16px',
  },
  exportBtn: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  importBtn: {
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  invalidCell: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    fontWeight: 'bold',
  },
  table: {
    minWidth: '800px',
    width: '100%',
    borderCollapse: 'collapse',
    fontWeight: 'bold',
    backgroundColor: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  },
  tableHeader: {
    backgroundColor: '#2563eb',
    color: '#fff',
    textAlign: 'center',
    fontSize: '16px',
    height: '45px',
  },
  tableRow: {
    textAlign: 'center',
    fontSize: '15px',
    borderBottom: '1px solid #e5e7eb',
  },
  clickableHeader: {
    cursor: 'pointer',
    userSelect: 'none',
  },
  btnDetails: {
    backgroundColor: '#0ea5e9',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: '6px',
    border: 'none',
    margin: '0 4px',
    cursor: 'pointer',
  },
  btnEdit: {
    backgroundColor: '#f59e0b',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: '6px',
    border: 'none',
    margin: '0 4px',
    cursor: 'pointer',
  },
  btnDelete: {
    backgroundColor: '#ef4444',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: '6px',
    border: 'none',
    margin: '0 4px',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: '25px',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  },
  modalTitle: {
    marginBottom: '20px',
    fontSize: '22px',
    color: '#1f2937',
    textAlign: 'center',
  },
  modalField: {
    marginBottom: '15px',
  },
  modalLabel: {
    fontWeight: 'bold',
    display: 'block',
    marginBottom: '6px',
  },
  modalInput: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '15px',
  },
  modalInputArea: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '15px',
    height: '80px',
  },
  modalValue: {
    padding: '10px',
    backgroundColor: '#f3f4f6',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
  },
  modalButtons: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
  },
  btnSave: {
    backgroundColor: '#10b981',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  btnClose: {
    backgroundColor: '#6b7280',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  popupOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  popupBox: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '350px',
    boxShadow: '0 0 10px rgba(0,0,0,0.2)',
  },
  popupTitle: {
    fontSize: '18px',
    marginBottom: '12px',
    textAlign: 'center',
    color: '#1f2937',
  },
  select: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '10px',
    border: '1px solid #d1d5db',
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '10px',
    border: '1px solid #d1d5db',
  },
  popupButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
  },
  popupApply: {
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    flex: 1,
    fontWeight: 'bold',
  },
  popupCancel: {
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    flex: 1,
    fontWeight: 'bold',
  },
};

export default ResidentsList;
