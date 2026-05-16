// --- KHỞI CHẠY KHI TRANG LOAD ---
document.addEventListener('DOMContentLoaded', function() {
    loadHeader(); // Gọi hàm load menu
    loadEvents(); // Gọi hàm load sự kiện
});

// ==========================================
// 1. CÁC HÀM XỬ LÝ HEADER & ĐĂNG NHẬP
// ==========================================
async function loadHeader() {
    try {
        const response = await fetch('components/header.html');
        const headerHTML = await response.text();
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
    const token = localStorage.getItem('token');
    const guestMenu = document.getElementById('guest-menu');
    const userMenu = document.getElementById('user-menu');
    const btnLogout = document.getElementById('btn-logout');

    if (token) {
        // Đã đăng nhập
        if (guestMenu) guestMenu.style.display = 'none';
        if (userMenu) userMenu.style.display = 'flex';
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                localStorage.removeItem('token');
                window.location.reload(); // Tải lại trang thay vì chuyển hướng
            });
        }
    } else {
        // Chưa đăng nhập
        if (guestMenu) guestMenu.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
}

// ==========================================
// 2. CÁC HÀM XỬ LÝ SỰ KIỆN (TỪ CODE CỦA BẠN)
// ==========================================
async function loadEvents() {
    try {
        const eventsContainer = document.getElementById('events-container') || document.querySelector('main');
        // Thêm trạng thái loading
        eventsContainer.innerHTML = '<p class="loading">Đang tải sự kiện...</p>';
        
        // Gọi API public không cần xác thực
        const response = await fetch('http://localhost:8080/api/public/events');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const events = await response.json();
        displayEvents(events);
    } catch (error) {
        console.error('Error loading events:', error);
        const container = document.getElementById('events-container') || document.querySelector('main');
        container.innerHTML = '<p style="color: red;">Lỗi tải sự kiện. Vui lòng kiểm tra lại Backend.</p>';
    }
}

function displayEvents(events) {
    const container = document.getElementById('events-container') || document.querySelector('main');
    
    // Nếu mảng rỗng (không có sự kiện nào)
    if (!events || events.length === 0) {
        container.innerHTML = '<p>Hiện tại chưa có sự kiện nào sắp diễn ra.</p>';
        return;
    }

    container.innerHTML = `
        <h2>Sự Kiện Nổi Bật</h2>
        <div id="events-list" class="events-grid"></div>
    `;
    
    const eventsList = document.getElementById('events-list');
    
    // Xóa dấu / ở đầu chuỗi 'assets/images/default-event.jpg' để dùng relative path
    eventsList.innerHTML = events.map(event => `
        <div class="event-card">
            <img src="${event.imageUrl || 'assets/images/default-event.jpg'}" alt="${event.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px;">
            <div style="padding: 10px 0;">
                <h3>${event.name}</h3>
                <p>📍 ${event.venue || 'Chưa cập nhật'} <br> 📅 ${new Date(event.date).toLocaleDateString('vi-VN')}</p>
                <p style="color: #e74c3c; font-weight: bold;">Giá vé từ: ${event.minPrice || 'Liên hệ'} VNĐ</p>
                <button class="btn btn-primary" onclick="viewEvent(${event.id})" style="margin-top: 10px; width: 100%;">Chi Tiết</button>
            </div>
        </div>
    `).join('');
}

function viewEvent(eventId) {
    window.location.href = `pages/user/event-detail.html?id=${eventId}`;
}