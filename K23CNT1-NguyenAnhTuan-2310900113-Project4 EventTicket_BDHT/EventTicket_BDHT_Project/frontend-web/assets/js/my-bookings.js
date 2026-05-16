// My Bookings Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadMyBookings();
});

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../auth/login.html';
    }
}

async function loadMyBookings() {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('http://localhost:8080/api/user/bookings', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '../auth/login.html';
                return;
            }
            throw new Error('Không thể tải vé của bạn');
        }
        
        const bookings = await response.json();
        displayBookings(bookings);
        
    } catch (error) {
        console.error('Error loading bookings:', error);
        document.getElementById('bookings-container').innerHTML = `
            <div class="alert alert-error" style="grid-column: 1 / -1;">
                ⚠️ Lỗi tải vé: ${error.message}
            </div>
        `;
    }
}

function displayBookings(bookings) {
    const container = document.getElementById('bookings-container');
    
    if (!bookings || bookings.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info" style="grid-column: 1 / -1;">
                📌 Bạn chưa đặt vé nào. <a href="../../index.html" style="color: #667eea;">Xem sự kiện</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = bookings.map(booking => `
        <div class="grid-item">
            <img 
                src="${booking.eventImageUrl || 'https://via.placeholder.com/280x200?text=Booking'}" 
                alt="${booking.eventName}"
                onerror="this.src='https://via.placeholder.com/280x200?text=Booking'"
            >
            <div class="grid-item-body">
                <h3 style="margin-top: 0;">${booking.eventName}</h3>
                <p><strong>🎫 Số Vé:</strong> ${booking.bookingCode}</p>
                <p><strong>📅 Sự Kiện:</strong> ${new Date(booking.eventDate).toLocaleDateString('vi-VN')}</p>
                <p><strong>🎟️ Loại Vé:</strong> ${booking.ticketType}</p>
                <p><strong>💵 Giá Tiền:</strong> ${formatPrice(booking.totalAmount)} VNĐ</p>
                <p>
                    <strong>📊 Trạng Thái:</strong><br>
                    <span class="badge ${getStatusBadge(booking.status)}">
                        ${getStatusText(booking.status)}
                    </span>
                </p>
                <button class="btn" onclick="viewBookingDetail(${booking.id})" style="width: 100%; margin-top: 1rem;">
                    Chi Tiết
                </button>
            </div>
        </div>
    `).join('');
}

function getStatusBadge(status) {
    switch(status) {
        case 'CONFIRMED': return 'badge-success';
        case 'PENDING': return 'badge-warning';
        case 'CANCELLED': return 'badge-error';
        default: return 'badge-success';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'CONFIRMED': return '✅ Xác Nhận';
        case 'PENDING': return '⏳ Chờ Xác Nhận';
        case 'CANCELLED': return '❌ Đã Hủy';
        default: return status;
    }
}

function formatPrice(price) {
    if (!price) return '0';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function viewBookingDetail(bookingId) {
    window.location.href = `booking-detail.html?id=${bookingId}`;
}
