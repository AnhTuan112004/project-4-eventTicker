const CHECKOUT_STORAGE_KEY = 'checkoutData';

const DEFAULT_BANK_TRANSFER_CONFIG = {
    bankCode: 'MB',
    bankName: 'MB Bank',
    accountNumber: '0010120044456',
    accountHolder: 'NGUYEN ANH TUAN',
    mode: 'image',
    qrImageUrl: 'https://yourdomain.com/qr-mb.png'
};

const DEFAULT_MOMO_TRANSFER_CONFIG = {
    mode: 'image',
    qrImageUrl: 'https://yourdomain.com/qr-momo.png'
};

function normalizeBankConfig(source) {
    if (!source || typeof source !== 'object') return null;

    const normalized = {};
    const bankCode = String(source.bankCode || '').trim();
    const bankName = String(source.bankName || bankCode || '').trim();
    const accountNumber = String(source.accountNumber || '').trim();
    const accountHolder = String(source.accountHolder || '').trim();

    if (!bankCode && !bankName && !accountNumber && !accountHolder) {
        return null;
    }

    if (bankCode) normalized.bankCode = bankCode;
    if (bankName) normalized.bankName = bankName;
    if (accountNumber) normalized.accountNumber = accountNumber;
    if (accountHolder) normalized.accountHolder = accountHolder;

    return normalized;
}

function readStoredBankConfig(storage) {
    if (!storage) return null;

    const rawValue = storage.getItem('BDHT_PAYMENT_BANK_CONFIG');
    if (!rawValue) return null;

    try {
        const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
        return normalizeBankConfig(parsed);
    } catch (error) {
        console.warn('Không thể đọc cấu hình ngân hàng từ storage:', error);
        return null;
    }
}

