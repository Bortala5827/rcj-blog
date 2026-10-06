// 极简 Service Worker：满足 PWA 可安装性 + 静态资源缓存
// 策略：_next/static 与 /icons 走 cache-first（文件名带 hash，内容不变）；
// 页面导航走 network-first（离线时回退缓存）；其余请求直连不拦截。
const CACHE = 'pwa-v1';
const PRECACHE = ['/music', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // 音频/封面走 cdn.955827.xyz，浏览器自身缓存足够
  if (url.pathname.startsWith('/api/')) return; // 会话态接口不缓存

  // 带 hash 的静态资源：cache-first
  if (url.pathname.startsWith('/_next/static') || url.pathname.startsWith('/icons')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          })
      )
    );
    return;
  }

  // 页面导航：network-first，失败回退缓存（弱网/离线仍可打开已缓存页）
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('/music')))
    );
  }
});
