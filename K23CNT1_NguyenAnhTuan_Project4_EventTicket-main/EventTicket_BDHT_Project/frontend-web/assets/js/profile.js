document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    renderProfile();
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

async function renderProfile() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = '/pages/user/login.html';
        return;
    }

    document.getElementById('profile-fullname').innerText = currentUser.fullName || currentUser.name || 'Chưa cập nhật';
    document.getElementById('profile-email').innerText = currentUser.email || 'Chưa cập nhật';
    document.getElementById('profile-phone').innerText = currentUser.phoneNumber || currentUser.phone || 'Chưa cập nhật';
    document.getElementById('profile-role').innerText = currentUser.role || 'USER';

    const updateFullNameInput = document.getElementById('updateFullName');
    const updatePhoneInput = document.getElementById('updatePhone');
    if (updateFullNameInput) updateFullNameInput.value = currentUser.fullName || currentUser.name || '';
    if (updatePhoneInput) updatePhoneInput.value = currentUser.phoneNumber || currentUser.phone || '';

    setupProfileEditor();
    await loadOrders();
    await loadTickets();
}

function getCurrentUser() {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (error) {
        return null;
    }
}

async function setupProfileEditor() {
    const profileForm = document.getElementById('profile-form');
    const passwordForm = document.getElementById('password-form');
    const profileMsg = document.getElementById('profile-update-msg');
    const passwordMsg = document.getElementById('password-change-msg');

    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (profileMsg) {
                profileMsg.style.color = 'blue';
                profileMsg.innerText = 'Đang cập nhật...';
            }
            try {
                const profile = await window.apiClient.put('/api/nat/member/profile', {
                    fullName: document.getElementById('updateFullName').value,
                    phoneNumber: document.getElementById('updatePhone').value
                });
                localStorage.setItem('currentUser', JSON.stringify(profile));
                await refreshUserProfile();
                if (profileMsg) {
                    profileMsg.style.color = 'green';
                    profileMsg.innerText = 'Cập nhật hồ sơ thành công!';
                }
            } catch (error) {
                if (profileMsg) {
                    profileMsg.style.color = 'red';
                    profileMsg.innerText = error.message || 'Cập nhật hồ sơ thất bại.';
                }
            }
        });
    }

    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (passwordMsg) {
                passwordMsg.style.color = 'blue';
                passwordMsg.innerText = 'Đang đổi mật khẩu...';
            }
            try {
                await window.apiClient.post('/api/nat/member/change-password', {
                    oldPassword: document.getElementById('currentPassword').value,
                    newPassword: document.getElementById('newPassword').value
                });
                if (passwordMsg) {
                    passwordMsg.style.color = 'green';
                    passwordMsg.innerText = 'Đổi mật khẩu thành công!';
                }
                passwordForm.reset();
            } catch (error) {
                if (passwordMsg) {
                    passwordMsg.style.color = 'red';
                    passwordMsg.innerText = error.message || 'Đổi mật khẩu thất bại.';
                }
            }
        });
    }
}

async function refreshUserProfile() {
    try {
        const profile = await window.apiClient.get('/api/nat/member/profile');
        if (profile) {
            localStorage.setItem('currentUser', JSON.stringify(profile));
            document.getElementById('profile-fullname').innerText = profile.fullName || profile.name || 'Chưa cập nhật';
            document.getElementById('profile-email').innerText = profile.email || 'Chưa cập nhật';
            document.getElementById('profile-phone').innerText = profile.phoneNumber || profile.phone || 'Chưa cập nhật';
            document.getElementById('profile-role').innerText = profile.role || 'USER';
            return;
        }
    } catch (error) {
        console.error('Lỗi tải thông tin hồ sơ:', error);
    }
}

async function loadOrders() {
    const container = document.getElementById('orders-container');
    if (!container) return;

    try {
        const orders = await window.apiClient.get('/api/nat/member/orders');
        if (!orders || orders.length === 0) {
            container.innerHTML = '<div class="empty-state">Bạn chưa có đơn hàng nào.</div>';
            return;
        }

        container.innerHTML = orders.map(order => {
            const status = order.status || order.orderStatus || 'PENDING';
            const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : 'Không rõ';
            const total = order.totalAmount ? Number(order.totalAmount).toLocaleString('vi-VN') + ' VNĐ' : 'Chưa rõ';
            return `
                <div class="order-item">
                    <strong>Đơn hàng #${order.orderId || order.id || '---'}</strong>
                    <p>Trạng thái: ${status}</p>
                    <p>Ngày tạo: ${createdAt}</p>
                    <p>Tổng giá trị: ${total}</p>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Lỗi tải đơn hàng:', error);
        container.innerHTML = `<div class="empty-state">Không thể tải đơn hàng: ${error.message}</div>`;
    }
}

async function loadTickets() {
    const container = document.getElementById('tickets-container');
    if (!container) return;

    try {
        const tickets = await window.apiClient.get('/api/nat/member/my-tickets');
        if (!tickets || tickets.length === 0) {
            container.innerHTML = '<div class="empty-state">Bạn chưa có vé nào được phát hành.</div>';
            return;
        }

        container.innerHTML = tickets.map(ticket => {
            const code = ticket.ticketCode || ticket.qrCode || '---';
            const eventName = ticket.eventName || ticket.event?.name || 'Sự kiện chưa xác định';
            const purchasedAt = ticket.purchaseDate ? new Date(ticket.purchaseDate).toLocaleString('vi-VN') : 'Không rõ';
            const seat = ticket.seatNumber || ticket.seat || 'Chưa rõ';
            return `
                <div class="order-item">
                    <strong>Sự kiện: ${eventName}</strong>
                    <p>Mã vé: ${code}</p>
                    <p>Vị trí/ghế: ${seat}</p>
                    <p>Ngày mua: ${purchasedAt}</p>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Lỗi tải vé:', error);
        container.innerHTML = `<div class="empty-state">Không thể tải vé: ${error.message}</div>`;
    }
}
