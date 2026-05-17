document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadPaymentData();
});

async function loadHeader() {
    try {
        const response = await fetch('/components/header.html');
        let headerHTML = await response.text();
        headerHTML = headerHTML.replace(/href="index.html"/g, 'href="/index.html"');
        headerHTML = headerHTML.replace(/href="pages\/user\//g, 'href="/pages/user/');
        document.getElementById('header-container').innerHTML = headerHTML;
        const token = window.apiClient.getToken();
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
                    window.apiClient.clearToken();
                    localStorage.removeItem('currentUser');
                    window.location.href = '/index.html';
                });
            }
        } else {
            if (guestMenu) guestMenu.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
        }
    } catch (error) {
        console.error('Lỗi load header:', error);
    }
}

async function loadPaymentData() {
    const orderId = localStorage.getItem('currentOrderId');
    const paymentInfo = document.getElementById('payment-info');
    const paymentForm = document.getElementById('payment-form');
    const paymentResult = document.getElementById('payment-result');

    if (!paymentInfo || !paymentForm) return;

    if (!orderId) {
        paymentInfo.innerHTML = 'Không tìm thấy đơn hàng thanh toán. Vui lòng quay lại <a href="/pages/user/cart.html" style="color:#007bff;">Giỏ hàng</a> và tạo đơn hàng mới.';
        return;
    }

    try {
        const order = await window.apiClient.get(`/api/vtd/member/orders/${orderId}`);
        paymentInfo.innerHTML = `
            <p><strong>Đơn hàng #${order.orderId || order.id || orderId}</strong></p>
            <p>Trạng thái: ${order.status || order.orderStatus || 'PENDING'}</p>
            <p>Tổng giá trị: ${Number(order.totalAmount || 0).toLocaleString('vi-VN')} VNĐ</p>
        `;
        paymentForm.style.display = 'block';
        paymentForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            paymentResult.style.color = 'blue';
            paymentResult.innerText = 'Đang tạo thanh toán...';
            try {
                const method = document.getElementById('payment-method').value;
                const payment = await window.apiClient.post('/api/vtd/member/payments', {
                    orderId: Number(orderId),
                    paymentMethod: method
                });
                paymentResult.style.color = 'green';
                paymentResult.innerHTML = `Thanh toán thành công. Mã giao dịch: ${payment.paymentId || payment.id || '---'} <br>Trạng thái: ${payment.status || 'Đã tạo'}`;
                localStorage.removeItem('currentOrderId');
            } catch (error) {
                paymentResult.style.color = 'red';
                paymentResult.innerText = 'Thanh toán thất bại: ' + error.message;
            }
        });
    } catch (error) {
        paymentInfo.innerHTML = 'Không thể tải thông tin đơn hàng: ' + error.message;
    }
}