// ====== STATE ======
const state = {
    checkout: null,
    promo: {
        applied: false,
        code: null,
        discountAmount: 0,
    },
    countdownInterval: null,
    paymentMode: 'gateway'
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
    // Đọc giỏ hàng từ sessionStorage hoặc localStorage (ưu tiên dữ liệu mới nhất)
    let rawData = sessionStorage.getItem(CHECKOUT_STORAGE_KEY)
        || localStorage.getItem(CHECKOUT_STORAGE_KEY)
        || localStorage.getItem('pendingCheckout');
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

function getBankTransferConfig() {
    const overrides = [
        normalizeBankConfig(window.BDHT_PAYMENT_BANK_CONFIG),
        readStoredBankConfig(localStorage),
        readStoredBankConfig(sessionStorage)
    ].filter(Boolean);

    const merged = Object.assign({}, DEFAULT_BANK_TRANSFER_CONFIG);

    overrides.forEach((override) => {
        Object.assign(merged, override);
    });

    return merged;
}

function inferPaymentMode(paymentMethod, checkout = state.checkout) {
    const selectedPayment = String(checkout?.selectedPayment || '').toLowerCase();
    const normalizedMethod = String(paymentMethod || '').toUpperCase();

    if (selectedPayment === 'vietqr' || selectedPayment === 'bank') {
        return 'bank';
    }

    if (normalizedMethod === 'CASH') {
        return 'bank';
    }

    return 'gateway';
}

function buildPaymentQrData(paymentId, amount, paymentMethod) {
    const normalizedMethod = String(paymentMethod || 'PAYMENT').toUpperCase();
    const normalizedAmount = Number(amount || 0);

    return `PAYMENT:${paymentId}|METHOD:${normalizedMethod}|AMOUNT:${normalizedAmount}`;
}

function buildBankTransferQrUrl(paymentId, amount) {
    const config = getBankTransferConfig();
    const memo = `PAYMENT-${paymentId}`;
    const normalizedAmount = Number(amount || 0);

    const params = new URLSearchParams({
        amount: String(normalizedAmount),
        addInfo: memo
    });

    return `https://img.vietqr.io/image/${encodeURIComponent(config.bankCode)}-${encodeURIComponent(config.accountNumber)}-compact2.png?${params.toString()}`;
}

function getBankQrSource(paymentId, amount, config = getBankTransferConfig()) {
    if (config.mode === 'image' && config.qrImageUrl) {
        return config.qrImageUrl;
    }

    return buildBankTransferQrUrl(paymentId, amount);
}

function getBankQrModeLabel(config = getBankTransferConfig()) {
    return config.mode === 'image' ? 'QR thật của bạn' : 'QR ngân hàng của bạn';
}

function getBankQrHint(config = getBankTransferConfig()) {
    if (config.mode === 'image') {
        return 'QR thật của bạn đang được hiển thị. Vui lòng quét mã và nhập đúng số tiền theo hướng dẫn bên dưới.';
    }

    return 'QR được tạo từ tài khoản ngân hàng của bạn để tự động điền số tiền và nội dung chuyển khoản.';
}

function renderBankTransferDetails(paymentId, amount) {
    const detailsEl = document.getElementById('bank-transfer-details');
    const instructionsEl = document.getElementById('payment-instructions');
    const bankNameEl = document.getElementById('bank-name');
    const bankAccountEl = document.getElementById('bank-account-number');
    const bankHolderEl = document.getElementById('bank-account-holder');
    const bankMemoEl = document.getElementById('bank-transfer-memo');

    const config = getBankTransferConfig();
    const memo = `PAYMENT-${paymentId}`;

    if (detailsEl) {
        detailsEl.classList.remove('hidden');
        detailsEl.classList.add('flex');
    }

    if (bankNameEl) bankNameEl.innerText = config.bankName;
    if (bankAccountEl) bankAccountEl.innerText = config.accountNumber;
    if (bankHolderEl) bankHolderEl.innerText = config.accountHolder;
    if (bankMemoEl) bankMemoEl.innerText = memo;

    if (instructionsEl) {
        instructionsEl.innerHTML = `
            <div class="rounded-2xl bg-orange-50 border border-orange-100 p-4">
                <p class="text-[11px] font-black uppercase tracking-wider text-brand-orange mb-2">Hướng dẫn chuyển khoản</p>
                <ol class="list-decimal list-inside text-sm font-semibold text-slate-700 space-y-2">
                    <li>${config.mode === 'image' ? 'Mở ứng dụng ngân hàng hoặc Ví của bạn và quét mã QR thật bên dưới.' : 'Mở ứng dụng ngân hàng hoặc Ví của bạn và chọn quét mã VietQR.'}</li>
                    <li>${config.mode === 'image' ? 'Kiểm tra đúng số tiền và nội dung chuyển khoản như trên màn hình.' : 'Quét đúng mã trên màn hình để tự động điền số tài khoản và nội dung chuyển khoản.'}</li>
                    <li>Nhập đúng số tiền <span class="text-brand-orange">${formatCurrency(Number(amount || 0))}</span>.</li>
                    <li>Sau khi chuyển khoản thành công, bấm <span class="font-black">Hoàn thành thanh toán</span> để hệ thống xác nhận.</li>
                </ol>
            </div>`;
    }
}

function showPendingPaymentState(paymentId, amount, paymentMethod, status = 'PENDING', options = {}) {
    const qrImage = document.getElementById('qr-payment-image');
    const qrAmount = document.getElementById('qr-payment-amount');
    const qrMemo = document.getElementById('qr-payment-memo');
    const qrScreen = document.getElementById('qr-payment-screen');
    const mainGrid = document.getElementById('checkout-main-grid');
    const titleEl = qrScreen?.querySelector('h2');
    const hintEl = document.getElementById('qr-mode-hint');
    const confirmBtn = document.getElementById('btn-confirm-qr-paid');

    const paymentMode = options.mode || inferPaymentMode(paymentMethod);
    const bankConfig = getBankTransferConfig();
    state.paymentMode = paymentMode;

    if (titleEl) {
        titleEl.innerText = status === 'SUCCESS'
            ? 'Thanh toán đã xác nhận'
            : paymentMode === 'bank'
                ? getBankQrModeLabel(bankConfig)
                : 'Thanh toán đang chờ xử lý';
    }

    if (hintEl) {
        hintEl.innerText = status === 'SUCCESS'
            ? 'Giao dịch đã được backend xác nhận thành công. Bạn có thể quay lại hồ sơ để theo dõi đơn hàng.'
            : paymentMode === 'bank'
                ? getBankQrHint(bankConfig)
                : 'Quét mã QR bên dưới để tiến hành thanh toán, sau đó bấm Kiểm tra trạng thái để hệ thống xác nhận.';
    }

    if (qrImage) {
        if (paymentMode === 'bank') {
            qrImage.src = getBankQrSource(paymentId, amount, bankConfig);
            qrImage.alt = bankConfig.mode === 'image' ? 'QR thật của bạn' : 'Mã QR VietQR thanh toán';
            renderBankTransferDetails(paymentId, amount);
        } else {
            const qrPayload = buildPaymentQrData(paymentId, amount, paymentMethod);
            qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrPayload)}`;
            qrImage.alt = 'Mã QR thanh toán';
            const detailsEl = document.getElementById('bank-transfer-details');
            if (detailsEl) detailsEl.classList.add('hidden');
            const instructionsEl = document.getElementById('payment-instructions');
            if (instructionsEl) instructionsEl.innerHTML = '';
        }
        qrImage.classList.remove('hidden');
    }

    if (qrAmount) {
        qrAmount.innerText = formatCurrency(Number(amount || 0));
    }

    if (qrMemo) {
        qrMemo.innerText = `PAYMENT-${paymentId}`;
    }

    if (confirmBtn) {
        confirmBtn.innerHTML = status === 'SUCCESS'
            ? 'Quay lại hồ sơ <i class="fas fa-arrow-right"></i>'
            : paymentMode === 'bank'
                ? 'Hoàn thành thanh toán <i class="fas fa-check-circle"></i>'
                : 'Kiểm tra trạng thái <i class="fas fa-sync-alt"></i>';
    }

    if (mainGrid) {
        mainGrid.classList.add('hidden');
    }

    if (qrScreen) {
        qrScreen.classList.remove('hidden');
        qrScreen.classList.add('flex');
    }
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
        // FIX: gọi API khuyến mãi thật từ backend thay vì mock code
        const response = await window.apiClient.post('/api/vtd/public/promotions/calculate-discount', {
            promotionCode: code,
            originalPrice: Number(state.checkout.totalAmount || 0)
        });

        const discount = Number(response?.discountAmount ?? 0);
        if (!response || Number.isNaN(discount)) {
            throw new Error(response?.error || 'Mã giảm giá không hợp lệ hoặc đã hết hạn');
        }

        state.promo.applied = true;
        state.promo.code = code;
        state.promo.discountAmount = discount;

        document.getElementById('promo-input-group').classList.add('hidden');
        document.getElementById('promo-applied-box').classList.remove('hidden');
        document.getElementById('promo-applied-box').classList.add('flex');

        document.getElementById('promo-applied-code').innerText = code;
        document.getElementById('promo-applied-desc').innerText = `Giảm ${formatCurrency(discount)}`;

        showPromoStatus('', 'none');
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
    const selectedPaymentMode = String(state.checkout?.selectedPayment || '').toLowerCase();
    const paymentMethod = ['vietqr', 'bank'].includes(selectedPaymentMode)
        ? 'CASH'
        : (selectedRadio ? selectedRadio.value.toUpperCase() : 'VNPAY');

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

        // BƯỚC 5: DÙNG DỮ LIỆU THẬT TỪ BACKEND
        if (paymentRes && paymentRes.paymentUrl) {
            window.location.href = paymentRes.paymentUrl;
            return;
        }

        state.paymentId = paymentRes.paymentId || paymentRes.id;
        localStorage.setItem(`payment_for_order_${order.orderId}`, state.paymentId);

        const displayAmount = Number(paymentRes?.amount || (state.checkout.totalAmount - state.promo.discountAmount) || 0);
        showPendingPaymentState(state.paymentId, displayAmount, paymentMethod, paymentRes?.status || 'PENDING');

    } catch (error) {
        console.error('Lỗi thanh toán:', error);
        alert('Lỗi: ' + (error.message || 'Hệ thống bận, vui lòng thử lại'));
        btn.disabled = false;
        btn.innerHTML = oldHtml;
    }
}

// ==========================================
// 8. XÁC NHẬN ĐÃ CHUYỂN KHOẢN
// ==========================================
async function handleConfirmQrPaid() {
    const btn = document.getElementById('btn-confirm-qr-paid');
    if (!btn || !state.paymentId) {
        alert('Không tìm thấy mã thanh toán để hoàn tất.');
        return;
    }

    const oldHtml = btn.innerHTML;
    const isBankMode = state.paymentMode === 'bank';
    btn.disabled = true;
    btn.innerHTML = isBankMode
        ? '<i class="fas fa-spinner fa-spin mr-2"></i> Đang hoàn tất thanh toán...'
        : '<i class="fas fa-spinner fa-spin mr-2"></i> Đang kiểm tra trạng thái...';

    try {
        const currentPayment = await window.apiClient.get(`/api/vtd/member/payments/${state.paymentId}`);

        if (!currentPayment) {
            throw new Error('Không nhận được dữ liệu thanh toán từ backend.');
        }

        if (currentPayment.status === 'SUCCESS') {
            const callbackUrl = new URL(window.location.href);
            callbackUrl.searchParams.set('status', 'SUCCESS');
            callbackUrl.searchParams.set('vnp_ResponseCode', '00');

            showPendingPaymentState(state.paymentId, Number(currentPayment.amount || 0), currentPayment.paymentMethod || 'PAYMENT', 'SUCCESS');
            setTimeout(() => {
                window.location.href = callbackUrl.toString();
            }, 800);
            return;
        }

        if (isBankMode) {
            const webhookResponse = await window.apiClient.post(`/api/vtd/public/payments/${state.paymentId}/webhook`, {
                status: 'SUCCESS',
                transactionId: `PAYMENT-${state.paymentId}`
            });

            if (!webhookResponse || webhookResponse.paymentStatus !== 'SUCCESS') {
                throw new Error('Backend chưa xác nhận giao dịch thành công.');
            }

            const callbackUrl = new URL(window.location.href);
            callbackUrl.searchParams.set('status', 'SUCCESS');
            callbackUrl.searchParams.set('vnp_ResponseCode', '00');

            showPendingPaymentState(state.paymentId, Number(currentPayment.amount || 0), currentPayment.paymentMethod || 'CASH', 'SUCCESS');
            setTimeout(() => {
                window.location.href = callbackUrl.toString();
            }, 800);
            return;
        }

        alert('Thanh toán chưa hoàn tất. Vui lòng kiểm tra lại sau hoặc liên hệ hỗ trợ nếu đã chuyển khoản.');
        btn.disabled = false;
        btn.innerHTML = oldHtml;
    } catch (error) {
        alert('Lỗi xác nhận thanh toán: ' + (error.message || 'Không thể kết nối backend.'));
        btn.disabled = false;
        btn.innerHTML = oldHtml;
    }
}
