document.addEventListener('DOMContentLoaded', () => {
    window.pageUtils.loadHeader();
    loadEventDetails();
    setupBookingForm();
});

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
    const eventImagesContainer = document.getElementById('detail-images');
    const venueInfo = document.getElementById('detail-venue-info');

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

        const titleEl = document.getElementById('detail-title');
        if (titleEl) titleEl.innerText = event.title || event.name || event.eventName || 'Sự kiện không tên';

        const venueEl = document.getElementById('detail-venue');
        if (venueEl) venueEl.innerText = (event.venue && event.venue.venueName) ? event.venue.venueName : (event.venueName || event.location || 'Chưa cập nhật');

        const descEl = document.getElementById('detail-desc');
        if (descEl) descEl.innerText = event.description || event.desc || 'Chưa có thông tin mô tả chi tiết.';
        
        const rawDate = event.startTime || event.date;
        const dateEl = document.getElementById('detail-date');
        if (rawDate && dateEl) {
            const d = new Date(rawDate);
            dateEl.innerText = d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        }
        
        const imgUrl = event.bannerImageUrl || event.imageUrl || 'https://via.placeholder.com/800x450?text=Sự+kiện';
        const imgEl = document.getElementById('detail-image');
        if (imgEl) imgEl.src = imgUrl;

        const price = event.price || event.minPrice || 0;
        const priceEl = document.getElementById('detail-price');
        if (priceEl) priceEl.innerText = price ? (price.toLocaleString('vi-VN') + ' VNĐ') : 'Liên hệ';

        if (venueInfo) {
            venueInfo.innerHTML = renderVenueInfo(event.venue || {
                venueName: event.venueName || 'Chưa cập nhật',
                address: event.address || '',
                city: event.city || ''
            });
        }

        const ticketApi = window.apiClient.getToken() ?
            `/api/vtd/member/ticket-types/${eventId}/available` :
            `/api/vtd/public/ticket-types/${eventId}`;
        const ticketTypes = await window.apiClient.get(ticketApi);
        if (ticketTypesContainer) renderTicketTypes(ticketTypes, ticketTypesContainer);

        if (eventImagesContainer) {
            const images = await loadEventImages(eventId);
            renderEventImages(images, eventImagesContainer, imgUrl);
        }
    } catch (error) {
        console.error('Lỗi lấy chi tiết sự kiện:', error);
        loadingMsg.style.display = 'none';
        errorMsg.innerText = `Không thể tải dữ liệu: ${error.message}`;
        errorMsg.style.display = 'block';
    }
}

async function loadEventImages(eventId) {
    try {
        const images = await window.apiClient.get(`/api/vtd/public/events/${eventId}/images`);
        return Array.isArray(images) && images.length > 0 ? images : [];
    } catch (error) {
        console.warn('Không lấy được ảnh sự kiện:', error);
        return [];
    }
}

function renderEventImages(images, container, fallbackImage) {
    if (!container) return;
    if (!images || images.length === 0) {
        container.innerHTML = `<img src="${fallbackImage}" alt="Event Image" style="width:100%; border-radius:8px; margin-bottom:18px; object-fit:cover; max-height:420px;">`;
        return;
    }

    container.innerHTML = images.map(image => {
        const src = image.imageUrl || image.url || fallbackImage;
        return `<img src="${src}" alt="Event Image" style="width:100%; border-radius:8px; margin-bottom:18px; object-fit:cover; max-height:320px;">`;
    }).join('');
}

function renderVenueInfo(venue) {
    const name = venue.venueName || venue.name || 'Chưa cập nhật';
    const address = venue.address || venue.addressLine || 'Địa chỉ chưa rõ';
    const city = venue.city || venue.cityName || '';

    return `
        <div style="margin-bottom: 18px; padding: 14px; background: #ffffff; border-radius: 8px; border: 1px solid #ddd;">
            <h4 style="margin: 0 0 8px;">Thông tin địa điểm</h4>
            <p style="margin: 0 0 5px;"><strong>${name}</strong></p>
            <p style="margin: 0; color: #555;">${address}${city ? ', ' + city : ''}</p>
        </div>
    `;
}

function renderTicketTypes(ticketTypes, container) {
    if (!ticketTypes || ticketTypes.length === 0) {
        container.innerHTML = '<p>Không có loại vé nào đang mở bán.</p>';
        return;
    }

    container.innerHTML = ticketTypes.map((type, index) => {
        const name = type.typeName || type.name || 'Vé chung';
        const price = type.price ? Number(type.price).toLocaleString('vi-VN') + ' VNĐ' : 'Liên hệ';
        const remaining = (type.totalQuantity || 0) - (type.soldQuantity || 0);
        return `
            <label class="ticket-type-option" style="display:block; border:1px solid #ddd; padding: 12px; border-radius: 8px; margin-bottom: 12px; cursor:pointer;">
                <input type="radio" name="ticketType" value="${type.ticketTypeId}" style="margin-right: 10px;" ${index === 0 ? 'checked' : ''}>
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
        const token = window.apiClient ? window.apiClient.getToken() : null;
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

        const qtyInput = document.getElementById('ticket-qty');
        const qty = Number(qtyInput ? qtyInput.value : 1) || 1;
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
                ticketTypeId,
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