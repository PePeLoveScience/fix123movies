const CACHE_NAME = 'cache-v2';
const API_CACHE_NAME = 'api-cache-v1';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/1.png',
  '/css/style.css',
  '/js/main.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

// Install event: cache files
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)),
      caches.open(API_CACHE_NAME) // Create API cache
    ])
  );
});

// Activate event: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => 
      Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME && name !== API_CACHE_NAME) {
            return caches.delete(name);
          }
        })
      )
    )
  );
});

// Enhanced fetch event with API caching
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Handle TMDB API requests
  if (url.hostname === 'api.themoviedb.org') {
    event.respondWith(handleTMDBApiRequest(event.request));
    return;
  }
  
  // Handle TMDB image requests
  if (url.hostname === 'image.tmdb.org') {
    event.respondWith(handleImageRequest(event.request));
    return;
  }
  
  // Handle regular requests
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// Function to handle TMDB API requests with caching
async function handleTMDBApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  // Create a cache key (remove API key for privacy)
  const url = new URL(request.url);
  url.searchParams.delete('api_key');
  const cacheKey = url.toString();
  
  // Check if we have cached response
  const cachedResponse = await cache.match(cacheKey);
  
  if (cachedResponse) {
    const cachedData = await cachedResponse.json();
    const cacheTime = cachedData._cacheTime || 0;
    const now = Date.now();
    
    // If cache is still fresh (less than 24 hours old)
    if (now - cacheTime < CACHE_DURATION) {
      console.log('🎯 Serving from API cache:', cacheKey);
      
      // Remove cache metadata before returning
      delete cachedData._cacheTime;
      
      return new Response(JSON.stringify(cachedData), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // Fetch from network
  try {
    console.log('🌐 Fetching from TMDB API:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const data = await networkResponse.json();
      
      // Add cache timestamp
      data._cacheTime = Date.now();
      
      // Cache the response
      const responseToCache = new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });
      
      cache.put(cacheKey, responseToCache.clone());
      
      // Remove cache metadata before returning
      delete data._cacheTime;
      
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return networkResponse;
  } catch (error) {
    console.log('❌ Network failed, trying cache:', error);
    
    // If network fails, return cached version even if expired
    if (cachedResponse) {
      const cachedData = await cachedResponse.json();
      delete cachedData._cacheTime;
      
      return new Response(JSON.stringify(cachedData), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Function to handle image requests with long-term caching
async function handleImageRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  // Check cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Fetch and cache images for long time (they rarely change)
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return cached version if available
    return cachedResponse || Promise.reject(error);
  }
}