// API Configuration
const API_CONFIG = {
    OPEN_TRIP_MAP_API_KEY: '5ae2e3f221c38a28845f05b6eabcf5ca2dcc914c2c7c51baa086c589'
};

// Global variables
let map;
let markers = [];
let currentUser = null;
let users = JSON.parse(localStorage.getItem('users')) || [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    initializeNavigation();
    initializeSearch();
    initializeAuth();
    initializeMap();

    // Check if user is already logged in
    checkUserLogin();

    // Perform initial search for New York
    performSearch();
});

// Check if user is logged in
function checkUserLogin() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUIForLoggedInUser();
    }
}

// Update UI when user is logged in
function updateUIForLoggedInUser() {
    document.getElementById('authButtons').style.display = 'none';
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('userName').textContent = currentUser.fullName;
    document.getElementById('userAvatar').textContent = currentUser.fullName.charAt(0).toUpperCase();
}

// Update UI when user logs out
function updateUIForLoggedOutUser() {
    document.getElementById('authButtons').style.display = 'flex';
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('userDashboard').style.display = 'none';
    document.getElementById('home').style.display = 'block';
}

// Initialize navigation between sections
function initializeNavigation() {
    // Navigation links
    const navLinks = document.querySelectorAll('.nav-links a, .footer-links a[data-section]');
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            if (section) {
                showSection(section);
            }
        });
    });

    // Get Started button
    document.getElementById('getStartedBtn').addEventListener('click', function () {
        document.getElementById('authModal').style.display = 'block';
        switchToSignUp();
    });

    // Explore Map button
    document.getElementById('exploreMapBtn').addEventListener('click', function () {
        showSection('explore');
    });

    // Category cards in Explore section
    const categoryCards = document.querySelectorAll('.feature-card[data-category]');
    categoryCards.forEach(card => {
        card.addEventListener('click', function () {
            const category = this.getAttribute('data-category');
            document.getElementById('placeType').value = category;
            showSection('home');
            // Trigger search for this category
            document.getElementById('searchForm').dispatchEvent(new Event('submit'));
        });
    });

    // Back to Home button
    document.getElementById('backToHomeBtn').addEventListener('click', function () {
        showSection('home');
    });

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', function () {
        logoutUser();
    });
}

// Show specific section and hide others
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // Show the selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.style.display = 'block';
    }

    // Update active nav link
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        if (link.getAttribute('data-section') === sectionName) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Initialize authentication
function initializeAuth() {
    const signInBtn = document.getElementById('signInBtn');
    const authModal = document.getElementById('authModal');
    const closeModal = document.getElementById('closeModal');
    const authTabs = document.querySelectorAll('.auth-tab');

    signInBtn.addEventListener('click', function () {
        authModal.style.display = 'block';
        switchToSignIn();
    });

    // Close modal buttons
    closeModal.addEventListener('click', function () {
        document.getElementById('placeDetailsModal').style.display = 'none';
    });

    authTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            authTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            if (this.getAttribute('data-auth-type') === 'signin') {
                switchToSignIn();
            } else {
                switchToSignUp();
            }
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', function (e) {
        if (e.target === authModal) {
            authModal.style.display = 'none';
            clearAuthForms();
        }
        if (e.target === document.getElementById('placeDetailsModal')) {
            document.getElementById('placeDetailsModal').style.display = 'none';
        }
    });

    // Form submissions
    document.getElementById('signInForm').addEventListener('submit', function (e) {
        e.preventDefault();
        handleSignIn();
    });

    document.getElementById('signUpForm').addEventListener('submit', function (e) {
        e.preventDefault();
        handleSignUp();
    });
}

// Switch to Sign In form
function switchToSignIn() {
    document.getElementById('signInForm').style.display = 'block';
    document.getElementById('signUpForm').style.display = 'none';
}

// Switch to Sign Up form
function switchToSignUp() {
    document.getElementById('signInForm').style.display = 'none';
    document.getElementById('signUpForm').style.display = 'block';
}

// Clear authentication forms
function clearAuthForms() {
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('fullName').value = '';
    document.getElementById('signupEmail').value = '';
    document.getElementById('signupPassword').value = '';
    document.getElementById('confirmPassword').value = '';

    // Hide error messages
    const errorElements = document.querySelectorAll('.form-error');
    errorElements.forEach(error => {
        error.style.display = 'none';
    });
}

