// --- KHỞI CHẠY KHI TRANG LOAD ---
document.addEventListener('DOMContentLoaded', function() {
    loadHeader(); 
    loadEvents(); 
    loadFooter();
});

// ==========================================
// 1. CÁC HÀM XỬ LÝ HEADER & FOOTER
// ==========================================
async function loadHeader() {
    try {
        const response = await fetch('/components/header.html');
        let headerHTML = await response.text();
        
        headerHTML = headerHTML.replace(/href="index.html"/g, 'href="/index.html"');
        headerHTML = headerHTML.replace(/href="pages\/user\//g, 'href="/pages/user/');

        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            headerContainer.innerHTML = headerHTML;
            setupHeaderLogic();
        }
    } catch (error) {
        console.error('Lỗi khi load header:', error);
    }
}

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
        // Đã đăng nhập
        if (guestMenu) guestMenu.style.display = 'none';
        if (userMenu) userMenu.style.display = 'flex';
        if (btnLogout) {
            btnLogout.addEventListener('click', (e) => {
                e.preventDefault();
                if(window.apiClient) window.apiClient.clearToken();
                localStorage.removeItem('currentUser');
                window.location.href = '/index.html';
            });
        }
    } else {
        // Chưa đăng nhập
        if (guestMenu) guestMenu.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
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