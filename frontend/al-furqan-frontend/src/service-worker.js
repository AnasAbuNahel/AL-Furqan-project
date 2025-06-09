/* eslint-disable no-restricted-globals */
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkOnly } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// ✅ Precaching files generated at build
precacheAndRoute(self.__WB_MANIFEST || []);

// ✅ Caching GET API requests (like statistics, list of residents...)
registerRoute(
  ({ request, url }) => request.method === 'GET' && url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-get-cache',
  })
);

// ✅ Background sync for POST requests (like /api/residents)
const bgSyncPlugin = new BackgroundSyncPlugin('api-post-queue', {
  maxRetentionTime: 24 * 60, // 24 hours
});

registerRoute(
  ({ request, url }) =>
    request.method === 'POST' && url.pathname.startsWith('/api/'),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'POST'
);
