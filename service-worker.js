const CACHE_NAME = 'cache-v2';
const API_CACHE_NAME = 'api-cache-v1';
const CACHE_DURATIONS = {
  popular: 4 * 60 * 60 * 1000,      // 4 hours (changes frequently)
  discover: 8 * 60 * 60 * 1000,     // 8 hours (genres are stable)
  search: 12 * 60 * 60 * 1000,      // 12 hours (search results stable)
  details: 24 * 60 * 60 * 1000,     // 24 hours (movie details don't change)
  upcoming: 6 * 60 * 60 * 1000      // 6 hours (updated regularly)
};

const USA_GLOBAL_ENDPOINTS = [
  // Most popular USA content (best for global audience)
  '/3/movie/popular?page=1',
  '/3/movie/popular?page=2', 
  '/3/movie/popular?page=3',
  '/3/tv/popular?page=1',
  '/3/tv/popular?page=2',
  
  // Top USA genres (popular globally)
  '/3/discover/movie?with_genres=28&page=1',   // Action
  '/3/discover/movie?with_genres=35&page=1',   // Comedy
  '/3/discover/movie?with_genres=27&page=1',   // Horror
  '/3/discover/movie?with_genres=878&page=1',  // Sci-Fi
  '/3/discover/movie?with_genres=53&page=1',   // Thriller
  '/3/discover/movie?with_genres=12&page=1',   // Adventure
];

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
      caches.open(API_CACHE_NAME),
      preCacheUSAContent()
    ])
  );
  self.skipWaiting();
});

async function preCacheUSAContent() {
  console.log('🇺🇸 Pre-caching USA content for global users...');
  
  const API_KEY = '3f4dc5c95e4960eccb2470cab896fc5c';
  
  for (const endpoint of USA_GLOBAL_ENDPOINTS) {
    try {
      // Add region=US for consistent USA data
      const url = `https://api.themoviedb.org/3${endpoint}&api_key=${API_KEY}&language=en-US&region=US`;
      await fetch(url);
      await new Promise(resolve => setTimeout(resolve, 100)); // Fast pre-loading
    } catch (error) {
      console.log('Pre-cache failed:', endpoint);
    }
  }
  
  console.log('✅ USA content cached for global audience');
}

async function handleTMDBApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  const url = new URL(request.url);
  
  // Force USA region for consistent global data
  url.searchParams.set('region', 'US');
  
  // Create cache key (remove API key, keep region=US)
  const cacheUrl = new URL(url);
  cacheUrl.searchParams.delete('api_key');
  const cacheKey = cacheUrl.toString();
  
  // Check cache
  const cachedResponse = await cache.match(cacheKey);
  
  if (cachedResponse) {
    const cachedData = await cachedResponse.json();
    const cacheTime = cachedData._cacheTime || 0;
    const now = Date.now();
    
    // Smart cache duration based on endpoint type
    let duration = CACHE_DURATIONS.discover; // default
    if (url.pathname.includes('popular')) duration = CACHE_DURATIONS.popular;
    else if (url.pathname.includes('search')) duration = CACHE_DURATIONS.search;
    else if (url.pathname.includes('upcoming')) duration = CACHE_DURATIONS.upcoming;
    else if (url.pathname.match(/\/(movie|tv)\/\d+/)) duration = CACHE_DURATIONS.details;
    
    if (now - cacheTime < duration) {
      console.log('🎯 USA cache HIT (global):', url.pathname);
      
      delete cachedData._cacheTime;
      return new Response(JSON.stringify(cachedData), {
        headers: { 
          'Content-Type': 'application/json',
          'X-Cache': 'HIT-USA-GLOBAL',
          'X-Cache-Region': 'US',
          'X-Cache-TTL': Math.floor((duration - (now - cacheTime)) / 1000) + 's'
        }
      });
    }
  }
  
  // Fetch from network with USA region
  try {
    console.log('🌐 Fetching USA data for global user:', url.pathname);
    const networkResponse = await fetch(url.toString());
    
    if (networkResponse.ok) {
      const data = await networkResponse.json();
      data._cacheTime = Date.now();
      
      // Cache for global use
      const responseToCache = new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });
      
      cache.put(cacheKey, responseToCache.clone());
      
      delete data._cacheTime;
      return new Response(JSON.stringify(data), {
        headers: { 
          'Content-Type': 'application/json',
          'X-Cache': 'MISS-USA-GLOBAL',
          'X-Cache-Region': 'US'
        }
      });
    }
    
    return networkResponse;
  } catch (error) {
    console.log('❌ Network failed, using stale USA cache');
    
    if (cachedResponse) {
      const cachedData = await cachedResponse.json();
      delete cachedData._cacheTime;
      
      return new Response(JSON.stringify(cachedData), {
        headers: { 
          'Content-Type': 'application/json',
          'X-Cache': 'STALE-USA-GLOBAL'
        }
      });
    }
    
    throw error;
  }
}

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