// Authentication Logic

// Hiển thị alert message
function showAlert(message, type = 'info') {
    const container = document.getElementById('alert-container');
    const alertHtml = `
        <div class="alert alert-${type}">
            ${message}
        </div>
    `;
    container.innerHTML = alertHtml;
    
    // Tự động xóa alert sau 5 giây
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

// Xử lý Đăng Nhập
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('http://localhost:8080/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            showAlert(error.message || 'Email hoặc mật khẩu không chính xác', 'error');
            return;
        }

        const data = await response.json();
        
        // Lưu token
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userName', data.userName);
        
        showAlert('Đăng nhập thành công!', 'success');
        
        // Chuyển hướng sau 1 giây
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Lỗi kết nối với server. Vui lòng kiểm tra backend.', 'error');
    }
}

// Xử lý Đăng Ký
async function handleRegister(event) {
    event.preventDefault();
    
    const fullname = document.getElementById('fullname').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Kiểm tra mật khẩu
    if (password !== confirmPassword) {
        showAlert('Mật khẩu không khớp!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Mật khẩu phải tối thiểu 6 ký tự!', 'error');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:8080/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                email, 
                password, 
                fullname,
                phone
            })
        });

        if (!response.ok) {
            const error = await response.json();
            showAlert(error.message || 'Đăng ký thất bại', 'error');
            return;
        }

        showAlert('Đăng ký thành công! Chuyển hướng đến đăng nhập...', 'success');
        
        // Chuyển hướng đến trang login
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        
    } catch (error) {
        console.error('Register error:', error);
        showAlert('Lỗi kết nối với server. Vui lòng kiểm tra backend.', 'error');
    }
}

// Kiểm tra người dùng đã đăng nhập hay chưa
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../../pages/auth/login.html';
        return false;
    }
    return true;
}

// Đăng xuất
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    window.location.href = '../../index.html';
}

// Lấy thông tin người dùng đã đăng nhập
function getCurrentUser() {
    return {
        userId: localStorage.getItem('userId'),
        userName: localStorage.getItem('userName'),
        token: localStorage.getItem('token')
    };
}
