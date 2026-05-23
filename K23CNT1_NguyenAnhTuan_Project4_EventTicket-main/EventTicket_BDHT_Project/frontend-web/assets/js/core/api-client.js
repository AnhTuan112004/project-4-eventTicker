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

    // Khi Live Server root = /frontend-web, pathname sẽ là /pages/index.html
    // (không chứa /frontend-web/). Trong trường hợp này, root chính là '/'
    return '';
}

function resolveAppUrl(path) {
    if (!path || path.startsWith('http') || path.startsWith('javascript:') || path.startsWith('#') || path.startsWith('data:') || path.startsWith('mailto:') || path.startsWith('tel:')) {
        return path;
    }

    const cleanPath = path.startsWith('./') ? path.slice(2) : path;
    const appRootRelative = cleanPath.startsWith('pages/') || cleanPath.startsWith('components/') || cleanPath.startsWith('assets/') || cleanPath === 'index.html';

    if (cleanPath === 'index.html') {
        const base = getFrontendBasePath();
        return `${base}/pages/index.html`;
    }

    if (appRootRelative) {
        const base = getFrontendBasePath();
        // QUAN TRỌNG: Luôn trả về đường dẫn tuyệt đối (bắt đầu bằng /)
        // để tránh bị resolve tương đối theo vị trí trang hiện tại.
        // Ví dụ: trang ở /pages/index.html, nếu trả về 'components/header.html'
        // trình duyệt sẽ fetch /pages/components/header.html (SAI).
        // Phải trả về '/components/header.html' để fetch đúng.
        return base ? `${base}/${cleanPath}` : `/${cleanPath}`;
    }

    return new URL(cleanPath, window.location.href).href;
}

function rewriteInternalUrls(html) {
    return html.replace(/\b(href|src)="([^"]*)"/g, (match, attr, value) => {
        if (!value || value.startsWith('http') || value.startsWith('javascript:') || value.startsWith('#') || value.startsWith('data:') || value.startsWith('mailto:') || value.startsWith('tel:')) {
            return match;
        }

        return `${attr}="${resolveAppUrl(value)}"`;
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

        // Gắn token vào header nếu có và không phải là endpoint công khai (public/auth/translations)
        const isPublic = endpoint.includes('/public/') || endpoint.includes('/auth/') || endpoint.includes('/translations/');
        if (token && !isPublic) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, config);
            
            // Nếu lỗi 401 (chưa đăng nhập hoặc token hết hạn)
            if (response.status === 401) {
                this.clearToken();
                window.location.href = window.pageUtils.resolveUrl('pages/user/login.html');
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

    // PATCH request
    async patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined
        });
    }
}

// Khởi tạo biến toàn cục để xài ở mọi file HTML
window.apiClient = new ApiClient();

window.pageUtils = {
    getBasePath: getFrontendBasePath,
    resolveUrl: resolveAppUrl,
    rewriteInternalUrls,

    // Promise cache để tránh load header/footer nhiều lần
    _headerPromise: null,
    _footerPromise: null,

    async loadHeader() {
        // Nếu đã có promise đang chạy hoặc đã hoàn thành, trả về luôn (không fetch lại)
        if (this._headerPromise) return this._headerPromise;
        
        this._headerPromise = (async () => {
            try {
                const response = await fetch(this.resolveUrl('components/header.html'));
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                let headerHTML = rewriteInternalUrls(await response.text());
                const headerContainer = document.getElementById('header-container');
                if (headerContainer) {
                    headerContainer.innerHTML = headerHTML;
                    this.setupAuthMenu();
                }
            } catch (error) {
                console.error('Lỗi khi load header:', error);
                this._headerPromise = null; // Reset để có thể thử lại
            }
        })();
        
        return this._headerPromise;
    },

 
    async loadFooter() {
        // Nếu đã có promise đang chạy hoặc đã hoàn thành, trả về luôn (không fetch lại)
        if (this._footerPromise) return this._footerPromise;
        
        this._footerPromise = (async () => {
            try {
                const response = await fetch(this.resolveUrl('components/footer.html'));
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                let footerHTML = rewriteInternalUrls(await response.text());
                
                const footerContainer = document.getElementById('footer-container');
                if (footerContainer) {
                    footerContainer.innerHTML = footerHTML;
                    this.setupFooterEvents();
                    
                    // Tải script ai-chat.js nếu chưa có (để kích hoạt chatbot trên mọi trang)
                    if (!document.querySelector('script[src*="ai-chat.js"]')) {
                        const script = document.createElement('script');
                        script.src = this.resolveUrl('assets/js/ai-chat.js');
                        document.body.appendChild(script);
                    }
                }
            } catch (error) {
                console.error('Lỗi khi load footer:', error);
                this._footerPromise = null; // Reset để có thể thử lại
            }
        })();
        
        return this._footerPromise;
    },

    setupFooterEvents() {
        const subscribeBtn = document.getElementById('subscribe-btn');
        const emailInput = document.getElementById('subscribe-email-input');
        if (subscribeBtn && emailInput) {
            subscribeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const email = emailInput.value.trim();
                if (!email) {
                    alert('Vui lòng nhập địa chỉ email hợp lệ để nhận bản tin!');
                    return;
                }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    alert('Email không đúng định dạng. Vui lòng kiểm tra lại!');
                    return;
                }
                alert(`🎉 Đăng ký nhận bản tin thành công!\nEmail: ${email}\n\nBDHT sẽ gửi các thông tin sự kiện & ưu đãi mới nhất tới hòm thư của bạn.`);
                emailInput.value = '';
            });
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

            // Cập nhật thông tin User động trong Header nếu có dữ liệu lưu trữ
            const userDisplayName = document.getElementById('header-user-display-name');
            const userAvatarChar = document.getElementById('header-user-avatar-char');
            let userObj = null;
            if (storedUser) {
                try { userObj = JSON.parse(storedUser); } catch(e) {}
            }
            // Fallback sang dữ liệu checkout
            if (!userObj) {
                const checkoutDataStr = localStorage.getItem('checkoutData');
                if (checkoutDataStr) {
                    try {
                        const checkoutData = JSON.parse(checkoutDataStr);
                        if (checkoutData.customer) {
                            userObj = { fullName: checkoutData.customer.name };
                        }
                    } catch(e) {}
                }
            }
            if (userObj && userObj.fullName) {
                if (userDisplayName) userDisplayName.innerText = userObj.fullName;
                if (userAvatarChar) userAvatarChar.innerText = userObj.fullName.charAt(0).toUpperCase();
            }

            // Gắn sự kiện click mở Dropdown
            const trigger = document.getElementById('user-dropdown-trigger');
            const menu = document.getElementById('user-dropdown-menu');
            if (trigger && menu) {
                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    menu.classList.toggle('hidden');
                });

                // Đóng dropdown khi click ra bên ngoài
                window.addEventListener('click', () => {
                    if (!menu.classList.contains('hidden')) {
                        menu.classList.add('hidden');
                    }
                });

                // Ngăn sự kiện nổi bong bóng khi click trong menu
                menu.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
            }

            if (btnLogout) {
                btnLogout.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.apiClient.clearToken();
                    window.location.href = window.pageUtils.resolveUrl('index.html');
                });
            }
        } else {
            if (guestMenu) guestMenu.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
        }
    }
};
