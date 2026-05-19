// API Client - Core module for making requests to backend
// Attach JWT token to all requests

const API_BASE_URL = 'http://localhost:8080';

function getFrontendBasePath() {
    const path = window.location.pathname.replace(/\\/g, '/');
    const marker = '/frontend-web/';
    const markerIndex = path.indexOf(marker);

    if (markerIndex !== -1) {
        return path.substring(0, markerIndex + marker.length - 1);
    }

    return '';
}

function resolveAppUrl(path) {
    if (!path || path.startsWith('http') || path.startsWith('javascript:') || path.startsWith('#')) {
        return path;
    }

    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${getFrontendBasePath()}${cleanPath}`;
}

function rewriteInternalUrls(html) {
    return html.replace(/\b(href|src)="\/(?!\/)([^"]*)"/g, (match, attr, path) => {
        return `${attr}="${resolveAppUrl(`/${path}`)}"`;
    });
}

class ApiClient {
    // Lấy JWT token từ localStorage
    getToken() {
        return localStorage.getItem('token');
    }

    // Lưu JWT token
    setToken(token) {
        localStorage.setItem('token', token);
    }

    // Xóa token và thông tin user (đăng xuất)
    clearToken() {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
    }

    // Make authenticated request
    async request(endpoint, options = {}) {
        const token = this.getToken();
        const url = `${API_BASE_URL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Gắn token vào header nếu có
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, config);
            
            // Nếu lỗi 401 (chưa đăng nhập hoặc token hết hạn)
            if (response.status === 401) {
                this.clearToken();
                window.location.href = window.pageUtils.resolveUrl('/pages/user/login.html');
                return null;
            }

            // Chống lỗi "Unexpected end of JSON input"
            // Khi Backend trả về code 200 nhưng body rỗng (ví dụ xóa thành công), response.json() sẽ làm sập web.
            const text = await response.text();
            let data = {};
            if (text) {
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    data = text; // Nếu trả về string thuần thì lấy string
                }
            }

            // Lấy câu thông báo lỗi thực tế từ Spring Boot trả về
            if (!response.ok) {
                const errorMessage = data.message || data.error || `HTTP error! status: ${response.status}`;
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, error);
            throw error; // Ném lỗi ra ngoài để các file khác (như auth.js) bắt được
        }
    }

    // GET request
    async get(endpoint) {
        return this.request(endpoint);
    }

    // POST request
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT request
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// Khởi tạo biến toàn cục để xài ở mọi file HTML
window.apiClient = new ApiClient();

window.pageUtils = {
    getBasePath: getFrontendBasePath,
    resolveUrl: resolveAppUrl,
    rewriteInternalUrls,

    async loadHeader() {
        try {
            const response = await fetch(this.resolveUrl('/components/header.html'));
            let headerHTML = rewriteInternalUrls(await response.text());
            const headerContainer = document.getElementById('header-container');
            if (headerContainer) {
                headerContainer.innerHTML = headerHTML;
                this.setupAuthMenu();
            }
        } catch (error) {
            console.error('Lỗi khi load header:', error);
        }
    },

 
    async loadFooter() {
            try {
                const response = await fetch(this.resolveUrl('/components/footer.html'));
                let footerHTML = rewriteInternalUrls(await response.text());
                
                const footerContainer = document.getElementById('footer-container');
                if (footerContainer) {
                    footerContainer.innerHTML = footerHTML;
                }
            } catch (error) {
                console.error('Lỗi khi load footer:', error);
            }
        },
        
    setupAuthMenu() {
        const token = window.apiClient ? window.apiClient.getToken() : null;
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
                    window.location.href = window.pageUtils.resolveUrl('/pages/index.html');
                });
            }
        } else {
            if (guestMenu) guestMenu.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
        }
    }
};
