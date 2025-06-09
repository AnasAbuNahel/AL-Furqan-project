// src/syncOffline.js
import { getAllOfflineResidents, clearOfflineResidents } from './utils/idb';
import axios from 'axios';

export async function syncOfflineResidents() {
  const token = localStorage.getItem('token');
  const residents = await getAllOfflineResidents();

  for (const resident of residents) {
    try {
      await axios.post('https://al-furqan-project-uqs4.onrender.com/api/residents', resident, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('فشل في إرسال المستفيد من IndexedDB:', error);
    }
  }

  await clearOfflineResidents();
}
