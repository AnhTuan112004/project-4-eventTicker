// --- KHỞI CHẠY KHI TRANG LOAD ---
document.addEventListener('DOMContentLoaded', async function() {
    await initializeHomePage();
});

async function initializeHomePage() {
    await window.pageUtils.loadHeader();
    await loadHomePage();
    setupHomeSearch();
    await loadFooter();
    await applyCategoryFromQuery();
}

function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

async function applyCategoryFromQuery() {
    const category = getQueryParam('category');
    if (!category) return;

    const chips = Array.from(document.querySelectorAll('.category-chip'));
    const selectedChip = chips.find(chip => chip.innerText.trim().toLowerCase() === category.trim().toLowerCase());

    if (selectedChip) {
        selectedChip.click();
    } else {
        await loadEventsByCategory(category);
    }
}

// ==========================================
// 1. CÁC HÀM XỬ LÝ HEADER & FOOTER
// ==========================================
async function loadFooter() {
    try {
        const response = await fetch('/components/footer.html');
        let footerHTML = await response.text();
        const footerContainer = document.getElementById('footer-container');
        if (footerContainer) {
            footerContainer.innerHTML = footerHTML;
        }
    } catch (error) {
        console.error('Lỗi khi load footer:', error);
    }
}

function setupHeaderLogic() {
    const token = window.apiClient ? window.apiClient.getToken() : null;
    const storedUser = localStorage.getItem('currentUser');
    const isLoggedIn = token || storedUser;
    const guestMenu = document.getElementById('guest-menu');
    const userMenu = document.getElementById('user-menu');
    const btnLogout = document.getElementById('btn-logout');

    if (isLoggedIn) {
        if (guestMenu) guestMenu.style.display = 'none';
        if (userMenu) userMenu.style.display = 'flex';
        if (btnLogout) {
            btnLogout.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.apiClient) window.apiClient.clearToken();
                window.location.href = '/index.html';
            });
        }
    } else {
        if (guestMenu) guestMenu.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
}

// ==========================================
// 2. CÁC HÀM XỬ LÝ TRANG CHỦ
// ==========================================
async function loadHomePage() {
    const eventList = document.getElementById('event-list');
    const latestList = document.getElementById('latest-event-list');
    const categoryFilters = document.getElementById('category-filters');

    if (eventList) eventList.innerHTML = '<div style="grid-column: 1 / -1; text-align:center;">Đang tải sự kiện nổi bật...</div>';
    if (latestList) latestList.innerHTML = '<div style="grid-column: 1 / -1; text-align:center;">Đang tải sự kiện mới nhất...</div>';

    try {
        if (!window.apiClient) throw new Error('API Client không khả dụng');
        const data = await window.apiClient.get('/api/nat/public/home');
        if (categoryFilters) renderCategoryFilters(data.categories || [], categoryFilters);
        if (eventList) renderEventCards(data.featuredEvents || [], eventList, 'Không có sự kiện nổi bật.');
        if (latestList) renderEventCards(data.latestEvents || [], latestList, 'Không có sự kiện mới nhất.');
    } catch (error) {
        console.error('Error loading home page data:', error);
        if (eventList) eventList.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; color:red;">Lỗi tải dữ liệu: ${error.message}</div>`;
        if (latestList) latestList.innerHTML = '<div style="grid-column: 1 / -1; text-align:center;">Không thể tải dữ liệu.</div>';
    }
}

function setupHomeSearch() {
    const searchKeyword = document.getElementById('event-search-keyword');
    const searchButton = document.getElementById('btn-search-events');

    if (!searchKeyword || !searchButton) return;

    searchButton.addEventListener('click', async () => {
        const keyword = searchKeyword.value.trim();
        if (!keyword) {
            await loadHomePage();
            return;
        }
        await searchEvents(keyword);
    });

    searchKeyword.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            searchButton.click();
        }
    });
}