// Handle user sign up
function handleSignUp() {
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    let isValid = true;

    // Validation
    if (!fullName) {
        document.getElementById('fullNameError').style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('fullNameError').style.display = 'none';
    }

    if (!email || !isValidEmail(email)) {
        document.getElementById('signupEmailError').style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('signupEmailError').style.display = 'none';
    }

    if (!password || password.length < 6) {
        document.getElementById('signupPasswordError').style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('signupPasswordError').style.display = 'none';
    }

    if (password !== confirmPassword) {
        document.getElementById('confirmPasswordError').style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('confirmPasswordError').style.display = 'none';
    }

    if (!isValid) return;

    // Check if user already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        showNotification('User with this email already exists. Please sign in instead.');
        return;
    }

    // Create new user
    const newUser = {
        id: Date.now(),
        fullName,
        email,
        password, // In a real app, this should be hashed
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // Automatically log in the new user
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    showNotification(`Account created successfully! Welcome, ${fullName}`);
    document.getElementById('authModal').style.display = 'none';
    updateUIForLoggedInUser();
    showUserDashboard();
}

// Handle user sign in
function handleSignIn() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    let isValid = true;

    // Validation
    if (!email || !isValidEmail(email)) {
        document.getElementById('emailError').style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('emailError').style.display = 'none';
    }

    if (!password) {
        document.getElementById('passwordError').style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('passwordError').style.display = 'none';
    }

    if (!isValid) return;

    // Find user
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        showNotification('Invalid email or password. Please try again.');
        return;
    }

    // Log in user
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    showNotification(`Welcome back, ${user.fullName}!`);
    document.getElementById('authModal').style.display = 'none';
    updateUIForLoggedInUser();
    showUserDashboard();
}

// Show user dashboard
function showUserDashboard() {
    document.getElementById('home').style.display = 'none';
    document.getElementById('userDashboard').style.display = 'block';
    document.getElementById('dashboardUserName').textContent = currentUser.fullName;
    document.getElementById('dashboardAvatar').textContent = currentUser.fullName.charAt(0).toUpperCase();
}

// Log out user
function logoutUser() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showNotification('You have been logged out successfully.');
    updateUIForLoggedOutUser();
    showSection('home');
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Initialize search functionality
function initializeSearch() {
    // Search tabs
    const searchTabs = document.querySelectorAll('.search-tab');
    searchTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            searchTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            const searchType = this.getAttribute('data-search-type');
            handleSearchTypeChange(searchType);
        });
    });

    // Search form submission
    document.getElementById('searchForm').addEventListener('submit', function (e) {
        e.preventDefault();
        performSearch();
    });
}

