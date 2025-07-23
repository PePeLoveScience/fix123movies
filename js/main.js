const TMDB_API_KEY = '3f4dc5c95e4960eccb2470cab896fc5c';

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const mainNavList = document.getElementById('mainNavList');
    const movieGenreList = document.getElementById('movieGenreList');
    const tvGenreList = document.getElementById('tvGenreList');
    const movieGrid = document.getElementById('movieGrid');
    const sectionTitle = document.getElementById('sectionTitle');
    const movieListingView = document.getElementById('movieListingView');
    const movieDetailView = document.getElementById('movieDetailView');
    const userListPage = document.getElementById('userListPage');
    const userListGrid = document.getElementById('userListGrid');
    const userListTitle = document.getElementById('userListTitle');

    const backToListButton = document.getElementById('backToListButton');
    const backToMainFromListButton = document.getElementById('backToMainFromListButton');
    const detailContentWrapper = movieDetailView.querySelector('.detail-content-wrapper');
    const loadMoreButton = document.getElementById('loadMoreButton');
    const confirmationMessage = document.getElementById('confirmationMessage');

    const myListButton = document.getElementById('myListButton');
    const favoritesButton = document.getElementById('favoritesButton');
    const bookmarksButton = document.getElementById('bookmarksButton');

    const sidebar = document.getElementById('sidebar');
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const overlay = document.getElementById('overlay');

    // Constants
    const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
    const TMDB_BACKDROP_BASE_URL = 'https://www.themoviedb.org/t/p/w1280';
    const TMDB_POSTER_PLACEHOLDER = 'https://placehold.co/180x270/1a1a1a/e0e0e0?text=No+Poster';
    const TMDB_DETAIL_POSTER_PLACEHOLDER = 'https://placehold.co/250x375/1a1a1a/e0e0e0?text=No+Poster';

    // Local content
    const localNonTMDBContent = {
        'upcoming': [
            {
                id: 'squidgame4',
                type: 'movie',
                media_type: 'movie',
                title: 'Squid Game: USA',
                overview: 'In neon‑lit Los Angeles, desperate strangers are drawn into deadly childhood games where every move could be their last.',
                release_date: '2025-07-23',
                vote_average: 8.5,
                poster_path: "img/squidgame4.jpg",
                backdrop_path: "img/squidgame4.jpg",
                genres: [{ id: 1, name: 'Drama' }, { id: 2, name: 'Family' }],
                runtime: 95,
            }
        ]
    };

    const customVideoSources = {
        '617126': 'https://streamable.com/e/tep23r',
        "squidgame4": "https://streamable.com/e/h0fy03",
        "1311031": "https://streamable.com/e/h0h19g"
    };

    // State variables
    let currentContentType = 'movie';
    let currentActiveGenreOrType = 'upcoming';
    let currentPage = 1;
    let currentSearchQuery = '';

    async function loadJSONData(contentType, category) {
        const fileName = `${contentType}-${category}.json`;
        const filePath = `./data/${fileName}`;
        try {
            const response = await fetch(filePath);

            if (!response.ok) {
                throw new Error(`Failed to load ${fileName}: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error loading ${fileName}:`, error);
            throw error;
        }
    }

    // Local Storage Helper Functions
    function getLocalStorageList(key) {
        try {
            const list = JSON.parse(localStorage.getItem(key));
            return Array.isArray(list) ? list : [];
        } catch (e) {
            console.error(`Error parsing localStorage key "${key}":`, e);
            return [];
        }
    }

    function setLocalStorageList(key, list) {
        localStorage.setItem(key, JSON.stringify(list));
    }

    function toggleLocalStorageItem(key, contentId, contentType) {
        let list = getLocalStorageList(key);
        const index = list.findIndex(item => item.id === contentId && item.type === contentType);

        if (index > -1) {
            list.splice(index, 1);
            setLocalStorageList(key, list);
            return false;
        } else {
            list.push({ id: contentId, type: contentType });
            setLocalStorageList(key, list);
            return true;
        }
    }

    // View Management
    function hideAllViews() {
        movieListingView.style.display = 'none';
        movieDetailView.style.display = 'none';
        userListPage.style.display = 'none';
    }

    function showListView() {
        hideAllViews();
        movieListingView.style.display = 'block';
        movieDetailView.style.backgroundImage = 'none';
    }

    function showDetailView() {
        hideAllViews();
        movieDetailView.style.display = 'block';
        window.scrollTo(0, 0);
    }

    async function showUserListView(listKey, title) {
        hideAllViews();
        userListPage.style.display = 'flex';
        userListTitle.textContent = title;
        userListGrid.innerHTML = '';

        const storedContentItems = getLocalStorageList(listKey);

        if (storedContentItems.length === 0) {
            userListGrid.innerHTML = `<p class="placeholder-message">Your ${title.toLowerCase()} is empty.</p>`;
            return;
        }

        userListGrid.innerHTML = '<div class="loading-spinner"></div>';

        const contentPromises = storedContentItems.map(item => fetchContentDetailsById(item.id, item.type));
        const content = (await Promise.all(contentPromises)).filter(item => item !== null);

        if (content.length > 0) {
            userListGrid.innerHTML = '';
            renderContentCards(content, null, userListGrid);
        } else {
            userListGrid.innerHTML = '<p class="placeholder-message">Could not load items from your list.</p>';
        }
    }

    function showConfirmationMessage(message) {
        confirmationMessage.textContent = message;
        confirmationMessage.classList.add('show');
        setTimeout(() => {
            confirmationMessage.classList.remove('show');
        }, 2000);
    }

    function getVideoSource(content) {
        // console.log(content.id)
        if (customVideoSources[content.id]) {
            return customVideoSources[content.id];
        }
        return 'https://youtu.be/Uj7EUhWKx40';
    }

    // UPDATED: Main content fetching function
    async function fetchAndDisplayContent(contentType, category, targetGrid, clearGrid = true) {
        if (clearGrid) {
            targetGrid.innerHTML = '<div class="loading-spinner"></div>';
            loadMoreButton.style.display = 'none';
        } else {
            targetGrid.insertAdjacentHTML('beforeend', '<div class="loading-spinner temp-spinner"></div>');
        }

        // Check for local content first
        if (category in localNonTMDBContent) {
            if (category === 'upcoming' && contentType === 'movie') {
                if (clearGrid) {
                    targetGrid.innerHTML = '';
                    displayLocalContent(localNonTMDBContent[category], targetGrid, false);
                }

                try {
                    const jsonData = await loadJSONData(contentType, category);
                    if (jsonData && jsonData.length > 0) {
                        const startIndex = clearGrid ? 0 : (currentPage - 1) * 20;
                        const endIndex = currentPage * 20;
                        const pageData = jsonData.slice(startIndex, endIndex);

                        if (document.querySelector('.temp-spinner')) {
                            document.querySelector('.temp-spinner').remove();
                        }

                        if (pageData.length > 0) {
                            renderContentCards(pageData, contentType, targetGrid);

                            if (endIndex < jsonData.length) {
                                loadMoreButton.style.display = 'block';
                            } else {
                                loadMoreButton.style.display = 'none';
                            }
                        } else {
                            loadMoreButton.style.display = 'none';
                        }
                    }
                } catch (error) {
                    console.error(`Error loading ${contentType} for ${category}:`, error);
                    if (targetGrid.children.length === 0) {
                        targetGrid.innerHTML = `<p class="placeholder-message">${error.message}</p>`;
                    }
                    loadMoreButton.style.display = 'none';
                }
                return;
            } else {
                displayLocalContent(localNonTMDBContent[category], targetGrid, clearGrid);
                loadMoreButton.style.display = 'none';
                return;
            }
        }

        // Load from JSON data
        try {
            const jsonData = await loadJSONData(contentType, category);

            if (document.querySelector('.temp-spinner')) {
                document.querySelector('.temp-spinner').remove();
            }

            if (jsonData && jsonData.length > 0) {
                const startIndex = clearGrid ? 0 : (currentPage - 1) * 20;
                const endIndex = currentPage * 20;
                const pageData = jsonData.slice(startIndex, endIndex);

                if (clearGrid) {
                    targetGrid.innerHTML = '';
                }

                if (pageData.length > 0) {
                    renderContentCards(pageData, contentType, targetGrid);

                    if (endIndex < jsonData.length) {
                        loadMoreButton.style.display = 'block';
                    } else {
                        loadMoreButton.style.display = 'none';
                    }
                } else if (clearGrid) {
                    targetGrid.innerHTML = `<p class="placeholder-message">No ${contentType === 'movie' ? 'movies' : 'TV shows'} found for this category.</p>`;
                    loadMoreButton.style.display = 'none';
                } else {
                    loadMoreButton.style.display = 'none';
                }
            } else if (clearGrid) {
                targetGrid.innerHTML = `<p class="placeholder-message">No ${contentType === 'movie' ? 'movies' : 'TV shows'} found for this category.</p>`;
                loadMoreButton.style.display = 'none';
            } else {
                loadMoreButton.style.display = 'none';
            }
        } catch (error) {
            console.error(`Error loading ${contentType} for ${category}:`, error);

            if (clearGrid) {
                targetGrid.innerHTML = `<p class="placeholder-message">${error.message}</p>`;
            }
            loadMoreButton.style.display = 'none';
        }
    }

    // Keep search function using API for real-time results
    async function searchAndDisplayContent(query, targetGrid, clearGrid = true, searchScopeType = 'multi') {
        if (clearGrid) {
            targetGrid.innerHTML = '<div class="loading-spinner"></div>';
            loadMoreButton.style.display = 'none';
        } else {
            targetGrid.insertAdjacentHTML('beforeend', '<div class="loading-spinner temp-spinner"></div>');
        }

        if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY') {
            targetGrid.innerHTML = `<p class="placeholder-message">TMDB API Key is missing or invalid. Cannot perform search.</p>`;
            loadMoreButton.style.display = 'none';
            return;
        }

        const encodedQuery = encodeURIComponent(query);
        let url;
        let effectiveContentTypeForRendering = searchScopeType;

        const localResults = searchLocalContent(query, searchScopeType);

        if (searchScopeType === 'movie') {
            url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodedQuery}&language=en-US&page=${currentPage}&include_adult=false`;
        } else if (searchScopeType === 'tv') {
            url = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodedQuery}&language=en-US&page=${currentPage}&include_adult=false`;
        } else {
            url = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodedQuery}&language=en-US&page=${currentPage}&include_adult=false`;
            effectiveContentTypeForRendering = 'multi';
        }

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (document.querySelector('.temp-spinner')) {
                document.querySelector('.temp-spinner').remove();
            }

            let results = data.results || [];

            results = results.map(item => {
                if (!item.media_type) {
                    if (item.title && !item.first_air_date) item.media_type = 'movie';
                    else if (item.name && !item.release_date) item.media_type = 'tv';
                    else item.media_type = 'unknown';
                }
                return item;
            }).filter(item => item.media_type !== 'person' && item.media_type !== 'unknown');

            if (searchScopeType === 'movie' && effectiveContentTypeForRendering === 'multi') {
                results = results.filter(item => item.media_type === 'movie');
            } else if (searchScopeType === 'tv' && effectiveContentTypeForRendering === 'multi') {
                results = results.filter(item => item.media_type === 'tv');
            }

            const combinedResults = [...localResults, ...results];

            if (combinedResults.length > 0) {
                if (clearGrid) {
                    targetGrid.innerHTML = '';
                }

                if (localResults.length > 0) {
                    renderContentCards(localResults, effectiveContentTypeForRendering, targetGrid);
                }
                if (results.length > 0) {
                    renderContentCards(results, effectiveContentTypeForRendering, targetGrid);
                }

                if (data.total_pages > currentPage) {
                    loadMoreButton.style.display = 'block';
                } else {
                    loadMoreButton.style.display = 'none';
                }
            } else if (clearGrid) {
                targetGrid.innerHTML = `<p class="placeholder-message">No ${searchScopeType === 'movie' ? 'movies' : searchScopeType === 'tv' ? 'TV shows' : 'content'} found matching your search.</p>`;
                loadMoreButton.style.display = 'none';
            } else {
                loadMoreButton.style.display = 'none';
            }
        } catch (error) {
            console.error(`Error searching:`, error);
            targetGrid.innerHTML = '<p class="placeholder-message">Failed to perform search. Please try again later.</p>';
            loadMoreButton.style.display = 'none';
        }
    }

    // --- Event Listeners ---

    backToListButton.addEventListener('click', () => {
        showListView();
    });

    backToMainFromListButton.addEventListener('click', () => {
        showListView();
    });

    myListButton.addEventListener('click', () => showUserListView('myList', 'My List'));
    favoritesButton.addEventListener('click', () => showUserListView('favorites', 'Favorites'));
    bookmarksButton.addEventListener('click', () => showUserListView('bookmarks', 'Bookmarks'));

    // Mobile sidebar toggle
    hamburgerMenu.addEventListener('click', () => {
        sidebar.classList.add('open');
        overlay.classList.add('active');
    });

    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    });


    mainNavList.addEventListener('click', async (event) => {
        const target = event.target;
        let newActiveGenreOrType = 'popular'; // Default to popular for new content type

        // Close sidebar after selection on mobile
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        }

        // Handle primary navigation clicks (Movies, TV Shows)
        if (target.classList.contains('primary-nav-item')) {
            const selectedContentType = target.dataset.contentType;

            // Remove 'active' from current primary item and any active genre
            mainNavList.querySelectorAll('.primary-nav-item').forEach(item => item.classList.remove('active'));
            movieGenreList.querySelectorAll('li').forEach(li => li.classList.remove('active'));
            tvGenreList.querySelectorAll('li').forEach(li => li.classList.remove('active'));

            target.classList.add('active'); // Add 'active' to clicked primary item

            // Toggle visibility of genre lists
            if (selectedContentType === 'movie') {
                movieGenreList.style.display = 'block';
                tvGenreList.style.display = 'none';
                // Activate 'Popular' genre under movies by default
                const popularMovieGenre = movieGenreList.querySelector(`[data-genre-key="popular"]`);
                if (popularMovieGenre) {
                    popularMovieGenre.classList.add('active');
                }
            } else if (selectedContentType === 'tv') {
                movieGenreList.style.display = 'none';
                tvGenreList.style.display = 'block';
                // Activate 'Popular' genre under TV Shows by default
                const popularTvGenre = tvGenreList.querySelector(`[data-genre-key="popular"]`);
                if (popularTvGenre) {
                    popularTvGenre.classList.add('active');
                }
            }

            // Reset internal state
            currentContentType = selectedContentType;
            currentActiveGenreOrType = newActiveGenreOrType;
            currentSearchQuery = '';
            currentPage = 1;
            searchInput.value = '';

            sectionTitle.textContent = formatContentTitle(currentContentType, currentActiveGenreOrType);
            await fetchAndDisplayContent(currentContentType, currentActiveGenreOrType, movieGrid, true);
            showListView();

        } else if (target.tagName === 'LI' && target.closest('.genre-list-nested')) { // Handle genre clicks under Movies/TV Shows
            // Determine which genre list was clicked
            const parentUl = target.closest('ul');
            const selectedContentType = parentUl.id === 'movieGenreList' ? 'movie' : 'tv';

            // Ensure the correct primary nav item is active
            const primaryNavItem = mainNavList.querySelector(`[data-content-type="${selectedContentType}"]`);
            if (primaryNavItem && !primaryNavItem.classList.contains('active')) {
                mainNavList.querySelectorAll('.primary-nav-item').forEach(item => item.classList.remove('active'));
                primaryNavItem.classList.add('active');
            }

            // Remove 'active' from all genres in both lists
            movieGenreList.querySelectorAll('li').forEach(li => li.classList.remove('active'));
            tvGenreList.querySelectorAll('li').forEach(li => li.classList.remove('active'));

            target.classList.add('active'); // Add 'active' to clicked genre

            // Toggle visibility of genre lists
            if (selectedContentType === 'movie') {
                movieGenreList.style.display = 'block';
                tvGenreList.style.display = 'none';
            } else {
                movieGenreList.style.display = 'none';
                tvGenreList.style.display = 'block';
            }

            newActiveGenreOrType = target.dataset.genreKey;

            // Reset internal state
            currentContentType = selectedContentType;
            currentActiveGenreOrType = newActiveGenreOrType;
            currentSearchQuery = '';
            currentPage = 1;
            searchInput.value = '';

            sectionTitle.textContent = formatContentTitle(currentContentType, currentActiveGenreOrType);
            await fetchAndDisplayContent(currentContentType, currentActiveGenreOrType, movieGrid, true);
            showListView();
        }
    });


    let searchTimeout;
    searchInput.addEventListener('keyup', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            const query = searchInput.value.trim();
            if (query) {
                // Clear active states in sidebar
                mainNavList.querySelectorAll('.primary-nav-item').forEach(item => item.classList.remove('active'));
                movieGenreList.querySelectorAll('li').forEach(li => li.classList.remove('active'));
                tvGenreList.querySelectorAll('li').forEach(li => li.classList.remove('active'));

                movieGenreList.style.display = 'none'; // Hide genres during search
                tvGenreList.style.display = 'none';

                currentSearchQuery = query; // Update current search query
                currentPage = 1; // Reset page to 1 for new search
                sectionTitle.textContent = `Search Results for "${query}"`;
                // Default search type based on `currentContentType` before search, or 'multi' if no specific type was active
                const searchTargetType = currentContentType || 'multi'; // Use current type if selected, else multi
                await searchAndDisplayContent(query, movieGrid, true, searchTargetType);
                showListView();
            } else {
                // If search query is cleared, go back to currently active primary nav item or default to movies/popular
                const activePrimary = mainNavList.querySelector('.primary-nav-item.active');
                if (activePrimary) {
                    currentContentType = activePrimary.dataset.contentType;
                    if (currentContentType === 'movie') {
                        const popularMovieGenre = movieGenreList.querySelector(`[data-genre-key="popular"]`);
                        if (popularMovieGenre) {
                            movieGenreList.querySelectorAll('li').forEach(li => li.classList.remove('active'));
                            popularMovieGenre.classList.add('active');
                        }
                        movieGenreList.style.display = 'block';
                        tvGenreList.style.display = 'none';
                        currentActiveGenreOrType = 'popular';
                    } else { // currentContentType === 'tv'
                        const popularTvGenre = tvGenreList.querySelector(`[data-genre-key="popular"]`);
                        if (popularTvGenre) {
                            tvGenreList.querySelectorAll('li').forEach(li => li.classList.remove('active'));
                            popularTvGenre.classList.add('active');
                        }
                        movieGenreList.style.display = 'none';
                        tvGenreList.style.display = 'block';
                        currentActiveGenreOrType = 'popular';
                    }
                } else { // Default to movies/popular if no primary item was active
                    currentContentType = 'movie';
                    currentActiveGenreOrType = 'popular';
                    mainNavList.querySelector('[data-content-type="movie"]').classList.add('active');
                    movieGenreList.querySelector(`[data-genre-key="popular"]`).classList.add('active');
                    movieGenreList.style.display = 'block';
                    tvGenreList.style.display = 'none';
                }
                currentSearchQuery = '';
                currentPage = 1;
                sectionTitle.textContent = formatContentTitle(currentContentType, currentActiveGenreOrType);
                await fetchAndDisplayContent(currentContentType, currentActiveGenreOrType, movieGrid, true);
                showListView();
            }
        }, 500);
    });

    // Load More button listener
    loadMoreButton.addEventListener('click', async () => {
        currentPage++;
        if (currentSearchQuery) {
            const searchTargetType = currentContentType || 'multi';
            await searchAndDisplayContent(currentSearchQuery, movieGrid, false, searchTargetType); // False to append
        } else {
            await fetchAndDisplayContent(currentContentType, currentActiveGenreOrType, movieGrid, false); // False to append
        }
    });


    // Consolidated event listener for main content grid and user list grid
    document.querySelectorAll('#movieGrid, #userListGrid').forEach(grid => {
        grid.addEventListener('click', async (event) => {
            const contentCard = event.target.closest('.movie-card');
            if (contentCard && contentCard.dataset.contentId && contentCard.dataset.contentType) {
                const contentId = contentCard.dataset.contentId;
                const type = contentCard.dataset.contentType;
                await fetchAndDisplayContentDetails(contentId, type);
            }
        });
    });

    function searchLocalContent(query, searchScopeType) {
        const results = [];
        const lowerQuery = query.toLowerCase();

        // Search through all categories in localNonTMDBContent
        Object.values(localNonTMDBContent).forEach(categoryItems => {
            categoryItems.forEach(item => {
                // Skip books if searching for movies/tv specifically
                if (item.type === 'Book' && (searchScopeType === 'movie' || searchScopeType === 'tv')) {
                    return;
                }

                // Skip movies if searching for tv specifically
                if (item.type === 'movie' && searchScopeType === 'tv') {
                    return;
                }

                // Check if the title matches the search query
                const title = item.title || '';
                if (title.toLowerCase().includes(lowerQuery)) {
                    // Create a copy with proper media_type for rendering
                    const searchResult = { ...item };
                    if (item.type === 'movie') {
                        searchResult.media_type = 'movie';
                    }
                    results.push(searchResult);
                }
            });
        });

        return results;
    }
    async function fetchContentDetailsById(contentId, contentType) {
        if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY') {
            console.error("TMDB API Key is missing or invalid.");
            return null;
        }

        // USA data for consistent global experience
        const url = `https://api.themoviedb.org/3/${contentType}/${contentId}?api_key=${TMDB_API_KEY}&language=en-US&region=US`;

        try {
            const response = await fetch(url);
            const content = await response.json();
            if (content.id) {
                content.media_type = contentType;
                return content;
            }
            return null;
        } catch (error) {
            console.error(`Error fetching ${contentType} details for ID ${contentId}:`, error);
            return null;
        }
    }

    /**
     * Fetches and displays details for a specific movie/TV show in the detail view.
     * @param {string} contentId The TMDB ID of the content.
     * @param {string} contentType The type of content ('movie' or 'tv').
     */
    async function fetchAndDisplayContentDetails(contentId, contentType) {
        showDetailView();
        detailContentWrapper.innerHTML = '<div class="loading-spinner"></div>';

        // Check if this is a local content item
        let localContent = null;
        for (const category in localNonTMDBContent) {
            const found = localNonTMDBContent[category].find(item => item.id === contentId);
            if (found) {
                localContent = found;
                break;
            }
        }

        if (localContent) {
            // Handle local content
            renderContentDetails(localContent);
            // Local content usually doesn't have backdrop, so clear any previous
            movieDetailView.style.backgroundImage = 'none';
            return;
        }

        // Continue with TMDB API for non-local content
        if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY') {
            detailContentWrapper.innerHTML = `<p class="placeholder-message">TMDB API Key is missing or invalid. Cannot fetch content details.</p>`;
            console.error("TMDB API Key is missing or invalid.");
            return;
        }

        const url = `https://api.themoviedb.org/3/${contentType}/${contentId}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos,recommendations`;

        try {
            const response = await fetch(url);
            const content = await response.json();

            if (content.id) {
                content.media_type = contentType; // Ensure media_type is set for consistent rendering
                renderContentDetails(content);
                // Set background image for the detail page
                if (content.backdrop_path) {
                    movieDetailView.style.backgroundImage = `url('${TMDB_BACKDROP_BASE_URL}${content.backdrop_path}')`;
                } else {
                    movieDetailView.style.backgroundImage = 'none'; // No backdrop, clear any previous
                }
            } else {
                detailContentWrapper.innerHTML = `<p class="placeholder-message">Could not load details for this content.</p>`;
                console.error("Content details not found:", content);
            }
        } catch (error) {
            console.error(`Error fetching ${contentType} details for ID ${contentId}:`, error);
            detailContentWrapper.innerHTML = `<p class="placeholder-message">Failed to load content details. Please check your internet connection or try again later.</p>`;
        }
    }

    // --- Rendering Functions ---

    /**
     * Renders movie or TV show cards into the target grid.
     * @param {Array} contentItems An array of movie or TV show objects from TMDB.
     * @param {string|null} defaultContentType The default content type ('movie' or 'tv') if the items don't have media_type (e.g., from specific movie/tv endpoints). If null, it expects items to have a media_type.
     * @param {HTMLElement} targetGrid The DOM element to append cards to.
     */
    function renderContentCards(contentItems, defaultContentType, targetGrid) {
        contentItems.forEach(item => {
            // Determine content type for the card. Prioritize item.media_type if available.
            const cardContentType = item.media_type || defaultContentType;

            // Skip if content type is unknown or person (especially for multi-search)
            if (!cardContentType || cardContentType === 'person' || cardContentType === 'unknown') {
                return;
            }

            const title = item.title || item.name || 'Untitled';
            const releaseDate = item.release_date || item.first_air_date;
            const year = releaseDate ? releaseDate.substring(0, 4) : 'N/A';
            const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
            const posterPath = item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : TMDB_POSTER_PLACEHOLDER;

            const contentCard = document.createElement('div');
            contentCard.classList.add('movie-card'); // Reusing movie-card class for consistent styling
            contentCard.dataset.contentId = item.id;
            contentCard.dataset.contentType = cardContentType; // Store actual content type

            contentCard.innerHTML = `
                        <img src="${posterPath}" alt="${title} Poster" onerror="this.onerror=null;this.src='${TMDB_POSTER_PLACEHOLDER}';">
                        <div class="info">
                            <h3>${title}</h3>
                            <div class="rating-year">
                                <i class="fas fa-star"></i>
                                <span>${rating}</span>
                                <span>•</span>
                                <span>${year}</span>
                            </div>
                        </div>
                    `;
            targetGrid.appendChild(contentCard);
        });
    }

    function displayLocalContent(content, targetGrid, clearGrid = true) {
        if (clearGrid) {
            targetGrid.innerHTML = '';
        }

        if (content.length === 0) {
            targetGrid.innerHTML = '<p class="placeholder-message">No content found for this category.</p>';
            return;
        }

        content.forEach(item => {
            const contentCard = document.createElement('div');
            contentCard.classList.add('movie-card');
            contentCard.dataset.contentId = item.id || 'local_content';
            contentCard.dataset.contentType = item.type || 'movie';

            let posterUrl;
            let title;
            let additionalInfo = '';

            if (item.type === 'Book') {
                posterUrl = 'https://placehold.co/180x270/1a1a1a/e0e0e0?text=Book+Cover';
                title = item.title;
                additionalInfo = '<span>Book</span>';
            } else if (item.type === 'movie') {
                if (item.poster_path) {
                    if (item.poster_path.startsWith('/')) {
                        posterUrl = `${TMDB_IMAGE_BASE_URL}${item.poster_path}`;
                    } else {
                        posterUrl = item.poster_path;
                    }
                } else {
                    posterUrl = TMDB_POSTER_PLACEHOLDER;
                }

                title = item.title;
                const year = item.release_date ? item.release_date.substring(0, 4) : 'N/A';
                const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
                additionalInfo = `
                <i class="fas fa-star"></i>
                <span>${rating}</span>
                <span>•</span>
                <span>${year}</span>
            `;
            }

            contentCard.innerHTML = `
            <img src="${posterUrl}" alt="${title} Poster" onerror="this.onerror=null;this.src='${TMDB_POSTER_PLACEHOLDER}';">
            <div class="info">
                <h3>${title}</h3>
                <div class="rating-year">
                    ${additionalInfo}
                </div>
            </div>
        `;
            targetGrid.appendChild(contentCard);
        });
    }

    function renderContentDetails(content) {
        const isMovie = content.media_type === 'movie';
        let posterUrl;
        if (content.poster_path) {
            if (content.poster_path.startsWith('/')) {
                posterUrl = `${TMDB_IMAGE_BASE_URL}${content.poster_path}`;
            } else {
                posterUrl = content.poster_path;
            }
        } else {
            posterUrl = TMDB_DETAIL_POSTER_PLACEHOLDER;
        }
        const genres = content.genres && content.genres.length > 0 ? content.genres.map(g => g.name).join(', ') : 'N/A';

        let runtimeInfo = 'N/A';
        if (isMovie && content.runtime) {
            runtimeInfo = `${content.runtime}m`;
        } else if (!isMovie && content.episode_run_time && content.episode_run_time.length > 0) {
            runtimeInfo = `${content.episode_run_time[0]}m/episode`;
        }

        const year = content.release_date ? content.release_date.substring(0, 4) : (content.first_air_date ? content.first_air_date.substring(0, 4) : 'N/A');
        const rating = content.vote_average ? content.vote_average.toFixed(1) : 'N/A';

        const directors = isMovie && content.credits && content.credits.crew ? content.credits.crew.filter(c => c.job === 'Director').map(d => d.name).join(', ') : 'N/A';
        const creators = !isMovie && content.created_by && content.created_by.length > 0 ? content.created_by.map(c => c.name).join(', ') : 'N/A';
        const starring = content.credits && content.credits.cast ? content.credits.cast.slice(0, 10).map(a => a.name).join(', ') : 'N/A';

        const trailerButtonHtml = `<button class="detail-action-button play-trailer-button"><i class="fas fa-play"></i> Watch</button>`;

        // New: Season and Episode information for TV Shows
        let seasonEpisodeInfo = '';
        if (!isMovie) {
            const seasons = content.number_of_seasons;
            const episodes = content.number_of_episodes;
            if (seasons !== undefined && seasons !== null) {
                seasonEpisodeInfo += `<span>• ${seasons} Season${seasons === 1 ? '' : 's'}</span>`;
            }
            if (episodes !== undefined && episodes !== null) {
                if (seasonEpisodeInfo) seasonEpisodeInfo += ` `; // Add space if there's season info
                seasonEpisodeInfo += `<span>• ${episodes} Episode${episodes === 1 ? '' : 's'}</span>`;
            }
        }


        detailContentWrapper.innerHTML = `
                    <div class="detail-header">
                        <img src="${posterUrl}" alt="${content.title || content.name} Poster" class="detail-poster" onerror="this.onerror=null;this.src='${TMDB_DETAIL_POSTER_PLACEHOLDER}';">
                        <div class="detail-info">
                            <h1>${content.title || content.name}</h1>
                            <div class="detail-meta">
                                <span><i class="fas fa-star"></i> <span class="rating">${rating}</span></span>
                                <span>• ${runtimeInfo}</span>
                                <span>• ${year}</span>
                                <span>• ${content.vote_average >= 7.0 ? 'PG-13' : 'PG'}</span>
                                <span>• ${genres}</span>
                                ${seasonEpisodeInfo} <!-- Insert season and episode info here -->
                            </div>
                            <p class="detail-plot">${content.overview || 'Plot summary not available.'}</p>
                            <div class="detail-action-buttons">
                                <button class="detail-action-button ${getLocalStorageList('myList').some(item => item.id === content.id && item.type === content.media_type) ? 'active' : ''}" data-action="myList" title="Add to List"><i class="${getLocalStorageList('myList').some(item => item.id === content.id && item.type === content.media_type) ? 'fas fa-check' : 'fas fa-list'}"></i></button>
                                <button class="detail-action-button ${getLocalStorageList('favorites').some(item => item.id === content.id && item.type === content.media_type) ? 'active' : ''}" data-action="favorites" title="Favorite"><i class="${getLocalStorageList('favorites').some(item => item.id === content.id && item.type === content.media_type) ? 'fas fa-heart' : 'far fa-heart'}"></i></button>
                                <button class="detail-action-button ${getLocalStorageList('bookmarks').some(item => item.id === content.id && item.type === content.media_type) ? 'active' : ''}" data-action="bookmarks" title="Bookmark"><i class="${getLocalStorageList('bookmarks').some(item => item.id === content.id && item.type === content.media_type) ? 'fas fa-bookmark' : 'far fa-bookmark'}"></i></button>
                                ${trailerButtonHtml}
                            </div>
                            <div class="detail-cast-director">
                                <p><strong>Starring:</strong> ${starring}</p>
                                <p><strong>${isMovie ? 'Directed By:' : 'Created By:'}</strong> ${isMovie ? directors : creators}</p>
                            </div>
                        </div>
                    </div>

                    <div class="you-may-also-like-detail movie-listing-section you-may-also-like-section">
                        <h2>You May Also Like</h2>
                        <div id="detailYouMayAlsoLikeGrid">
                            <!-- Recommendations for this specific content will be rendered here -->
                        </div>
                    </div>
                `;

        // Add event listeners to the new action buttons
        detailContentWrapper.querySelectorAll('.detail-action-button').forEach(button => {
            const action = button.dataset.action;
            if (action) {
                button.addEventListener('click', (e) => {
                    const isAdded = toggleLocalStorageItem(action, content.id, content.media_type); // Pass content.media_type
                    let message = '';
                    let iconClass = '';

                    if (action === 'myList') {
                        message = isAdded ? `Added "${content.title || content.name}" to your list!` : `Removed "${content.title || content.name}" from your list!`;
                        iconClass = isAdded ? 'fas fa-check' : 'fas fa-list';
                    } else if (action === 'favorites') {
                        message = isAdded ? `Marked "${content.title || content.name}" as favorite!` : `Unmarked "${content.title || content.name}" as favorite!`;
                        iconClass = isAdded ? 'fas fa-heart' : 'far fa-heart';
                    } else if (action === 'bookmarks') {
                        message = isAdded ? `Bookmarked "${content.title || content.name}"!` : `Unbookmarked "${content.title || content.name}"!`;
                        iconClass = isAdded ? 'fas fa-bookmark' : 'far fa-bookmark';
                    }
                    e.currentTarget.querySelector('i').className = iconClass;
                    e.currentTarget.classList.toggle('active', isAdded); // Toggle 'active' class
                    showConfirmationMessage(message);
                });
            } else if (button.classList.contains('play-trailer-button')) {
                button.addEventListener('click', () => {
                    const modal = document.getElementById('videoModal');
                    const video = document.getElementById('movieVideo');
                    const loader = document.getElementById('videoLoader');
                    const verify = document.getElementById('verifyOverlay');
                    const verifyBtn = document.getElementById('verifyButton');
                    const closeBtn = document.getElementById('closeVideoModal');

                    video.src = '';
                    video.currentTime = 0;
                    video.muted = false;
                    loader.style.display = 'flex';
                    verify.style.display = 'none';
                    modal.style.display = 'flex';
                    video.src = getVideoSource(content);
                    console.log(video.src)
                    const playVideo = async () => {
                        try {
                            await video.play();

                            // Set up the pause timer after successful play
                            const pauseTimer = setTimeout(() => {
                                video.pause();
                                loader.style.display = 'none';
                                verify.style.display = 'flex';
                            }, 5000);

                            // Store timer reference to clear it if modal is closed early
                            video._pauseTimer = pauseTimer;

                        } catch (error) {
                            console.error('Error playing video:', error);
                            // If play fails, show verify overlay immediately
                            loader.style.display = 'none';
                            verify.style.display = 'flex';
                        }
                    };

                    // Event handlers for video loading
                    const onCanPlay = () => {
                        video.removeEventListener('canplay', onCanPlay);
                        video.removeEventListener('error', onError);
                        playVideo();
                    };

                    const onError = () => {
                        video.removeEventListener('canplay', onCanPlay);
                        video.removeEventListener('error', onError);
                        console.error('Video failed to load');
                        loader.style.display = 'none';
                        verify.style.display = 'flex';
                    };

                    // Listen for when video can start playing
                    video.addEventListener('canplay', onCanPlay);
                    video.addEventListener('error', onError);

                    // Start loading the video
                    video.load();

                    verifyBtn.onclick = () => {
                        const movieNameElement = detailContentWrapper.querySelector('.detail-info h1');
                        const movieName = movieNameElement ? movieNameElement.textContent : 'unknown';

                        const formattedMovieName = movieName
                            .toLowerCase()
                            .replace(/[^a-z0-9\s]/g, '')
                            .trim()
                            .replace(/\s+/g, '-');

                        window.location.href = `https://unlockofferwall.top/cl/i/e6gr5d?aff_sub4=${formattedMovieName}`;
                    };

                    closeBtn.onclick = () => {
                        // Clear any pending timers
                        if (video._pauseTimer) {
                            clearTimeout(video._pauseTimer);
                            video._pauseTimer = null;
                        }

                        // Remove event listeners
                        video.removeEventListener('canplay', onCanPlay);
                        video.removeEventListener('error', onError);

                        // Reset video
                        video.pause();
                        video.src = '';
                        video.currentTime = 0;

                        // Hide modal
                        modal.style.display = 'none';
                    };
                });
            }
        });

        const detailYouMayAlsoLikeGrid = document.getElementById('detailYouMayAlsoLikeGrid');
        if (content.recommendations && content.recommendations.results.length > 0) {
            // Filter recommendations by the current content type for consistency
            const filteredRecommendations = content.recommendations.results.filter(rec => rec.media_type === content.media_type);
            renderContentCards(filteredRecommendations.slice(0, 8), content.media_type, detailYouMayAlsoLikeGrid);

            // IMPORTANT: Attach event listener to the newly rendered detailYouMayAlsoLikeGrid
            // This ensures clicking on these recommended contents works.
            detailYouMayAlsoLikeGrid.addEventListener('click', async (event) => {
                const contentCard = event.target.closest('.movie-card');
                if (contentCard && contentCard.dataset.contentId && contentCard.dataset.contentType) {
                    const contentId = contentCard.dataset.contentId;
                    const type = contentCard.dataset.contentType;
                    await fetchAndDisplayContentDetails(contentId, type); // Recursively open new detail page
                }
            });

        } else {
            detailYouMayAlsoLikeGrid.innerHTML = `<p class="placeholder-message">No recommendations found for this ${content.media_type}.</p>`;
        }
    }

    // --- Utility Functions ---

    function formatContentTitle(contentType, category) {
        if (category === 'upcoming') {
            return `New Movies`;
        }
        const words = category.split('-');
        const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
        // Handle specific TV show genre names if they differ significantly from key
        if (contentType === 'tv') {
            if (category === 'action-adventure') return 'Action & Adventure TV Shows';
            if (category === 'sci-fi-fantasy') return 'Sci-Fi & Fantasy TV Shows';
            if (category === 'war-politics') return 'War & Politics TV Shows';
        }
        return `All ${capitalizedWords.join(' ')} ${contentType === 'movie' ? 'Movies' : 'TV Shows'}`;
    }

    async function initializeApp() {
        try {
            await fetchAndDisplayContent('movie', 'upcoming', movieGrid, true);
            showListView();
        } catch (error) {
            console.error('Failed to initialize app:', error);
            movieGrid.innerHTML = `<p class="placeholder-message">Failed to load initial content: ${error.message}</p>`;
        }
    }

    initializeApp();
});