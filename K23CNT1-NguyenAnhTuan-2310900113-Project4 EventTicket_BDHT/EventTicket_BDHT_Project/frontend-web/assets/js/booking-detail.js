// Booking Detail Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('id');
    
    if (!bookingId) {
        showAlert('Vé không tồn tại', 'error');
        return;
    }
    
    loadBookingDetail(bookingId);
});

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../auth/login.html';
    }
}

async function loadBookingDetail(bookingId) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:8080/api/user/bookings/${bookingId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Không tìm thấy vé');
        }
        
        const booking = await response.json();
        displayBookingDetail(booking);
        
    } catch (error) {
        console.error('Error loading booking:', error);
        document.getElementById('booking-detail').innerHTML = `
            <div class="alert alert-error">
                ⚠️ Lỗi tải chi tiết vé: ${error.message}
            </div>
        `;
    }
}

function displayBookingDetail(booking) {
    const container = document.getElementById('booking-detail');
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <div>
                <h3>Thông Tin Sự Kiện</h3>
                <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px;">
                    <p><strong>🎫 Tên Sự Kiện:</strong><br>${booking.eventName}</p>
                    <p><strong>📅 Ngày:</strong><br>${new Date(booking.eventDate).toLocaleDateString('vi-VN')}</p>
                    <p><strong>⏰ Giờ:</strong><br>${booking.eventTime || 'Chưa xác định'}</p>
                    <p><strong>📍 Địa Điểm:</strong><br>${booking.eventVenue}</p>
                </div>
            </div>
            
            <div>
                <h3>Thông Tin Vé</h3>
                <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px;">
                    <p><strong>🎟️ Mã Vé:</strong><br><span style="font-size: 1.2rem; color: #667eea; font-weight: bold;">${booking.bookingCode}</span></p>
                    <p><strong>🏷️ Loại Vé:</strong><br>${booking.ticketType}</p>
                    <p><strong>📊 Trạng Thái:</strong><br><span class="badge ${getStatusBadge(booking.status)}">${getStatusText(booking.status)}</span></p>
                    <p><strong>💵 Giá Tiền:</strong><br><span style="font-size: 1.3rem; color: #667eea;">${formatPrice(booking.totalAmount)} VNĐ</span></p>
                </div>
            </div>
        </div>
        
        <div style="margin-top: 2rem;">
            <h3>Thông Tin Người Đặt</h3>
            <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px;">
                <p><strong>👤 Tên:</strong> ${booking.customerName}</p>
                <p><strong>📧 Email:</strong> ${booking.customerEmail}</p>
                <p><strong>📱 Điện Thoại:</strong> ${booking.customerPhone}</p>
            </div>
        </div>
    `;
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

function showAlert(message, type = 'info') {
    const container = document.getElementById('alert-container');
    const alertHtml = `
        <div class="alert alert-${type}">
            ${message}
        </div>
    `;
    container.innerHTML = alertHtml;
}

async function cancelBooking() {
    const confirmed = confirm('Bạn có chắc muốn hủy vé này không?');
    if (!confirmed) return;
    
    try {
        const token = localStorage.getItem('token');
        const urlParams = new URLSearchParams(window.location.search);
        const bookingId = urlParams.get('id');
        
        const response = await fetch(`http://localhost:8080/api/user/bookings/${bookingId}/cancel`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            showAlert(error.message || 'Hủy vé thất bại', 'error');
            return;
        }
        
        showAlert('✅ Vé đã được hủy thành công!', 'success');
        
        setTimeout(() => {
            window.location.href = 'my-bookings.html';
        }, 1500);
        
    } catch (error) {
        console.error('Cancel booking error:', error);
        showAlert('Lỗi kết nối với server', 'error');
    }
}

function goBack() {
    window.history.back();
}
