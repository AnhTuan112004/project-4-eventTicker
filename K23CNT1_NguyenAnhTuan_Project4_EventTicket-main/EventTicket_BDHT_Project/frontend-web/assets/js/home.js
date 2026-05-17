// --- KHỞI CHẠY KHI TRANG LOAD ---
document.addEventListener('DOMContentLoaded', function() {
    loadHeader(); 
    loadEvents(); 
});

// ==========================================
// 1. CÁC HÀM XỬ LÝ HEADER 
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

function setupHeaderLogic() {
    const token = window.apiClient.getToken();
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
                window.apiClient.clearToken(); 
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
    const eventsContainer = document.getElementById('event-list') || document.getElementById('events-container');
    if (!eventsContainer) return;

    eventsContainer.innerHTML = '<h3 style="text-align:center; width:100%;">Đang tải sự kiện...</h3>';
    
    try {
        const events = await window.apiClient.get('/api/vtd/public/events');
        displayEvents(events, eventsContainer);
    } catch (error) {
        console.error('Error loading events:', error);
        eventsContainer.innerHTML = `<h3 style="color: red; text-align:center; width:100%;">Lỗi tải sự kiện: ${error.message}</h3>`;
    }
}

function displayEvents(events, container) {
    if (!events || events.length === 0) {
        container.innerHTML = '<h3 style="text-align:center; width:100%;">Hiện tại chưa có sự kiện nào sắp diễn ra.</h3>';
        return;
    }

    container.innerHTML = events.map(event => {
        const title = event.name || event.eventName || 'Chưa cập nhật tên';
        const venue = event.venue || event.venueName || event.location || 'Chưa cập nhật';
        const eventId = event.id || event.eventId;
        
        let dateStr = 'Chưa có ngày';
        const rawDate = event.date || event.startTime;
        if (rawDate) {
            dateStr = new Date(rawDate).toLocaleDateString('vi-VN');
        }

        const imgUrl = event.imageUrl || 'https://via.placeholder.com/400x250?text=Sự+kiện';

        return `
            <div class="event-card">
                <img src="${imgUrl}" alt="${title}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px;">
                <div style="padding: 10px 0;">
                    <h3>${title}</h3>
                    <p>📍 ${venue} <br> 📅 ${dateStr}</p>
                    <p style="color: #e74c3c; font-weight: bold;">Giá vé từ: ${event.minPrice || event.price || 'Liên hệ'} VNĐ</p>
                    <button class="btn-buy" onclick="viewEvent(${eventId})" style="margin-top: 10px; width: 100%; cursor: pointer;">Chi Tiết & Mua vé</button>
                </div>
            </div>
        `;
    }).join('');
}

window.viewEvent = function(eventId) {
    window.location.href = `/pages/user/event-detail.html?id=${eventId}`;
}