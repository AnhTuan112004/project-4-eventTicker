const CHECKOUT_STORAGE_KEY = 'checkoutData';

// ====== STATE ======
const state = {
    checkout: null,
    promo: {
        applied: false,
        code: null,
        discountAmount: 0,
    },
    countdownInterval: null
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Kiểm tra xem có phải là callback từ VNPay/MoMo trả về không
    if (checkPaymentCallback()) {
        return; // Đã xử lý webhook/callback, không init luồng đặt vé
    }

    // 2. Khởi tạo trang thanh toán bình thường
    initPaymentPage();
});

// ==========================================
// 1. KIỂM TRA CALLBACK TỪ CỔNG THANH TOÁN
// ==========================================
function checkPaymentCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const vnpResponse = urlParams.get('vnp_ResponseCode');
    const momoStatus = urlParams.get('message') || urlParams.get('resultCode');
    
    // Nếu có mã trả về thành công từ VNPay (00) hoặc MoMo (0) hoặc param tự chế
    if (vnpResponse === '00' || momoStatus === 'Success' || momoStatus === '0' || urlParams.get('status') === 'SUCCESS') {
        
        // Mở modal thành công
        const modal = document.getElementById('payment-success-modal');
        const modalContent = document.getElementById('success-modal-content');
        if (modal && modalContent) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            // Timeout nhỏ để tạo hiệu ứng chuyển động
            setTimeout(() => {
                modalContent.classList.remove('scale-95', 'opacity-0');
                modalContent.classList.add('scale-100', 'opacity-100');
            }, 10);
        }

        // Xóa giỏ hàng để tránh người dùng quay lại (Back)
        sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
        return true;
    }
    
    return false;
}

// ==========================================
// 2. KHỞI TẠO TRANG
// ==========================================
function initPaymentPage() {
    // Đọc giỏ hàng từ sessionStorage (ưu tiên) hoặc localStorage (dự phòng nếu user chưa refresh cache)
    let rawData = sessionStorage.getItem(CHECKOUT_STORAGE_KEY) || localStorage.getItem('pendingCheckout');
    if (!rawData) {
        showMissingCheckoutAndRedirect();
        return;
    }

    try {
        state.checkout = JSON.parse(rawData);
        if (!state.checkout || !state.checkout.items || state.checkout.items.length === 0) {
            throw new Error('Giỏ hàng trống');
        }
    } catch (e) {
        showMissingCheckoutAndRedirect();
        return;
    }

    // Auto-fill thông tin User nếu đã login
    autoFillUserInfo();

    // Render thông tin đơn hàng
    renderOrderSummary();

    // Bắt đầu đếm ngược 15 phút
    startCountdown(15 * 60);

    // Gán các Event Listeners
    setupEvents();
}

function showMissingCheckoutAndRedirect() {
    alert('Không tìm thấy thông tin đơn hàng hoặc phiên giao dịch đã hết hạn. Vui lòng chọn lại vé!');
    window.location.href = '../index.html';
}

function autoFillUserInfo() {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
        try {
            const user = JSON.parse(userJson);
            const nameInput = document.getElementById('cust-name');
            const phoneInput = document.getElementById('cust-phone');
            const emailInput = document.getElementById('cust-email');

            if (nameInput && user.fullName) nameInput.value = user.fullName;
            if (phoneInput && user.phoneNumber) phoneInput.value = user.phoneNumber;
            if (emailInput && user.email) emailInput.value = user.email;
        } catch (e) {}
    }
}