// Handle different search types
function handleSearchTypeChange(searchType) {
    const searchForm = document.getElementById('searchForm');

    // Clear the form
    searchForm.innerHTML = '';

    if (searchType === 'basic') {
        // Basic Search Form
        searchForm.innerHTML = `
                    <div class="form-group">
                        <label for="location"><i class="fas fa-map-marker-alt"></i> Location</label>
                        <input type="text" id="location" placeholder="Enter city or address" value="New York">
                    </div>
                    
                    <div class="form-group">
                        <label for="placeType"><i class="fas fa-search"></i> What are you looking for?</label>
                        <select id="placeType">
                            <option value="all">All Places</option>
                            <option value="restaurants">Restaurants</option>
                            <option value="accomodations">Hotels</option>
                            <option value="museums">Museums</option>
                            <option value="interesting_places">Tourist Attractions</option>
                            <option value="religion">Religious Places</option>
                            <option value="amusements">Entertainment</option>
                            <option value="natural">Natural Places</option>
                            <option value="cultural">Cultural Places</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="filters"><i class="fas fa-filter"></i> Filters</label>
                        <select id="filters">
                            <option value="all">All Filters</option>
                            <option value="rating">Top Rated</option>
                            <option value="distance">Nearest</option>
                        </select>
                    </div>
                    
                    <button type="submit" class="search-btn">
                        <i class="fas fa-search"></i> Search
                    </button>
                `;
    } else if (searchType === 'advanced') {
        // Advanced Search Form
        searchForm.innerHTML = `
                    <div class="form-group">
                        <label for="location"><i class="fas fa-map-marker-alt"></i> Location</label>
                        <input type="text" id="location" placeholder="Enter city or address" value="New York">
                    </div>
                    
                    <div class="form-group">
                        <label for="placeType"><i class="fas fa-search"></i> What are you looking for?</label>
                        <select id="placeType">
                            <option value="all">All Places</option>
                            <option value="restaurants">Restaurants</option>
                            <option value="accomodations">Hotels</option>
                            <option value="museums">Museums</option>
                            <option value="interesting_places">Tourist Attractions</option>
                            <option value="religion">Religious Places</option>
                            <option value="amusements">Entertainment</option>
                            <option value="natural">Natural Places</option>
                            <option value="cultural">Cultural Places</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="radius"><i class="fas fa-ruler"></i> Search Radius</label>
                        <select id="radius">
                            <option value="1">1 km</option>
                            <option value="3">3 km</option>
                            <option value="5" selected>5 km</option>
                            <option value="10">10 km</option>
                            <option value="20">20 km</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="rating"><i class="fas fa-star"></i> Minimum Rating</label>
                        <select id="rating">
                            <option value="0">Any Rating</option>
                            <option value="3">3+ Stars</option>
                            <option value="4" selected>4+ Stars</option>
                            <option value="4.5">4.5+ Stars</option>
                        </select>
                    </div>
                    
                    <button type="submit" class="search-btn">
                        <i class="fas fa-search"></i> Search
                    </button>
                `;
    } else if (searchType === 'voice') {
        // Voice Search Form
        searchForm.innerHTML = `
                    <div class="form-group">
                        <label for="voiceLocation"><i class="fas fa-microphone"></i> Voice Search</label>
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="voiceLocation" placeholder="Click microphone to speak" readonly>
                            <button type="button" id="voiceSearchBtn" class="btn" style="background: var(--accent); color: white;">
                                <i class="fas fa-microphone"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="placeType"><i class="fas fa-search"></i> What are you looking for?</label>
                        <select id="placeType">
                            <option value="all">All Places</option>
                            <option value="restaurants">Restaurants</option>
                            <option value="accomodations">Hotels</option>
                            <option value="museums">Museums</option>
                            <option value="interesting_places">Tourist Attractions</option>
                            <option value="religion">Religious Places</option>
                            <option value="amusements">Entertainment</option>
                            <option value="natural">Natural Places</option>
                            <option value="cultural">Cultural Places</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="filters"><i class="fas fa-filter"></i> Filters</label>
                        <select id="filters">
                            <option value="all">All Filters</option>
                            <option value="rating">Top Rated</option>
                            <option value="distance">Nearest</option>
                        </select>
                    </div>
                    
                    <button type="submit" class="search-btn">
                        <i class="fas fa-search"></i> Search
                    </button>
                `;

        document.getElementById('voiceSearchBtn').addEventListener('click', startVoiceSearch);
    } else if (searchType === 'image') {
        // Image Search Form
        searchForm.innerHTML = `
                    <div class="form-group">
                        <label for="imageUpload"><i class="fas fa-image"></i> Image Search</label>
                        <div>
                            <input type="file" id="imageUpload" accept="image/*" style="display: none;">
                            <button type="button" id="uploadImageBtn" class="btn" style="width: 100%; background: var(--secondary); color: white;">
                                <i class="fas fa-upload"></i> Upload Image
                            </button>
                            <div id="imagePreview" style="margin-top: 10px; display: none;">
                                <img id="previewImg" style="max-width: 100%; max-height: 150px; border-radius: 8px;">
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="location"><i class="fas fa-map-marker-alt"></i> Location</label>
                        <input type="text" id="location" placeholder="Enter city or address" value="New York">
                    </div>
                    
                    <div class="form-group">
                        <label for="placeType"><i class="fas fa-search"></i> What are you looking for?</label>
                        <select id="placeType">
                            <option value="all">All Places</option>
                            <option value="restaurants">Restaurants</option>
                            <option value="accomodations">Hotels</option>
                            <option value="museums">Museums</option>
                            <option value="interesting_places">Tourist Attractions</option>
                            <option value="religion">Religious Places</option>
                            <option value="amusements">Entertainment</option>
                            <option value="natural">Natural Places</option>
                            <option value="cultural">Cultural Places</option>
                        </select>
                    </div>
                    
                    <button type="submit" class="search-btn">
                        <i class="fas fa-search"></i> Search
                    </button>
                `;

        document.getElementById('uploadImageBtn').addEventListener('click', function () {
            document.getElementById('imageUpload').click();
        });

        document.getElementById('imageUpload').addEventListener('change', handleImageUpload);
    }

    // Reattach submit event
    document.getElementById('searchForm').addEventListener('submit', function (e) {
        e.preventDefault();
        performSearch();
    });
}

