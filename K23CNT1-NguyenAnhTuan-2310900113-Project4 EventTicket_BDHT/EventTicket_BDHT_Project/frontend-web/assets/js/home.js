// Home page JavaScript - Load featured events

document.addEventListener('DOMContentLoaded', function() {
    loadEvents();
});

async function loadEvents() {
    try {
        const container = document.getElementById('events-container');
        container.innerHTML = '<p class="loading">Đang tải sự kiện...</p>';
        
        // Public API call - no auth needed
        const response = await fetch('http://localhost:8080/api/public/events');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const events = await response.json();
        displayEvents(events);
        
    } catch (error) {
        console.error('Error loading events:', error);
        const container = document.getElementById('events-container');
        container.innerHTML = `
            <div class="alert alert-error" style="grid-column: 1 / -1;">
                ⚠️ Lỗi tải sự kiện. Vui lòng kiểm tra xem backend đã chạy chưa (http://localhost:8080)
            </div>
        `;
    }
}

function displayEvents(events) {
    const container = document.getElementById('events-container');
    
    if (!events || events.length === 0) {
        container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Không có sự kiện nào</p>';
        return;
    }
    
    container.innerHTML = events.map(event => `
        <div class="grid-item">
            <img 
                src="${event.imageUrl || 'https://via.placeholder.com/280x200?text=Event'}" 
                alt="${event.name}"
                onerror="this.src='https://via.placeholder.com/280x200?text=Event'"
            >
            <div class="grid-item-body">
                <h3 style="margin-top: 0;">${event.name}</h3>
                <p><strong>📍 ${event.venue}</strong></p>
                <p><strong>📅</strong> ${new Date(event.date).toLocaleDateString('vi-VN')}</p>
                <p style="color: #667eea; font-weight: bold;">
                    Giá từ: ${formatPrice(event.minPrice)} VNĐ
                </p>
                <button class="btn" onclick="viewEvent(${event.id})" style="width: 100%; margin-top: 1rem;">
                    Xem Chi Tiết
                </button>
            </div>
        </div>
    `).join('');
}

function viewEvent(eventId) {
    window.location.href = `pages/user/event-detail.html?id=${eventId}`;
}

function formatPrice(price) {
    if (!price) return 'Liên hệ';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