// ==========================================
// 3. HIỂN THỊ TÓM TẮT ĐƠN HÀNG
// ==========================================
function renderOrderSummary() {
    const checkout = state.checkout;

    // Tên sự kiện
    const eventNameEl = document.getElementById('summary-event-name');
    if (eventNameEl) {
        eventNameEl.innerText = checkout.eventName || 'Sự kiện';
    }

    // Danh sách vé
    const listEl = document.getElementById('summary-ticket-list');
    if (listEl) {
        listEl.innerHTML = checkout.items.map(item => `
            <div class="flex items-start justify-between gap-4">
                <div class="flex flex-col">
                    <span class="text-sm font-extrabold text-slate-800">${item.typeName || 'Vé'}</span>
                    <span class="text-[11px] font-bold text-slate-500">Số lượng: ${item.quantity}</span>
                </div>
                <div class="text-sm font-black text-slate-900">${formatCurrency(item.subtotal)}</div>
            </div>
        `).join('');
    }

    updateTotalDisplay();
}

function updateTotalDisplay() {
    const checkout = state.checkout;
    const subtotal = checkout.totalAmount || 0;
    const discount = state.promo.discountAmount || 0;
    const finalTotal = Math.max(subtotal - discount, 0);

    const subEl = document.getElementById('summary-subtotal');
    const discRow = document.getElementById('summary-discount-row');
    const discEl = document.getElementById('summary-discount');
    const totEl = document.getElementById('summary-total');

    if (subEl) subEl.innerText = formatCurrency(subtotal);
    if (totEl) totEl.innerText = formatCurrency(finalTotal);

    if (discRow && discEl) {
        if (discount > 0) {
            discRow.style.display = 'flex';
            discEl.innerText = '-' + formatCurrency(discount);
        } else {
            discRow.style.display = 'none';
        }
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// ==========================================
// 4. TIMER ĐẾM NGƯỢC
// ==========================================
function startCountdown(durationInSeconds) {
    const timerEl = document.getElementById('countdown-timer');
    if (!timerEl) return;

    let timer = durationInSeconds;
    
    clearInterval(state.countdownInterval);
    
    state.countdownInterval = setInterval(() => {
        let minutes = parseInt(timer / 60, 10);
        let seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        timerEl.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            clearInterval(state.countdownInterval);
            timerEl.textContent = "00:00";
            timerEl.classList.remove('text-red-600');
            timerEl.classList.add('text-slate-400');
            
            alert('Đã hết thời gian giữ vé. Vui lòng đặt lại!');
            sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
            localStorage.removeItem('pendingCheckout');
            window.location.href = '../index.html';
        }
    }, 1000);
}

// ==========================================
// 5. GÁN EVENT LISTENERS
// ==========================================
function setupEvents() {
    const applyPromoBtn = document.getElementById('btn-apply-promo');
    const removePromoBtn = document.getElementById('btn-remove-promo');
    const confirmBtn = document.getElementById('btn-confirm-payment');
    const confirmQrBtn = document.getElementById('btn-confirm-qr-paid');
    const cancelQrBtn = document.getElementById('btn-cancel-qr');

    if (applyPromoBtn) {
        applyPromoBtn.addEventListener('click', handleApplyPromo);
    }
    
    if (removePromoBtn) {
        removePromoBtn.addEventListener('click', handleRemovePromo);
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', handleSubmitPayment);
    }
    
    if (confirmQrBtn) {
        confirmQrBtn.addEventListener('click', handleConfirmQrPaid);
    }
    
    if (cancelQrBtn) {
        cancelQrBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }
}

// ==========================================
// 6. LOGIC MÃ GIẢM GIÁ
// ==========================================
async function handleApplyPromo() {
    const inputEl = document.getElementById('promo-code-input');
    const statusEl = document.getElementById('promo-status');
    const code = inputEl.value.trim().toUpperCase();

    if (!code) {
        showPromoStatus('Vui lòng nhập mã giảm giá', 'error');
        return;
    }

    const applyBtn = document.getElementById('btn-apply-promo');
    const oldText = applyBtn.innerHTML;
    applyBtn.disabled = true;
    applyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        // Trong trường hợp thật, bạn gọi API lấy mức giảm:
        // const response = await window.apiClient.post(`/api/vtd/public/promotions/calculate-discount`, { code, amount: state.checkout.totalAmount });
        
        // Mock UI Logic: Mã VIP giảm 10%
        await new Promise(resolve => setTimeout(resolve, 500)); // Giả lập mạng
        
        let discount = 0;
        if (code === 'VIP2026' || code === 'BDHT2026') {
            discount = state.checkout.totalAmount * 0.1; // Giảm 10%
        } else {
            throw new Error('Mã giảm giá không hợp lệ hoặc đã hết hạn');
        }

        // Thành công
        state.promo.applied = true;
        state.promo.code = code;
        state.promo.discountAmount = discount;

        // Cập nhật UI
        document.getElementById('promo-input-group').classList.add('hidden');
        document.getElementById('promo-applied-box').classList.remove('hidden');
        document.getElementById('promo-applied-box').classList.add('flex');
        
        document.getElementById('promo-applied-code').innerText = code;
        document.getElementById('promo-applied-desc').innerText = `Giảm ${formatCurrency(discount)}`;
        
        showPromoStatus('', 'none'); // Xoá thông báo lỗi nếu có
        updateTotalDisplay();

    } catch (error) {
        showPromoStatus(error.message, 'error');
    } finally {
        applyBtn.disabled = false;
        applyBtn.innerHTML = oldText;
    }
}

