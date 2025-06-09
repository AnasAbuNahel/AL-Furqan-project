/* eslint-disable no-restricted-globals */
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkOnly } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// ✅ Precaching files generated at build
precacheAndRoute(self.__WB_MANIFEST || []);

// ✅ Caching GET API requests (مثل إحصائيات وقوائم المستفيدين...)
registerRoute(
  ({ request, url }) => request.method === 'GET' && url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-get-cache',
  })
);

// ✅ Background sync لطلبات POST الخاصة بالمستفيدين (residents)
const bgSyncResidents = new BackgroundSyncPlugin('residents-post-queue', {
  maxRetentionTime: 24 * 60, // 24 ساعة
});

registerRoute(
  ({ request, url }) =>
    request.method === 'POST' && url.pathname.startsWith('/api/residents'),
  new NetworkOnly({
    plugins: [bgSyncResidents],
  }),
  'POST'
);

// ✅ Background sync لطلبات POST الخاصة بالمساعدات (aids)
const bgSyncAids = new BackgroundSyncPlugin('aids-post-queue', {
  maxRetentionTime: 24 * 60, // 24 ساعة
});

registerRoute(
  ({ request, url }) =>
    request.method === 'POST' && url.pathname.startsWith('/api/aids'),
  new NetworkOnly({
    plugins: [bgSyncAids],
  }),
  'POST'
);