// Perform search based on form inputs
async function performSearch() {
    const searchType = document.querySelector('.search-tab.active').getAttribute('data-search-type');
    let location, placeType, filters;

    if (searchType === 'basic') {
        location = document.getElementById('location').value.trim();
        placeType = document.getElementById('placeType').value;
        filters = document.getElementById('filters').value;
    } else if (searchType === 'advanced') {
        location = document.getElementById('location').value.trim();
        placeType = document.getElementById('placeType').value;
        filters = 'advanced';
    } else if (searchType === 'voice') {
        location = document.getElementById('voiceLocation').value.trim() || "New York";
        placeType = document.getElementById('placeType').value;
        filters = document.getElementById('filters').value;
    } else if (searchType === 'image') {
        location = document.getElementById('location').value.trim();
        placeType = document.getElementById('placeType').value;
        filters = 'image';
    }

    // Show loading spinner
    document.getElementById('searchLoading').style.display = 'block';

    try {
        // Get location coordinates using OpenTripMap API
        const coordinates = await getLocationCoordinates(location);

        if (!coordinates) {
            showNotification('Could not find the specified location. Please try a different location.');
            document.getElementById('searchLoading').style.display = 'none';
            return;
        }

        // Search for places using OpenTripMap API
        const places = await searchPlaces(coordinates.lat, coordinates.lon, placeType);

        // Filter places based on search type
        let filteredPlaces = places;

        if (placeType !== 'all') {
            filteredPlaces = places.filter(place =>
                place.kinds && place.kinds.includes(placeType)
            );
        }

        if (filters === 'rating') {
            filteredPlaces = filteredPlaces.filter(place => place.rate && place.rate >= '4');
        }

        // Display results
        displayResults(filteredPlaces, location);
        updateMapWithResults(filteredPlaces, coordinates);

        // Show a notification
        showNotification(`Found ${filteredPlaces.length} places in ${location} using ${searchType} search`);

    } catch (error) {
        console.error('Search error:', error);
        showNotification('Error performing search. Please try again.');
    } finally {
        document.getElementById('searchLoading').style.display = 'none';
    }
}

// Get coordinates for a location using OpenTripMap API
async function getLocationCoordinates(location) {
    try {
        const response = await fetch(`https://api.opentripmap.com/0.1/en/places/geoname?name=${encodeURIComponent(location)}&apikey=${API_CONFIG.OPEN_TRIP_MAP_API_KEY}`);
        const data = await response.json();

        if (data.lat && data.lon) {
            return { lat: data.lat, lon: data.lon };
        } else {
            // Fallback to geocoding with a different service
            return await geocodeLocation(location);
        }
    } catch (error) {
        console.error('Error getting coordinates:', error);
        return await geocodeLocation(location);
    }
}

// Fallback geocoding function
async function geocodeLocation(location) {
    try {
        // Using OpenStreetMap Nominatim as a fallback
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
        const data = await response.json();

        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
    } catch (error) {
        console.error('Error geocoding location:', error);
    }

    return null;
}

// Search for places using OpenTripMap API
async function searchPlaces(lat, lon, placeType) {
    try {
        const radius = 10000; // 10km radius
        const kinds = placeType === 'all' ? 'interesting_places' : placeType;

        const response = await fetch(`https://api.opentripmap.com/0.1/en/places/radius?radius=${radius}&lon=${lon}&lat=${lat}&kinds=${kinds}&apikey=${API_CONFIG.OPEN_TRIP_MAP_API_KEY}`);
        const data = await response.json();

        if (data && data.features) {
            // Get detailed information for each place
            const placesWithDetails = await Promise.all(
                data.features.slice(0, 20).map(async (feature) => {
                    try {
                        const detailResponse = await fetch(`https://api.opentripmap.com/0.1/en/places/xid/${feature.properties.xid}?apikey=${API_CONFIG.OPEN_TRIP_MAP_API_KEY}`);
                        const detailData = await detailResponse.json();
                        return {
                            ...feature.properties,
                            ...detailData,
                            coordinates: feature.geometry.coordinates
                        };
                    } catch (error) {
                        console.error('Error getting place details:', error);
                        return feature.properties;
                    }
                })
            );

            return placesWithDetails;
        }

        return [];
    } catch (error) {
        console.error('Error searching places:', error);
        return [];
    }
}

