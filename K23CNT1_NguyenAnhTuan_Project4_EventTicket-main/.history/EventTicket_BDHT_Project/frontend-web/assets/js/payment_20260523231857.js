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
        paymentInfo.innerHTML = `Khong tim thay don hang thanh toan. Vui long quay lai <a href="${window.pageUtils.resolveUrl('/pages/user/cart.html')}" style="color:#007bff;">gio hang</a>.`;
        return;
    }

    try {
        const order = await window.apiClient.get(`/api/vtd/member/orders/${orderId}`);
        paymentInfo.innerHTML = `
            <p><strong>Don hang #${order.orderId || orderId}</strong></p>
            <p>Trang thai: ${order.status || 'PENDING'}</p>
            <p>Tong gia tri: ${formatCurrency(order.totalAmount || 0)}</p>
            <p><strong>Can thanh toan: ${formatCurrency(order.finalAmount ?? order.totalAmount ?? 0)}</strong></p>
        `;

        paymentForm.style.display = 'block';
        paymentForm.onsubmit = async (event) => {
            event.preventDefault();
            paymentResult.style.color = 'blue';
            paymentResult.innerText = 'Dang tao giao dich thanh toan...';

            try {
                const method = document.getElementById('payment-method').value;
                const payment = await window.apiClient.post('/api/vtd/member/payments', {
                    orderId: Number(orderId),
                    paymentMethod: method
                });

                paymentResult.innerText = 'Dang xac nhan ket qua giao dich...';

                // Demo gateway: backend chua tich hop MOMO/VNPAY/ZALOPAY that, nen goi webhook SUCCESS
                // de hoan tat order va phat hanh ve dien tu.
                const completed = await window.apiClient.post(`/api/vtd/public/payments/${payment.paymentId}/webhook`, {
                    status: 'SUCCESS',
                    transactionId: `${method}-${Date.now()}`
                });

                paymentResult.style.color = 'green';
                paymentResult.innerHTML = `
                    Thanh toan thanh cong.<br>
                    Ma giao dich: ${payment.paymentId || '---'}<br>
                    Trang thai: ${completed.paymentStatus || 'SUCCESS'}<br>
                    <a href="${window.pageUtils.resolveUrl('/pages/user/profile.html')}" style="color:#007bff;">Xem kho ve dien tu</a>
                `;
                localStorage.removeItem('currentOrderId');
            } catch (error) {
                paymentResult.style.color = 'red';
                paymentResult.innerText = 'Thanh toan that bai: ' + error.message;
            }
        };
    } catch (error) {
        paymentInfo.innerHTML = 'Khong the tai thong tin don hang: ' + error.message;
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount || 0));
}