async function renderCategoryFilters(categories, container) {
    if (!container) return;
    container.innerHTML = '';

    const allChip = document.createElement('div');
    allChip.className = 'category-chip active';
    allChip.innerText = 'Tất cả';
    allChip.addEventListener('click', async () => {
        document.querySelectorAll('.category-chip').forEach(chip => chip.classList.remove('active'));
        allChip.classList.add('active');
        await loadHomePage();
    });
    container.appendChild(allChip);

    categories.forEach(category => {
        const chip = document.createElement('div');
        chip.className = 'category-chip';
        chip.innerText = category;
        chip.addEventListener('click', async () => {
            document.querySelectorAll('.category-chip').forEach(chip => chip.classList.remove('active'));
            chip.classList.add('active');
            await loadEventsByCategory(category);
        });
        container.appendChild(chip);
    });
}

async function searchEvents(keyword) {
    const eventList = document.getElementById('event-list');
    if (!eventList) return;
    eventList.innerHTML = '<div style="grid-column: 1 / -1; text-align:center;">Đang tìm sự kiện...</div>';

    try {
        if (!window.apiClient) throw new Error('API Client không khả dụng');
        const events = await window.apiClient.get(`/api/nat/public/events/search?keyword=${encodeURIComponent(keyword)}`);
        renderEventCards(events, eventList, 'Không tìm thấy sự kiện phù hợp.');
    } catch (error) {
        console.error('Error searching events:', error);
        eventList.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; color:red;">Lỗi tìm kiếm: ${error.message}</div>`;
    }
}

async function loadEventsByCategory(category) {
    const eventList = document.getElementById('event-list');
    if (!eventList) return;
    eventList.innerHTML = `<div style="grid-column: 1 / -1; text-align:center;">Đang tải sự kiện cho danh mục ${category}...</div>`;

    try {
        if (!window.apiClient) throw new Error('API Client không khả dụng');
        const events = await window.apiClient.get(`/api/nat/public/events/category/${encodeURIComponent(category)}`);
        renderEventCards(events, eventList, `Không có sự kiện trong danh mục ${category}.`);
    } catch (error) {
        console.error('Error loading category events:', error);
        eventList.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; color:red;">Lỗi tải danh mục: ${error.message}</div>`;
    }
}

function renderEventCards(events, container, emptyMessage) {
    if (!container) return;
    if (!events || events.length === 0) {
        container.innerHTML = `<h3 style="text-align:center; width:100%;">${emptyMessage || 'Không có sự kiện nào.'}</h3>`;
        return;
    }

    container.innerHTML = events.map(event => {
        const title = event.name || event.title || event.eventName || 'Chưa cập nhật tên';
        const venue = (event.venue && event.venue.venueName) ? event.venue.venueName : (event.venueName || event.location || 'Chưa cập nhật');
        const eventId = event.eventId || event.id;

        let dateStr = 'Chưa có ngày';
        const rawDate = event.date || event.startTime;
        if (rawDate) {
            dateStr = new Date(rawDate).toLocaleDateString('vi-VN');
        }

        const price = event.minPrice || event.price;
        const priceLabel = price ? new Intl.NumberFormat('vi-VN').format(price) : 'Liên hệ';
        const imgUrl = event.bannerImageUrl || event.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&auto=format&fit=crop';

        return `
            <a href="/pages/user/event-detail.html?id=${eventId}" class="event-card">
                <img src="${imgUrl}" alt="${title}" class="event-img">
                <div class="event-info">
                    <div class="event-meta">
                        <span class="event-location">📍 ${venue}</span>
                        <span class="event-price">VNĐ ${priceLabel}</span>
                    </div>
                    <div class="event-title">${title}</div>
                    <div class="event-meta">📅 ${dateStr}</div>
                </div>
            </a>
        `;
    }).join('');
}