// Display search results
function displayResults(places, location) {
    const resultsGrid = document.getElementById('resultsGrid');
    resultsGrid.innerHTML = '';

    if (places.length === 0) {
        resultsGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; padding: 2rem;">No results found. Try a different search.</p>';
        return;
    }

    places.forEach(place => {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.setAttribute('data-place-id', place.xid || place.id);

        // Determine icon based on place type
        let icon = '🏢';
        let categoryText = 'Place';

        if (place.kinds) {
            if (place.kinds.includes('restaurant') || place.kinds.includes('foods')) {
                icon = '🍽️';
                categoryText = 'Restaurant';
            } else if (place.kinds.includes('accomodations')) {
                icon = '🏨';
                categoryText = 'Hotel';
            } else if (place.kinds.includes('museums')) {
                icon = '🏛️';
                categoryText = 'Museum';
            } else if (place.kinds.includes('religion')) {
                icon = '⛪';
                categoryText = 'Religious';
            } else if (place.kinds.includes('amusements')) {
                icon = '🎭';
                categoryText = 'Entertainment';
            } else if (place.kinds.includes('natural')) {
                icon = '🌳';
                categoryText = 'Natural';
            } else if (place.kinds.includes('cultural')) {
                icon = '🎨';
                categoryText = 'Cultural';
            }
        }

        // Get image URL or use placeholder
        const imageUrl = place.preview ? place.preview.source : `https://images.unsplash.com/photo-1542744095-291d1f67b221?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`;

        // Format address
        const address = place.address ? `${place.address.road}, ${place.address.city || location}` : location;

        // Format rating
        const rating = place.rate ? parseFloat(place.rate).toFixed(1) : 'N/A';

        card.innerHTML = `
                    <div class="result-image" style="background-image: url('${imageUrl}')">
                        <div class="result-image-overlay">
                            ${icon}
                        </div>
                    </div>
                    <div class="result-content">
                        <div class="result-header">
                            <h3 class="result-title">${place.name || 'Unnamed Place'}</h3>
                            ${rating !== 'N/A' ? `<div class="result-rating">
                                <i class="fas fa-star"></i> ${rating}
                            </div>` : ''}
                        </div>
                        <span class="result-category">${categoryText}</span>
                        <div class="result-details">
                            <p>${address}</p>
                            <p>${place.wikipedia_extracts ? place.wikipedia_extracts.text.substring(0, 100) + '...' : 'No description available'}</p>
                        </div>
                        <div class="result-meta">
                            <span><i class="fas fa-map-marker-alt"></i> ${location}</span>
                            <span><i class="fas fa-tag"></i> ${categoryText}</span>
                        </div>
                    </div>
                `;

        // Add click event to show details
        card.addEventListener('click', function () {
            showPlaceDetails(place, location);
        });

        resultsGrid.appendChild(card);
    });
}

// Show place details in modal
function showPlaceDetails(place, location) {
    document.getElementById('modalPlaceName').textContent = place.name || 'Unnamed Place';

    // Set description
    const description = place.wikipedia_extracts ?
        place.wikipedia_extracts.text :
        (place.info ? place.info.descr : 'No description available for this place.');
    document.getElementById('modalPlaceDescription').textContent = description;

    // Set address
    const address = place.address ?
        `${place.address.road}, ${place.address.city || location}, ${place.address.country || ''}` :
        location;
    document.getElementById('modalPlaceAddress').textContent = address;

    // Set contact info
    const contact = place.contacts && place.contacts.phone ?
        `Phone: ${place.contacts.phone}` :
        'Contact information not available';
    document.getElementById('modalPlaceContact').textContent = contact;

    // Set image
    const imageUrl = place.preview ? place.preview.source : `https://images.unsplash.com/photo-1542744095-291d1f67b221?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`;
    const placeImage = document.getElementById('modalPlaceImage');
    placeImage.style.backgroundImage = `url('${imageUrl}')`;

    // Set features
    const featuresContainer = document.getElementById('modalPlaceFeatures');
    featuresContainer.innerHTML = '';

    if (place.kinds) {
        const kinds = place.kinds.split(',').slice(0, 5);
        kinds.forEach(kind => {
            const featureTag = document.createElement('span');
            featureTag.className = 'feature-tag';
            featureTag.textContent = kind.replace(/_/g, ' ');
            featuresContainer.appendChild(featureTag);
        });
    }

    // Set up directions button
    document.getElementById('getDirectionsBtn').onclick = function () {
        openDirections(address);
    };

    // Show the modal
    document.getElementById('placeDetailsModal').style.display = 'block';
}

