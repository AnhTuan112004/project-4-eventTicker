document.addEventListener('DOMContentLoaded', () => {
    loadHeaderForDetail();
    loadEventDetails();
    setupBookingForm();
});

// ==========================================
// 1. LOAD HEADER
// ==========================================
async function loadHeaderForDetail() {
    try {
        const response = await fetch('/components/header.html');
        let headerHTML = await response.text();
        headerHTML = headerHTML.replace(/href="index.html"/g, 'href="/index.html"');
        headerHTML = headerHTML.replace(/href="pages\/user\//g, 'href="/pages/user/');
        document.getElementById('header-container').innerHTML = headerHTML;

        const storedUser = localStorage.getItem('currentUser');
        const isLoggedIn = Boolean(storedUser);
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
                    window.location.reload();
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

// ==========================================
// 2. LẤY CHI TIẾT SỰ KIỆN VÀ LOẠI VÉ
// ==========================================
async function loadEventDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    const loadingMsg = document.getElementById('loading-msg');
    const errorMsg = document.getElementById('error-msg');
    const eventContent = document.getElementById('event-content');
    const ticketTypesContainer = document.getElementById('ticket-types');

    if (!eventId) {
        loadingMsg.style.display = 'none';
        errorMsg.innerText = 'Không tìm thấy mã sự kiện. Vui lòng quay lại Trang chủ!';
        errorMsg.style.display = 'block';
        return;
    }

    try {
        const event = await window.apiClient.get(`/api/vtd/public/events/${eventId}`);
        loadingMsg.style.display = 'none';
        eventContent.style.display = 'flex';

        document.getElementById('detail-title').innerText = event.name || event.eventName || 'Sự kiện không tên';
        document.getElementById('detail-venue').innerText = event.venue || event.venueName || event.location || 'Chưa cập nhật';
        document.getElementById('detail-desc').innerText = event.description || event.desc || 'Chưa có thông tin mô tả chi tiết.';
        const rawDate = event.date || event.startTime;
        if (rawDate) {
            const d = new Date(rawDate);
            document.getElementById('detail-date').innerText = d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        }
        const imgUrl = event.imageUrl || 'https://via.placeholder.com/800x450?text=Sự+kiện';
        document.getElementById('detail-image').src = imgUrl;

        const price = event.price || event.minPrice || 0;
        document.getElementById('detail-price').innerText = price.toLocaleString('vi-VN') + ' VNĐ';

        if (ticketTypesContainer) {
            const ticketTypes = await window.apiClient.get(`/api/vtd/public/ticket-types/${eventId}`);
            renderTicketTypes(ticketTypes, ticketTypesContainer);
        }
    } catch (error) {
        console.error('Lỗi lấy chi tiết sự kiện:', error);
        loadingMsg.style.display = 'none';
        errorMsg.innerText = `Không thể tải dữ liệu: ${error.message}`;
        errorMsg.style.display = 'block';
    }
}

function renderTicketTypes(ticketTypes, container) {
    if (!ticketTypes || ticketTypes.length === 0) {
        container.innerHTML = '<p>Không có loại vé nào đang mở bán.</p>';
        return;
    }

    container.innerHTML = ticketTypes.map(type => {
        const name = type.typeName || type.name || 'Vé chung';
        const price = type.price ? Number(type.price).toLocaleString('vi-VN') + ' VNĐ' : 'Liên hệ';
        const remaining = type.remainingQuantity ?? type.totalQuantity ?? 0;
        return `
            <label class="ticket-type-option" style="display:block; border:1px solid #ddd; padding: 12px; border-radius: 8px; margin-bottom: 12px; cursor:pointer;">
                <input type="radio" name="ticketType" value="${type.ticketTypeId}" style="margin-right: 10px;" ${type === ticketTypes[0] ? 'checked' : ''}>
                <strong>${name}</strong> — ${price} — Còn lại: ${remaining}
            </label>
        `;
    }).join('');
}

// ==========================================
// 3. ĐẶT VÉ
// ==========================================
function setupBookingForm() {
    const bookingForm = document.getElementById('booking-form');
    if (!bookingForm) return;

    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msgBox = document.getElementById('booking-msg');
        const token = window.apiClient.getToken();
        const storedUser = localStorage.getItem('currentUser');
        const isLoggedIn = token || storedUser;
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');

        if (!isLoggedIn) {
            msgBox.innerHTML = '<span style="color: red;">Bạn cần đăng nhập trước khi đặt vé.</span>';
            setTimeout(() => {
                window.location.href = '/pages/user/login.html';
            }, 1400);
            return;
        }

        const qty = Number(document.getElementById('ticket-qty').value || 1);
        const selectedTicketType = document.querySelector('input[name="ticketType"]:checked');
        if (!selectedTicketType) {
            msgBox.innerHTML = '<span style="color: red;">Vui lòng chọn loại vé.</span>';
            return;
        }

        const ticketTypeId = Number(selectedTicketType.value);
        msgBox.innerHTML = '<span style="color: blue;">Đang xử lý đơn hàng...</span>';

        try {
            const orderId = await getOrCreateOrder();
            await window.apiClient.post(`/api/vtd/member/orders/${orderId}/items`, {
                ticketTypeId: ticketTypeId,
                quantity: qty
            });
            msgBox.innerHTML = `<span style="color: green;">Đã thêm ${qty} vé vào giỏ hàng. <a href='/pages/user/profile.html' style='color:#007bff;'>Xem giỏ hàng</a></span>`;
        } catch (error) {
            msgBox.innerHTML = `<span style="color: red;">Lỗi khi đặt vé: ${error.message}</span>`;
        }
    });
}

async function getOrCreateOrder() {
    let orderId = localStorage.getItem('currentOrderId');
    if (orderId) return orderId;

    const data = await window.apiClient.post('/api/vtd/member/orders', {});
    if (!data || !data.orderId) {
        throw new Error('Không thể tạo đơn hàng.');
    }

    orderId = data.orderId;
    localStorage.setItem('currentOrderId', orderId);
    return orderId;
}