function handleRemovePromo() {
    state.promo.applied = false;
    state.promo.code = null;
    state.promo.discountAmount = 0;

    document.getElementById('promo-applied-box').classList.add('hidden');
    document.getElementById('promo-applied-box').classList.remove('flex');
    
    const inputGroup = document.getElementById('promo-input-group');
    inputGroup.classList.remove('hidden');
    document.getElementById('promo-code-input').value = '';

    updateTotalDisplay();
}

function showPromoStatus(message, type) {
    const el = document.getElementById('promo-status');
    if (!el) return;
    if (type === 'none') {
        el.classList.add('hidden');
        return;
    }
    el.classList.remove('hidden');
    el.innerText = message;
    if (type === 'error') {
        el.className = 'text-[11px] font-bold mt-1 text-red-500';
    } else {
        el.className = 'text-[11px] font-bold mt-1 text-emerald-500';
    }
}

// ==========================================
// 7. SUBMIT THANH TOÁN (GỌI API TẠO ĐƠN & THANH TOÁN)
// ==========================================
async function handleSubmitPayment() {
    // 1. Validate Form Info
    const form = document.getElementById('user-info-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const token = window.apiClient ? window.apiClient.getToken() : null;
    if (!token) {
        alert("Vui lòng đăng nhập để thanh toán.");
        window.location.href = 'login.html';
        return;
    }

    // 2. Lấy Method
    const selectedRadio = document.querySelector('input[name="payment-method"]:checked');
    const paymentMethod = selectedRadio ? selectedRadio.value : 'VNPAY';

    // 3. Khóa Nút
    const btn = document.getElementById('btn-confirm-payment');
    const oldHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> Đang kết nối cổng...';

    try {
        // BƯỚC 1: TẠO ORDER
        const order = await window.apiClient.post('/api/vtd/member/orders', {});
        if (!order || !order.orderId) throw new Error('Không tạo được đơn hàng');

        // BƯỚC 2: THÊM ITEM VÀO ORDER
        for (const item of state.checkout.items) {
            await window.apiClient.post(`/api/vtd/member/orders/${order.orderId}/items`, {
                ticketTypeId: item.ticketTypeId,
                quantity: item.quantity,
            });
        }

        // BƯỚC 3: APPLY PROMO NẾU CÓ
        if (state.promo.applied && state.promo.code) {
            try {
                await window.apiClient.post(`/api/vtd/member/orders/${order.orderId}/promotion`, { promotionCode: state.promo.code });
            } catch (e) {
                console.warn('Không áp dụng được mã thật vào backend:', e);
            }
        }

        // BƯỚC 4: CREATE PAYMENT
        const paymentRes = await window.apiClient.post('/api/vtd/member/payments', {
            orderId: order.orderId,
            paymentMethod: paymentMethod,
        });

        // BƯỚC 5: HIỂN THỊ MÀN HÌNH MÃ QR ĐỂ QUÉT
        if (paymentRes && paymentRes.paymentUrl) {
            // Nếu backend trả về URL thật của cổng thanh toán, redirect luôn
            window.location.href = paymentRes.paymentUrl;
            return;
        }

        // Nếu là Demo (Backend không sinh paymentUrl), hiển thị mã QR động
        state.paymentId = paymentRes.paymentId || paymentRes.id;
        
        // Lưu ánh xạ orderId -> paymentId vào localStorage để dùng cho chức năng Hoàn tiền ở trang Hồ sơ
        localStorage.setItem(`payment_for_order_${order.orderId}`, state.paymentId);

        // Tạo thông số QR
        const amountStr = String(Math.max(state.checkout.totalAmount - state.promo.discountAmount, 0));
        const memoStr = `BDHT${order.orderId}`;
        
        let qrUrl = '';
        if (paymentMethod === 'VNPAY' || paymentMethod === 'BANK') {
            // Tạo VietQR
            qrUrl = `https://img.vietqr.io/image/MB-123456789-print.png?amount=${amountStr}&addInfo=${memoStr}&accountName=CONG%20TY%20ALADDIN`;
        } else if (paymentMethod === 'MOMO') {
            // Tạo mã QR MoMo giả lập
            qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MOMO_${memoStr}_${amountStr}`;
        } else {
            qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=PAY_${memoStr}_${amountStr}`;
        }

        // Cập nhật giao diện màn hình QR
        const qrImage = document.getElementById('qr-payment-image');
        const qrAmount = document.getElementById('qr-payment-amount');
        const qrMemo = document.getElementById('qr-payment-memo');

        if (qrImage) qrImage.src = qrUrl;
        if (qrAmount) qrAmount.innerText = formatCurrency(amountStr);
        if (qrMemo) qrMemo.innerText = memoStr;

        // Ẩn Grid Checkout, Hiện QR Screen
        const mainGrid = document.getElementById('checkout-main-grid');
        const qrScreen = document.getElementById('qr-payment-screen');
        
        if (mainGrid) mainGrid.classList.add('hidden');
        if (qrScreen) {
            qrScreen.classList.remove('hidden');
            qrScreen.classList.add('flex');
        }

    } catch (error) {
        console.error('Lỗi thanh toán:', error);
        alert('Lỗi: ' + (error.message || 'Hệ thống bận, vui lòng thử lại'));
        btn.disabled = false;
        btn.innerHTML = oldHtml;
    }
}

// ==========================================
// 8. XÁC NHẬN ĐÃ CHUYỂN KHOẢN (MÔ PHỎNG WEBHOOK)
// ==========================================
async function handleConfirmQrPaid() {
    const btn = document.getElementById('btn-confirm-qr-paid');
    const oldHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Đang xác nhận...';

    try {
        // Trực tiếp gọi API Webhook để update trạng thái thành SUCCESS
        if (state.paymentId) {
             try {
                await window.apiClient.post(`/api/vtd/public/payments/${state.paymentId}/webhook`, {
                    status: 'SUCCESS',
                    transactionId: `VNPAY-${Date.now()}`,
                });
             } catch(e) {
                 console.warn("Không thể gọi webhook thật:", e);
             }
        }
        
        // Mô phỏng Redirect trả về với params để trigger popup thành công
        const callbackUrl = new URL(window.location.href);
        callbackUrl.searchParams.set('status', 'SUCCESS');
        callbackUrl.searchParams.set('vnp_ResponseCode', '00');
        
        setTimeout(() => {
            window.location.href = callbackUrl.toString();
        }, 800);

    } catch (error) {
        alert('Lỗi xác nhận: ' + error.message);
        btn.disabled = false;
        btn.innerHTML = oldHtml;
    }
}