// Initialize Leaflet Map
function initializeMap() {
    // Create a map centered on New York
    map = L.map('map').setView([40.7128, -74.0060], 12);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add a marker for New York
    L.marker([40.7128, -74.0060]).addTo(map)
        .bindPopup('New York City')
        .openPopup();
}

// Update map with search results
function updateMapWithResults(places, coordinates) {
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    // Center map on search location
    map.setView([coordinates.lat, coordinates.lon], 13);

    // Add markers for each place
    places.forEach((place, index) => {
        if (place.coordinates && place.coordinates.length === 2) {
            // Note: OpenTripMap returns coordinates as [lon, lat]
            const marker = L.marker([place.coordinates[1], place.coordinates[0]]).addTo(map);

            // Create custom icon based on place type
            let iconColor = '#4285f4'; // Default blue
            if (place.kinds && place.kinds.includes('restaurant')) iconColor = '#ea4335'; // Red
            if (place.kinds && place.kinds.includes('accomodations')) iconColor = '#34a853'; // Green
            if (place.kinds && place.kinds.includes('museums')) iconColor = '#fbbc05'; // Yellow

            // Create a custom icon
            const customIcon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="background: ${iconColor}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">${index + 1}</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            marker.setIcon(customIcon);

            // Add popup
            marker.bindPopup(`
                        <div style="padding: 10px; max-width: 200px;">
                            <h3 style="margin: 0 0 5px 0; color: #333;">${place.name || 'Unnamed Place'}</h3>
                            <p style="margin: 0 0 5px 0; color: #666;">${place.address ? place.address.road : 'Address not available'}</p>
                            <p style="margin: 0; color: #666;">Rating: ${place.rate || 'N/A'}/5</p>
                            <button onclick="document.querySelector('[data-place-id=\"${place.xid || place.id}\"]').click()" 
                                    style="margin-top: 10px; padding: 5px 10px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                View Details
                            </button>
                        </div>
                    `);

            markers.push(marker);
        }
    });
}

// Open directions in Google Maps
function openDirections(destination) {
    const searchType = document.querySelector('.search-tab.active').getAttribute('data-search-type');
    let origin;

    if (searchType === 'basic' || searchType === 'advanced' || searchType === 'image') {
        origin = document.getElementById('location').value || 'New York';
    } else if (searchType === 'voice') {
        origin = document.getElementById('voiceLocation').value || 'New York';
    }

    const url = `https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}`;
    window.open(url, '_blank');
}

// Voice search functionality
function startVoiceSearch() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Your browser does not support voice recognition. Please use Chrome or Edge.');
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    // Add listening animation
    const voiceBtn = document.getElementById('voiceSearchBtn');
    voiceBtn.classList.add('voice-listening');

    recognition.start();

    recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        document.getElementById('voiceLocation').value = transcript;
        recognition.stop();
        voiceBtn.classList.remove('voice-listening');
        showNotification(`Voice search: "${transcript}"`);
    };

    recognition.onerror = function (event) {
        console.error('Speech recognition error', event.error);
        recognition.stop();
        voiceBtn.classList.remove('voice-listening');
        showNotification('Voice recognition failed. Please try again.');
    };

    recognition.onend = function () {
        voiceBtn.classList.remove('voice-listening');
        console.log('Speech recognition ended');
    };
}

// Handle image upload for image search
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const imagePreview = document.getElementById('imagePreview');
            const previewImg = document.getElementById('previewImg');

            previewImg.src = e.target.result;
            imagePreview.style.display = 'block';

            // In a real app, you would upload the image and process it
            // For demo, we'll just show a notification
            showNotification('Image uploaded for search. Analyzing...');

            // Simulate processing delay
            setTimeout(() => {
                showNotification('Image analysis complete! Searching for similar places...');
                // Trigger search after image analysis
                document.getElementById('searchForm').dispatchEvent(new Event('submit'));
            }, 2000);
        };
        reader.readAsDataURL(file);
    }
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #34a853;
                color: white;
                padding: 15px 20px;
                border-radius: 4px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                max-width: 300px;
                animation: slideIn 0.3s, slideOut 0.3s 2.7s;
            `;

    notification.textContent = message;

    // Add styles for animation
    const style = document.createElement('style');
    style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            document.body.removeChild(notification);
        }
    }, 3000);
}