document.addEventListener('DOMContentLoaded', () => {
    window.pageUtils.loadHeader();
    setupLogin();
    setupRegister();
    setupExtendFeatures();
});

// ==========================================
// 1. XỬ LÝ ĐĂNG NHẬP
// ==========================================
function setupLogin() {
    const loginForm = document.getElementById('loginForm') || document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const emailInput = document.getElementById('email') || document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const errorMsg = document.getElementById('login-msg') || document.getElementById('login-error');
        
        if (!errorMsg) return;
        errorMsg.style.display = 'block';
        errorMsg.innerHTML = '<span style="color: blue;">Đang kiểm tra thông tin xác thực...</span>';

        try {
            const response = await window.apiClient.post('/api/nat/public/auth/login', {
                email: emailInput.value,
                password: passwordInput.value
            });

            console.log('Login response:', response);

            if (response && response.user) {
                if (response.token) {
                    window.apiClient.setToken(response.token);
                }
                localStorage.setItem('currentUser', JSON.stringify(response.user));

                const userRole = response.user.role || 'USER';
                errorMsg.innerHTML = `<span style="color: green;">${response.message || 'Đăng nhập thành công! Đang chuyển hướng...'}</span>`;

                setTimeout(() => {
                    if (userRole === 'ADMIN' || userRole === 'ROLE_ADMIN') {
                        window.location.href = '/pages/admin/dashboard.html';
                    } else {
                        window.location.href = '/index.html';
                    }
                }, 800);
            } else if (response && response.error) {
                throw new Error(response.error);
            } else {
                throw new Error('Không nhận được dữ liệu user từ máy chủ.');
            }
        } catch (error) {
            console.error('Lỗi đăng nhập:', error);
            const errorText = (error.message || '').toLowerCase();
            if (errorText.includes('khóa') || errorText.includes('locked')) {
                errorMsg.innerHTML = '<span style="color: orange;">Tài khoản của bạn đã bị khóa! Liên hệ quản trị viên.</span>';
            } else {
                errorMsg.innerHTML = `<span style="color: red;">${error.message || 'Đăng nhập thất bại.'}</span>`;
            }
        }
    });
}

// ==========================================
// 2. XỬ LÝ ĐĂNG KÝ
// ==========================================
function setupRegister() {
    const registerForm = document.getElementById('registerForm') || document.getElementById('register-form');
    if (!registerForm) return;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullName = document.getElementById('fullName')?.value || document.getElementById('reg-username')?.value;
        const email = document.getElementById('email')?.value || document.getElementById('reg-email')?.value;
        const phoneNumber = document.getElementById('phoneNumber')?.value || '';
        const password = document.getElementById('password')?.value || document.getElementById('reg-password')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        const msgBox = document.getElementById('register-msg');

        if (!msgBox) return;
        msgBox.style.display = 'block';

        if (confirmPassword && password !== confirmPassword) {
            msgBox.innerHTML = '<span style="color: red;">Mật khẩu xác nhận không khớp!</span>';
            return;
        }

        msgBox.innerHTML = '<span style="color: blue;">Đang tạo tài khoản...</span>';

        try {
            const response = await window.apiClient.post('/api/nat/public/auth/register', {
                fullName: fullName,
                email: email,
                phoneNumber: phoneNumber,
                password: password
            });

            msgBox.innerHTML = `<span style="color: green;">${response.message || 'Đăng ký thành công! Đang chuyển hướng...'}</span>`;
            setTimeout(() => {
                window.location.href = '/pages/user/login.html';
            }, 1200);
        } catch (error) {
            msgBox.innerHTML = `<span style="color: red;">${error.message || 'Đăng ký thất bại. Vui lòng thử lại.'}</span>`;
        }
    });
}

// ==========================================
// 3. QUÊN MẬT KHẨU
// ==========================================
function setupExtendFeatures() {
    const btnGoogle = document.getElementById('btn-google');
    if (btnGoogle) btnGoogle.addEventListener('click', () => alert("Chức năng 'Đăng nhập Google' đang phát triển."));
    const btnFacebook = document.getElementById('btn-facebook');
    if (btnFacebook) btnFacebook.addEventListener('click', () => alert("Chức năng 'Đăng nhập Facebook' đang phát triển."));
}
