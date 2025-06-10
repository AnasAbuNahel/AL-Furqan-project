import React, { useEffect, useState } from 'react';
import { getAllResidents, saveResidents, saveResident, deleteResident, addPendingDelete, syncPendingOperations } from './db';
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
    const loadData = async () => {
      if (navigator.onLine) {
        await syncPendingOperations();
        await fetchResidents();
      } else {
        const localData = await getAllResidents();
        setResidents(localData);
        setFilteredResidents(localData);
        setErrorMsg('');
        setLoading(false);
      }
    };

    loadData();

    const syncData = async () => {
      if (navigator.onLine) {
        await syncPendingOperations();
        await fetchResidents();
      }
    };

    window.addEventListener('online', syncData);

    return () => window.removeEventListener('online', syncData);
  }, []);

  const fetchResidents = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    if (!navigator.onLine) {
      const localData = await getAllResidents();
      setResidents(localData);
      setFilteredResidents(localData);
      setErrorMsg('');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get('https://al-furqan-project-uqs4.onrender.com/api/residents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sortedData = res.data.sort((a, b) => a.husband_name?.localeCompare(b.husband_name, 'ar'));
      setResidents(sortedData);
      setFilteredResidents(sortedData);
      setErrorMsg('');
      await saveResidents(sortedData);
    } catch (err) {
      setErrorMsg('تعذر تحميل البيانات. الرجاء المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyAllFilters();
  }, [searchTerm, filterOperator, filterValue, damageFilterValue, delegateFilterValue, aidFilterValue, residents]);

  const applyAllFilters = () => {
    let filtered = [...residents];

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.husband_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.husband_id_number?.includes(searchTerm)
      );
    }

    if (filterOperator && filterValue !== '') {
      const val = parseInt(filterValue);
      filtered = filtered.filter(r => {
        if (filterOperator === '>') return r.num_family_members > val;
        if (filterOperator === '<') return r.num_family_members < val;
        if (filterOperator === '=') return r.num_family_members === val;
        return true;
      });
    }

    if (damageFilterValue) {
      filtered = filtered.filter(r => r.damage_level === damageFilterValue);
    }

    if (delegateFilterValue) {
      filtered = filtered.filter(r => r.neighborhood === delegateFilterValue);
    }

    if (aidFilterValue !== '') {
      filtered = filtered.filter(r =>
        aidFilterValue === 'received' ? r.has_received_aid : !r.has_received_aid
      );
    }

    setFilteredResidents(filtered);
  };

  const handleSearch = e => setSearchTerm(e.target.value);

  const handleChange = e => {
    setFormData(prev => ({
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
    if (navigator.onLine) {
      try {
        await axios.put(`https://al-furqan-project-uqs4.onrender.com/api/residents/${formData.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('✅ تم حفظ التعديلات بنجاح.');
        await saveResident(formData);
        closeModal();
        fetchResidents();
      } catch {
        toast.error('❌ حدث خطأ أثناء الحفظ. حاول مرة أخرى.');
      }
    } else {
      await saveResident(formData);
      toast.info('تم حفظ التعديل محلياً وسيتم مزامنته عند الاتصال بالإنترنت.');
      closeModal();
      fetchResidents();
    }
  };

  const handleDelete = async id => {
    const token = localStorage.getItem('token');
    if (navigator.onLine) {
      try {
        await axios.delete(`https://al-furqan-project-uqs4.onrender.com/api/residents/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('تم الحذف بنجاح');
        await deleteResident(id);
        fetchResidents();
      } catch {
        toast.error('حدث خطأ أثناء الحذف من الخادم.');
      }
    } else {
      await deleteResident(id);
      await addPendingDelete(id);
      toast.info('تم الحذف محلياً وسيتم مزامنته عند الاتصال.');
      fetchResidents();
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredResidents);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Residents');
    XLSX.writeFile(workbook, 'كشف بيانات حي الفرقان.xlsx');
  };

  const importFromExcel = e => {
    const file = e.target.files[0];
    if (!file) return;
    const data = new FormData();
    data.append('file', file);
    const token = localStorage.getItem('token');
    axios
      .post('https://al-furqan-project-uqs4.onrender.com/api/residents/import', data, {
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

  const isInvalidId = id => !id || id.length !== 9 || !/^[0-9]{9}$/.test(id);

  const isInvalidField = val => {
    if (val === null || val === undefined) return true;
    const stringVal = String(val).trim();
    return stringVal === '' || stringVal === '—' || stringVal.includes('_');
  };

  const renderField = (label, name, isTextArea = false) => (
    <div style={styles.modalField}>
      <label style={styles.modalLabel}>{label}:</label>
      {isEditMode ? (
        isTextArea ? (
          <textarea
            name={name}
            value={formData[name] || ''}
            onChange={handleChange}
            style={styles.modalInputArea}
          />
        ) : (
          <input
            name={name}
            value={formData[name] || ''}
            onChange={handleChange}
            style={styles.modalInput}
          />
        )
      ) : (
        <div style={styles.modalValue}>{selectedResident[name] || '—'}</div>
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
            <button onClick={() => setShowFilterPopup(!showFilterPopup)} style={styles.filterBtn}>
              فلترة حسب عدد أفراد الأسرة
            </button>
            <button onClick={() => setShowDamageFilterPopup(!showDamageFilterPopup)} style={styles.filterBtn}>
              فلترة حسب مستوى الضرر
            </button>
            <button onClick={() => setShowDelegateFilterPopup(!showDelegateFilterPopup)} style={styles.filterBtn}>
              فلترة حسب الحي
            </button>
            <button onClick={() => setShowAidFilterPopup(!showAidFilterPopup)} style={styles.filterBtn}>
              فلترة حسب استلام المساعدات
            </button>
            <button onClick={exportToExcel} style={styles.exportBtn}>تصدير Excel</button>
            <input type="file" accept=".xlsx, .xls" onChange={importFromExcel} style={styles.fileInput} />
          </div>

          {/* نوافذ الفلترة */}
          {showFilterPopup && (
            <div style={styles.popup}>
              <label>
                اختر عامل مقارنة:
                <select
                  value={filterOperator}
                  onChange={e => setFilterOperator(e.target.value)}
                  style={styles.select}
                >
                  <option value="">-- اختر --</option>
                  <option value=">">أكبر من</option>
                  <option value="<">أصغر من</option>
                  <option value="=">يساوي</option>
                </select>
              </label>
              <input
                type="number"
                value={filterValue}
                onChange={e => setFilterValue(e.target.value)}
                placeholder="عدد أفراد الأسرة"
                style={styles.filterInput}
              />
              <button onClick={() => setShowFilterPopup(false)} style={styles.closeBtn}>× إغلاق</button>
            </div>
          )}

          {showDamageFilterPopup && (
            <div style={styles.popup}>
              <label>
                مستوى الضرر:
                <select
                  value={damageFilterValue}
                  onChange={e => setDamageFilterValue(e.target.value)}
                  style={styles.select}
                >
                  <option value="">-- اختر --</option>
                  <option value="شديد">شديد</option>
                  <option value="متوسط">متوسط</option>
                  <option value="طفيف">طفيف</option>
                  <option value="لا يوجد">لا يوجد</option>
                </select>
              </label>
              <button onClick={() => setShowDamageFilterPopup(false)} style={styles.closeBtn}>× إغلاق</button>
            </div>
          )}

          {showDelegateFilterPopup && (
            <div style={styles.popup}>
              <label>
                الحي:
                <select
                  value={delegateFilterValue}
                  onChange={e => setDelegateFilterValue(e.target.value)}
                  style={styles.select}
                >
                  <option value="">-- اختر --</option>
                  <option value="الفرقان">الفرقان</option>
                  <option value="الهدى">الهدى</option>
                  <option value="اليوسفية">اليوسفية</option>
                  <option value="المزة">المزة</option>
                </select>
              </label>
              <button onClick={() => setShowDelegateFilterPopup(false)} style={styles.closeBtn}>× إغلاق</button>
            </div>
          )}

          {showAidFilterPopup && (
            <div style={styles.popup}>
              <label>
                استلام المساعدات:
                <select
                  value={aidFilterValue}
                  onChange={e => setAidFilterValue(e.target.value)}
                  style={styles.select}
                >
                  <option value="">-- اختر --</option>
                  <option value="received">تم الاستلام</option>
                  <option value="not_received">لم يتم الاستلام</option>
                </select>
              </label>
              <button onClick={() => setShowAidFilterPopup(false)} style={styles.closeBtn}>× إغلاق</button>
            </div>
          )}

          {loading ? (
            <p>...جاري التحميل</p>
          ) : (
            <>
              <p>عدد السجلات: {filteredResidents.length}</p>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th>رقم الهوية</th>
                    <th>عدد أفراد الأسرة</th>
                    <th>مستوى الضرر</th>
                    <th>الحي</th>
                    <th>استلام المساعدات</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResidents.map(resident => (
                    <tr key={resident.id}>
                      <td>{resident.husband_name || '—'}</td>
                      <td>{resident.husband_id_number || '—'}</td>
                      <td>{resident.num_family_members || '—'}</td>
                      <td>{resident.damage_level || '—'}</td>
                      <td>{resident.neighborhood || '—'}</td>
                      <td>{resident.has_received_aid ? 'نعم' : 'لا'}</td>
                      <td>
                        <button onClick={() => openDetails(resident, false)} style={styles.actionBtn}>
                          عرض
                        </button>
                        <button onClick={() => openDetails(resident, true)} style={styles.actionBtn}>
                          تعديل
                        </button>
                        <button onClick={() => handleDelete(resident.id)} style={styles.actionBtnDelete}>
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      )}

      {showModal && selectedResident && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>{isEditMode ? 'تعديل بيانات' : 'تفاصيل المستفيد'}</h3>
            {renderField('اسم الزوج', 'husband_name')}
            {renderField('رقم الهوية', 'husband_id_number')}
            {renderField('عدد أفراد الأسرة', 'num_family_members')}
            {renderField('مستوى الضرر', 'damage_level')}
            {renderField('الحي', 'neighborhood')}
            {renderField('استلام المساعدات', 'has_received_aid')}
            {renderField('ملاحظات', 'notes', true)}

            {isEditMode && (
              <div style={styles.modalButtons}>
                <button onClick={handleSave} style={styles.saveBtn}>
                  حفظ
                </button>
                <button onClick={closeModal} style={styles.cancelBtn}>
                  إلغاء
                </button>
              </div>
            )}

            {!isEditMode && (
              <button onClick={closeModal} style={styles.closeBtn}>
                إغلاق
              </button>
            )}
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

// بعض التنسيقات البسيطة
const styles = {
  container: { padding: 20, fontFamily: 'Arial, sans-serif', direction: 'rtl', textAlign: 'right' },
  title: { marginBottom: 20 },
  errorBox: { backgroundColor: '#fdd', padding: 10, marginBottom: 20, color: '#900' },
  controls: { marginBottom: 15, display: 'flex', gap: 10, flexWrap: 'wrap' },
  searchInput: { padding: 5, fontSize: 16, flexGrow: 1, minWidth: 150 },
  filterBtn: { padding: '6px 12px', cursor: 'pointer' },
  exportBtn: { padding: '6px 12px', backgroundColor: '#4caf50', color: '#fff', border: 'none', cursor: 'pointer' },
  fileInput: { cursor: 'pointer' },
  popup: {
    position: 'absolute',
    backgroundColor: 'white',
    border: '1px solid #ccc',
    padding: 10,
    zIndex: 10,
    marginTop: 5,
    right: 0,
  },
  select: { padding: 5, marginRight: 5 },
  filterInput: { width: 100, padding: 5 },
  closeBtn: { backgroundColor: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  actionBtn: { marginRight: 5, cursor: 'pointer' },
  actionBtnDelete: { marginRight: 5, cursor: 'pointer', color: 'red' },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    minWidth: 300,
    maxWidth: '90%',
  },
  modalField: { marginBottom: 15 },
  modalLabel: { fontWeight: 'bold', display: 'block', marginBottom: 5 },
  modalInput: { width: '100%', padding: 5, fontSize: 16 },
  modalInputArea: { width: '100%', height: 80, padding: 5, fontSize: 16 },
  modalValue: { padding: 5, backgroundColor: '#f0f0f0' },
  modalButtons: { display: 'flex', justifyContent: 'flex-end', gap: 10 },
  saveBtn: { backgroundColor: '#4caf50', color: '#fff', padding: '6px 12px', border: 'none', cursor: 'pointer' },
  cancelBtn: { backgroundColor: '#f44336', color: '#fff', padding: '6px 12px', border: 'none', cursor: 'pointer' },
};

export default ResidentsList;
