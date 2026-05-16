// Checkout Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadBookingData();
    loadUserInfo();
    
    // Toggle card payment fields
    document.getElementById('paymentMethod').addEventListener('change', function(e) {
        const cardFields = document.getElementById('card-fields');
        cardFields.style.display = e.target.value === 'CREDIT_CARD' ? 'block' : 'none';
    });
});

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../auth/login.html';
    }
}

function loadUserInfo() {
    const userName = localStorage.getItem('userName');
    if (userName) {
        document.getElementById('fullname').value = userName;
    }
}

function loadBookingData() {
    const bookingData = JSON.parse(localStorage.getItem('bookingData'));
    
    if (!bookingData) {
        showAlert('Không tìm thấy thông tin đơn hàng', 'error');
        return;
    }
    
    displayOrderSummary(bookingData);
}

function displayOrderSummary(bookingData) {
    const container = document.getElementById('order-summary');
    
    const itemsHtml = Object.entries(bookingData.tickets).map(([ticketId, item]) => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
            <span>Vé (ID: ${ticketId}) x${item.quantity}</span>
            <strong>${formatPrice(item.price * item.quantity)} VNĐ</strong>
        </div>
    `).join('');
    
    container.innerHTML = `
        <div style="border-bottom: 1px solid #ddd; padding-bottom: 1rem; margin-bottom: 1rem;">
            ${itemsHtml}
        </div>
        
        <div style="display: flex; justify-content: space-between; font-size: 1.1rem;">
            <strong>Tổng Cộng:</strong>
            <strong style="color: #667eea;">${formatPrice(bookingData.totalPrice)} VNĐ</strong>
        </div>
    `;
}

async function handlePayment(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('token');
    const bookingData = JSON.parse(localStorage.getItem('bookingData'));
    
    if (!bookingData) {
        showAlert('Không tìm thấy thông tin đơn hàng', 'error');
        return;
    }
    
    const formData = {
        fullname: document.getElementById('fullname').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        paymentMethod: document.getElementById('paymentMethod').value,
        eventId: bookingData.eventId,
        tickets: bookingData.tickets,
        totalAmount: bookingData.totalPrice
    };
    
    // Thêm thông tin thẻ nếu chọn thanh toán bằng thẻ
    if (formData.paymentMethod === 'CREDIT_CARD') {
        formData.cardNumber = document.getElementById('cardNumber').value;
        formData.expiryDate = document.getElementById('expiryDate').value;
        formData.cvv = document.getElementById('cvv').value;
    }
    
    try {
        // Gọi API tạo đơn hàng
        const response = await fetch('http://localhost:8080/api/user/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            showAlert(error.message || 'Thanh toán thất bại', 'error');
            return;
        }
        
        const result = await response.json();
        
        // Xóa booking data từ localStorage
        localStorage.removeItem('bookingData');
        
        showAlert('✅ Thanh toán thành công! Đơn hàng của bạn đã được tạo.', 'success');
        
        // Chuyển hướng đến trang xem vé
        setTimeout(() => {
            window.location.href = 'my-bookings.html';
        }, 2000);
        
    } catch (error) {
        console.error('Payment error:', error);
        showAlert('Lỗi kết nối với server. Vui lòng thử lại.', 'error');
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

function goBack() {
    window.history.back();
}
