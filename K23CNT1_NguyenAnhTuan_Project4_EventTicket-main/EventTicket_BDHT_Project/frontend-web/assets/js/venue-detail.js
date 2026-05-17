document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadVenueDetails();
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

async function loadVenueDetails() {
    const params = new URLSearchParams(window.location.search);
    const venueId = params.get('id');
    const detailContent = document.getElementById('detail-content');

    if (!venueId || !detailContent) {
        if (detailContent) {
            detailContent.innerHTML = '<p>Không tìm thấy mã địa điểm.</p>';
        }
        return;
    }

    try {
        const venue = await window.apiClient.get(`/api/vtd/public/venues/${venueId}`);
        if (!venue) {
            throw new Error('Không có thông tin địa điểm.');
        }

        detailContent.innerHTML = `
            <h1>${venue.name || venue.venueName || 'Địa điểm chưa xác định'}</h1>
            <div class="venue-field"><strong>Địa chỉ:</strong> ${venue.address || venue.location || 'Chưa cập nhật'}</div>
            <div class="venue-field"><strong>Sức chứa:</strong> ${venue.capacity || venue.maxCapacity || 'Chưa cập nhật'}</div>
            <div class="venue-field"><strong>Mô tả:</strong> ${venue.description || venue.info || 'Chưa có mô tả.'}</div>
            <div class="venue-field"><strong>Bản đồ/Link:</strong> ${venue.mapLink || venue.url || 'Không có thông tin'}</div>
        `;
    } catch (error) {
        detailContent.innerHTML = `<p>Không tải được chi tiết địa điểm: ${error.message}</p>`;
    }
}