function displayDummyEvents(container) {
    const dummyEvents = [
        { id: 1, title: 'Tour chèo SUP & Camping Hà Nội - Sơn La | Expedition', location: 'Hà Nội', price: '5.850.000 +' },
        { id: 2, title: 'Tour chèo SUP-Trekking & Camping Hà Nội - Hồ Ba Bể', location: 'Hà Nội', price: '2.389.500 +' },
        { id: 3, title: 'Workshop Nấu Ăn Ấn Độ tại Sài Gòn | Benaras cooking', location: 'Hồ Chí Minh', price: '500.000 +' },
        { id: 4, title: 'Private Quốc Thiên In Fantasy show | 16.05.2026 tại Nhà Hát', location: 'Hà Nội', price: '800.000 +' }
    ];

    container.innerHTML = dummyEvents.map(event => `
        <a href="#" class="event-card">
            <img src="https://images.unsplash.com/photo-1470229722913-7c092fb6224d?w=500&auto=format&fit=crop" alt="${event.title}" class="event-img">
            <div class="event-info">
                <div class="event-meta">
                    <span class="event-location">📍 ${event.location}</span>
                    <span class="event-price">VNĐ ${event.price}</span>
                </div>
                <div class="event-title">${event.title}</div>
            </div>
        </a>
    `).join('');
}

// ==========================================
// 2. CÁC HÀM XỬ LÝ SỰ KIỆN
// ==========================================
async function loadEvents() {
    const eventsContainer = document.getElementById('event-list');
    if (!eventsContainer) return;

    eventsContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align:center;">Đang tải sự kiện...</div>';
    
    try {
        if (!window.apiClient) throw new Error("API Client không khả dụng");
        const events = await window.apiClient.get('/api/nat/public/events');
        displayEvents(events, eventsContainer);
    } catch (error) {
        console.error('Error loading events:', error);
        // Hiển thị dummy event nếu API lỗi để demo UI
        displayDummyEvents(eventsContainer);
    }
}

function displayEvents(events, container) {
    if (!events || events.length === 0) {
        displayDummyEvents(container);
        return;
    }

    container.innerHTML = events.map(event => {
        const title = event.title || event.name || event.eventName || 'Chưa cập nhật tên';
        const venue = (event.venue && event.venue.venueName) ? event.venue.venueName : (event.venueName || event.location || 'Chưa cập nhật');
        const eventId = event.eventId || event.id;
        
        let formattedPrice = 'Liên hệ';
        const price = event.minPrice || event.price;
        if (price) {
            formattedPrice = new Intl.NumberFormat('vi-VN').format(price);
        }
        
        const imgUrl = event.bannerImageUrl || event.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&auto=format&fit=crop';

        return `
            <a href="/pages/user/event-detail.html?id=${eventId}" class="event-card">
                <img src="${imgUrl}" alt="${title}" class="event-img">
                <div class="event-info">
                    <div class="event-meta">
                        <span class="event-location"><i class="fas fa-map-marker-alt"></i> ${venue}</span>
                        <span class="event-price">VNĐ ${formattedPrice}</span>
                    </div>
                    <div class="event-title">${title}</div>
                </div>
            </a>
        `;
    }).join('');
}

function displayDummyEvents(container) {
    const dummyEvents = [
        { id: 1, title: 'Tour chèo SUP & Camping Hà Nội - Sơn La | Expedition', location: 'Hà Nội', price: '5.850.000 +' },
        { id: 2, title: 'Tour chèo SUP-Trekking & Camping Hà Nội - Hồ Ba Bể', location: 'Hà Nội', price: '2.389.500 +' },
        { id: 3, title: 'Workshop Nấu Ăn Ấn Độ tại Sài Gòn | Benaras cooking', location: 'Hồ Chí Minh', price: '500.000 +' },
        { id: 4, title: 'Private Quốc Thiên In Fantasy show | 16.05.2026 tại Nhà Hát', location: 'Hà Nội', price: '800.000 +' }
    ];

    container.innerHTML = dummyEvents.map(event => `
        <a href="#" class="event-card">
            <img src="https://images.unsplash.com/photo-1470229722913-7c092fb6224d?w=500&auto=format&fit=crop" alt="${event.title}" class="event-img">
            <div class="event-info">
                <div class="event-meta">
                    <span class="event-location"><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
                    <span class="event-price">VNĐ ${event.price}</span>
                </div>
                <div class="event-title">${event.title}</div>
            </div>
        </a>
    `).join('');
}