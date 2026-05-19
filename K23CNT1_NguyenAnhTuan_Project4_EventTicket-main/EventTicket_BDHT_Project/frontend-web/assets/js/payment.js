document.addEventListener('DOMContentLoaded', () => {
    window.pageUtils.loadHeader();
    loadPaymentData();
});

async function loadPaymentData() {
    const orderId = localStorage.getItem('currentOrderId');
    const paymentInfo = document.getElementById('payment-info');
    const paymentForm = document.getElementById('payment-form');
    const paymentResult = document.getElementById('payment-result');

    if (!paymentInfo || !paymentForm) return;

    if (!orderId) {
        paymentInfo.innerHTML = `Không tìm thấy đơn hàng thanh toán. Vui lòng quay lại <a href="${window.pageUtils.resolveUrl('/pages/user/cart.html')}" style="color:#007bff;">Giỏ hàng</a> và tạo đơn hàng mới.`;
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
