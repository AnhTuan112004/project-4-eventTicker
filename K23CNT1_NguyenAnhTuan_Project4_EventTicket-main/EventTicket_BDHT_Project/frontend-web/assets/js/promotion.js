document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    bindPromotionActions();
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

function bindPromotionActions() {
    const validateButton = document.getElementById('btn-validate');
    const calculateButton = document.getElementById('btn-calculate');
    const resultBox = document.getElementById('promo-result');

    if (validateButton) {
        validateButton.addEventListener('click', async () => {
            const code = document.getElementById('promo-code').value.trim();
            if (!code) {
                resultBox.style.color = 'red';
                resultBox.innerText = 'Vui lòng nhập mã khuyến mãi.';
                return;
            }
            resultBox.style.color = 'blue';
            resultBox.innerText = 'Đang kiểm tra mã...';
            try {
                const response = await window.apiClient.post('/api/nat/public/promotions/validate', { code });
                if (response.success) {
                    resultBox.style.color = 'green';
                    resultBox.innerHTML = `Mã hợp lệ! Loại giảm giá: ${response.discountType}, giá trị: ${response.discountValue}.`;
                } else {
                    resultBox.style.color = 'red';
                    resultBox.innerText = response.message || 'Mã không hợp lệ.';
                }
            } catch (error) {
                resultBox.style.color = 'red';
                resultBox.innerText = 'Lỗi: ' + error.message;
            }
        });
    }

    if (calculateButton) {
        calculateButton.addEventListener('click', async () => {
            const code = document.getElementById('promo-code').value.trim();
            const price = Number(document.getElementById('original-price').value || 0);
            if (!code || price <= 0) {
                resultBox.style.color = 'red';
                resultBox.innerText = 'Nhập mã và giá gốc hợp lệ để tính giảm giá.';
                return;
            }
            resultBox.style.color = 'blue';
            resultBox.innerText = 'Đang tính giảm giá...';
            try {
                const result = await window.apiClient.post('/api/nat/public/promotions/calculate-discount', {
                    promotionCode: code,
                    originalPrice: price
                });
                resultBox.style.color = 'green';
                resultBox.innerHTML = `Giá gốc: ${Number(result.originalPrice).toLocaleString('vi-VN')} VNĐ<br>` +
                    `Giảm: ${Number(result.discountAmount).toLocaleString('vi-VN')} VNĐ (${result.discountType})<br>` +
                    `Giá cuối cùng: ${Number(result.finalPrice).toLocaleString('vi-VN')} VNĐ`;
            } catch (error) {
                resultBox.style.color = 'red';
                resultBox.innerText = 'Lỗi: ' + error.message;
            }
        });
    }
}
