document.addEventListener('DOMContentLoaded', async () => {
    if (window.pageUtils && window.pageUtils.loadHeader) {
        await window.pageUtils.loadHeader();
    }
    if (window.pageUtils && window.pageUtils.loadFooter) {
        await window.pageUtils.loadFooter();
    }

    await initAiChat();
});

const CHAT_HISTORY_STORAGE_KEY = 'bdhtLocalChatHistory';
let currentChatBox = null;
let currentChatInput = null;
let currentQuickRepliesContainer = null;
let currentQuickRepliesInner = null;
let chatSessionCode = '';

// FAQs base for instant client-side responses if AI fails or to speed up common interactions
const FAQ_KNOWLEDGE_BASE = [
    {
        keywords: ['thanh toán', 'chuyển khoản', 'vnpay', 'momo', 'thẻ', 'payment', 'mua vé thế nào'],
        title: '💳 Phương thức & Quy trình thanh toán',
        answer: `BDHT hỗ trợ nhiều phương thức thanh toán an toàn và tiện lợi:\n\n` +
            `1. **Cổng VNPay**: Thẻ ATM nội địa, QR Code ngân hàng.\n` +
            `2. **Ví Momo / ShopeePay**.\n` +
            `3. **Thẻ quốc tế**: Visa, Mastercard, JCB.\n\n` +
            `**Quy trình mua vé & thanh toán:**\n` +
            `Bước 1: Chọn sự kiện bạn yêu thích.\n` +
            `Bước 2: Click **"Mua vé ngay"** và chọn loại vé, số lượng.\n` +
            `Bước 3: Nhập thông tin người nhận vé (Họ tên, Email, SĐT).\n` +
            `Bước 4: Click **"Thanh toán"** và quét mã QR hoặc nhập thông tin thẻ để hoàn tất.\n\n` +
            `Vé điện tử kèm **mã QR** sẽ được gửi trực tiếp qua Email của bạn ngay sau khi thanh toán thành công!`,
        chips: ['🎫 Xem sự kiện', '📞 Liên hệ hỗ trợ', '🔄 Đổi/Hủy vé']
    },
    {
        keywords: ['đổi vé', 'hủy vé', 'hoàn tiền', 'refund', 'trả vé', 'chuyển nhượng', 'đổi trả'],
        title: '🔄 Chính sách Đổi / Hủy vé',
        answer: `Chính sách đổi trả vé tại BDHT được quy định như sau:\n\n` +
            `1. **Hủy vé & Hoàn tiền**: Tùy thuộc vào quy định riêng của từng Ban tổ chức sự kiện. Thông thường, yêu cầu hoàn tiền cần gửi trước sự kiện ít nhất **72 giờ**.\n` +
            `2. **Phí hoàn vé**: Phí hoàn trả dao động từ 10% - 20% giá trị vé tùy thời điểm.\n` +
            `3. **Đổi suất diễn/loại vé**: Có thể thực hiện nếu sự kiện còn vé trống và được BTC cho phép.\n` +
            `4. **Chuyển nhượng vé**: Bạn có thể gửi tặng vé QR cho người khác sử dụng một cách hợp lệ.\n\n` +
            `Để gửi yêu cầu, vui lòng vào trang **Lịch sử mua vé** hoặc liên hệ CSKH qua hotline **1900 xxxx** để được hỗ trợ trực tiếp.`,
        chips: ['📞 Liên hệ hỗ trợ', '💳 Quy trình mua vé', '🎫 Sự kiện ca nhạc']
    },
    {
        keywords: ['quên mật khẩu', 'reset password', 'đổi mật khẩu', 'không đăng nhập được', 'lấy lại mật khẩu'],
        title: '🔑 Quên / Đổi mật khẩu',
        answer: `Nếu bạn quên mật khẩu hoặc không thể đăng nhập, hãy làm theo các bước sau:\n\n` +
            `1. Nhấp vào liên kết **"Quên mật khẩu?"** tại trang Đăng nhập.\n` +
            `2. Nhập địa chỉ **Email** tài khoản của bạn.\n` +
            `3. Hệ thống sẽ gửi một liên kết đặt lại mật khẩu về Email đó.\n` +
            `4. Mở Email, click vào link và tạo mật khẩu mới.\n\n` +
            `*Lưu ý*: Hãy kiểm tra thêm thư mục **Spam/Thư rác** nếu không nhận được email sau 2-3 phút.`,
        chips: ['🔑 Đi đến Đăng nhập', '📞 Liên hệ hỗ trợ']
    },
    {
        keywords: ['giới thiệu', 'bdht là gì', 'website gì', 'về chúng tôi', 'liên hệ', 'hotline', 'email', 'support'],
        title: '📞 Về BDHT & Liên hệ hỗ trợ',
        answer: `**BDHT Ticket** là nền tảng đặt vé sự kiện, ca nhạc, workshop, thể thao hàng đầu Việt Nam.\n\n` +
            `**Thông tin liên hệ CSKH:**\n` +
            `- 📞 **Hotline**: 1900 6789 (8h00 - 22h00 hàng ngày)\n` +
            `- ✉️ **Email**: support@bdhtticket.vn\n` +
            `- 🏢 **Địa chỉ**: Tòa nhà BDHT, Cầu Giấy, Hà Nội\n\n` +
            `Chúng tôi luôn sẵn sàng hỗ trợ bạn đặt vé, xử lý sự cố thanh toán hoặc giải đáp thông tin sự kiện!`,
        chips: ['🎫 Xem sự kiện', '💳 Quy trình thanh toán', '🔄 Đổi/Hủy vé']
    },
    {
        keywords: ['hướng dẫn sử dụng', 'cách dùng', 'chức năng', 'web có gì', 'làm thế nào', 'giúp đỡ', 'bắt đầu'],
        title: '🚀 Hướng dẫn sử dụng Website',
        answer: `Chào mừng bạn đến với BDHT Ticket! Đây là các tính năng chính bạn có thể sử dụng trên website của chúng tôi:\n\n` +
            `1. **Tìm kiếm & Lọc sự kiện**: Tìm theo tên sự kiện, lọc theo **Địa điểm** (Hà Nội, TP.HCM...) hoặc **Thể loại** (Concert, Workshop, Vé xem phim...).\n` +
            `2. **Đặt vé nhanh chóng**: Chọn vé, chọn số lượng, điền thông tin và thanh toán online nhận vé QR tức thì.\n` +
            `3. **Quản lý tài khoản**: Xem lại vé đã mua, chỉnh sửa thông tin cá nhân và quản lý lịch sử đơn hàng tại **Trang cá nhân**.\n` +
            `4. **Tin tức**: Cập nhật tin tức hot nhất về âm nhạc, nghệ thuật và đời sống.\n\n` +
            `Bạn muốn tôi hỗ trợ tìm sự kiện hay giải đáp thêm thông tin nào?`,
        chips: ['🎫 Xem sự kiện', '💳 Cách mua vé', '👤 Đăng ký tài khoản']
    }
];

function readLocalChatHistory() {
    try {
        const raw = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw) || [];
    } catch (e) {
        return [];
    }
}

function saveLocalChatHistory(history) {
    try {
        localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(history.slice(-30))); // Keep last 30 messages
    } catch (e) {
        console.warn('Không thể lưu lịch sử chat:', e);
    }
}

function clearLocalChatHistory() {
    localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getEventDetailUrl(event) {
    const eventId = event?.eventId ?? event?.id ?? '';
    if (!eventId) return '#';
    if (window.pageUtils && typeof window.pageUtils.resolveUrl === 'function') {
        return window.pageUtils.resolveUrl(`pages/user/nat-event-detail.html?id=${encodeURIComponent(eventId)}`);
    }
    return `pages/user/nat-event-detail.html?id=${encodeURIComponent(eventId)}`;
}

function getEventImage(event) {
    return event?.bannerImageUrl || event?.imageUrl || event?.thumbnailUrl || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80';
}

function formatEventTime(event) {
    const start = event?.startTime || event?.startDate;
    if (!start) return 'Thời gian chưa cập nhật';
    return new Date(start).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function buildEventCardHtml(event) {
    const title = escapeHtml(event?.title || 'Sự kiện');
    const category = escapeHtml(event?.categoryName || '');
    const venue = escapeHtml(event?.venue?.venueName || event?.venueName || 'Địa điểm trực tuyến');
    const time = escapeHtml(formatEventTime(event));
    const image = escapeHtml(getEventImage(event));
    const price = event?.price != null ? `${Number(event.price).toLocaleString('vi-VN')} VNĐ` : 'Liên hệ để biết giá';
    const detailUrl = getEventDetailUrl(event);

    return `
        <div class="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:border-orange-100">
            <div class="relative h-32 overflow-hidden">
                <img src="${image}" alt="${title}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                <span class="absolute top-2 right-2 text-[10px] font-black text-white bg-gradient-to-r from-orange-500 to-rose-500 px-2.5 py-1 rounded-full shadow-sm">${escapeHtml(price)}</span>
            </div>
            <div class="p-3.5 space-y-2">
                <div>
                    ${category ? `<span class="text-[9px] text-orange-500 font-extrabold uppercase bg-orange-50 px-2 py-0.5 rounded-full inline-block mb-1">${category}</span>` : ''}
                    <p class="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">${title}</p>
                </div>
                <div class="space-y-1 text-[11px] text-slate-500 font-medium">
                    <p class="truncate"><i class="fas fa-map-marker-alt text-orange-400 mr-1"></i> ${venue}</p>
                    <p class="truncate"><i class="fas fa-calendar-alt text-orange-400 mr-1"></i> ${time}</p>
                </div>
                <div class="pt-1.5 flex gap-1.5">
                    <a href="${detailUrl}" class="flex-1 inline-flex items-center justify-center py-1.5 rounded-full bg-slate-900 text-white text-[10px] font-bold hover:bg-orange-500 transition-colors shadow-sm">Mua vé ngay</a>
                </div>
            </div>
        </div>
    `;
}

function appendMessage(sender, text, skipSave = false) {
    if (!currentChatBox) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'flex gap-3 items-start animate-fade-in';

    if (sender === 'user') {
        msgDiv.className += ' justify-end';
        const bubble = document.createElement('div');
        bubble.className = 'bg-gradient-to-r from-orange-500 to-rose-500 text-white px-4 py-3 rounded-[22px] rounded-tr-sm shadow-sm max-w-[85%] leading-relaxed text-sm font-semibold';
        bubble.textContent = text;
        msgDiv.appendChild(bubble);
    } else {
        const avatar = document.createElement('div');
        avatar.className = 'w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-rose-400 text-white flex items-center justify-center shrink-0 shadow-sm';
        avatar.innerHTML = '<i class="fas fa-robot text-xs"></i>';

        const bubble = document.createElement('div');
        bubble.className = 'bg-white border border-gray-100 px-4 py-3 rounded-[22px] rounded-tl-sm shadow-sm max-w-[85%] leading-relaxed text-sm text-gray-700';
        
        // Render simple markdown like **bold**, \n to breaks
        let formattedText = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br />');
        
        bubble.innerHTML = formattedText;

        msgDiv.appendChild(avatar);
        msgDiv.appendChild(bubble);
    }

    currentChatBox.appendChild(msgDiv);
    currentChatBox.scrollTop = currentChatBox.scrollHeight;

    if (!skipSave) {
        const history = readLocalChatHistory();
        history.push({ sender, text });
        saveLocalChatHistory(history);
    }
}

function appendAssistantCard(html, skipSave = false) {
    if (!currentChatBox) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'flex gap-3 items-start animate-fade-in';
    wrapper.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-rose-400 text-white flex items-center justify-center shrink-0 shadow-sm">
            <i class="fas fa-robot text-xs"></i>
        </div>
        <div class="max-w-[85%] flex-1">${html}</div>
    `;
    currentChatBox.appendChild(wrapper);
    currentChatBox.scrollTop = currentChatBox.scrollHeight;

    if (!skipSave) {
        const history = readLocalChatHistory();
        history.push({ sender: 'ai_html', html });
        saveLocalChatHistory(history);
    }
}

function showLoadingIndicator() {
    if (!currentChatBox) return;
    removeLoadingIndicator();

    const loader = document.createElement('div');
    loader.className = 'flex gap-3 items-start';
    loader.id = 'ai-chat-loading-indicator';
    loader.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-rose-400 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
            <i class="fas fa-robot text-xs"></i>
        </div>
        <div class="bg-white border border-gray-100 px-4 py-3 rounded-[22px] rounded-tl-sm shadow-sm max-w-[80%] text-sm text-slate-400 flex items-center gap-1.5">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>
    `;
    currentChatBox.appendChild(loader);
    currentChatBox.scrollTop = currentChatBox.scrollHeight;
}

function removeLoadingIndicator() {
    const loader = document.getElementById('ai-chat-loading-indicator');
    if (loader) loader.remove();
}

// Function to fetch active published events from the API client
async function fetchLiveEvents() {
    try {
        if (window.apiClient) {
            const res = await window.apiClient.getPublicEvents({ page: 0, size: 50 });
            if (Array.isArray(res)) return res.filter(e => e.status === 'PUBLISHED');
            if (res && Array.isArray(res.content)) return res.content.filter(e => e.status === 'PUBLISHED');
        }
    } catch (e) {
        console.error('Lỗi khi fetch sự kiện cho AI Chat:', e);
    }
    return [];
}

// Render dynamic suggestion chips after messages
function setQuickReplyChips(chips) {
    if (!currentQuickRepliesContainer || !currentQuickRepliesInner) return;
    
    if (!chips || chips.length === 0) {
        currentQuickRepliesContainer.style.display = 'none';
        return;
    }

    currentQuickRepliesInner.innerHTML = '';
    chips.forEach(chipText => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chat-chip';
        btn.innerHTML = escapeHtml(chipText);
        btn.addEventListener('click', () => {
            if (currentChatInput) {
                currentChatInput.value = chipText.replace(/^[^\s\w]*/, '').trim(); // strip emojis if any
                sendChatMessage();
            }
        });
        currentQuickRepliesInner.appendChild(btn);
    });

    currentQuickRepliesContainer.style.display = 'block';
}

// Smart local processing before sending to the backend AI to provide instantaneous answers
async function processSmartIntent(message) {
    const msg = message.toLowerCase().trim();

    // 1. GREETING INTENT
    if (/^(hello|hi|xin chào|chào bạn|chào robot|lô|chào)/i.test(msg)) {
        return {
            text: `Xin chào! Tôi là **BDHT Assistant** 🤖. Tôi có thể hỗ trợ bạn tìm kiếm sự kiện, hướng dẫn đặt vé, thanh toán, hoặc trả lời các câu hỏi về website.\n\nBạn muốn tôi trợ giúp gì hôm nay?`,
            chips: ['🎫 Xem sự kiện nổi bật', '💳 Cách mua vé', '📞 Liên hệ hỗ trợ']
        };
    }

    // 2. THANKS INTENT
    if (/^(cảm ơn|cám ơn|thank|tks|ok cảm ơn|ok cám ơn)/i.test(msg)) {
        return {
            text: `Rất vui được hỗ trợ bạn! Chúc bạn có những trải nghiệm tuyệt vời cùng BDHT Ticket. Nếu có câu hỏi nào khác, cứ tự nhiên hỏi tôi nhé! 😊`,
            chips: ['🎫 Xem sự kiện khác', '💳 Hướng dẫn mua vé']
        };
    }

    // 3. SPECIAL DYNAMIC EVENTS RETRIEVAL
    if (/(sự kiện|liveshow|concert|show diễn|vé ca nhạc|xem sự kiện|vé xem phim|workshop|thể thao|hoạt động|chương trình)/i.test(msg) || 
        /(nổi bật|hot nhất|có gì hot|ở hà nội|ở hcm|ở sài gòn|gần đây|tìm vé|mua vé)/i.test(msg)) {
        
        showLoadingIndicator();
        const events = await fetchLiveEvents();
        removeLoadingIndicator();

        if (events.length === 0) {
            return {
                text: `Hiện tại hệ thống chưa cập nhật sự kiện mới hoặc tôi không thể tải được danh sách sự kiện. Bạn vui lòng truy cập trang **[Tất cả sự kiện](${window.pageUtils?.resolveUrl('pages/user/nat-all-events.html') || 'nat-all-events.html'})** để cập nhật thông tin mới nhất nhé!`,
                chips: ['💳 Cách thanh toán', '📞 Liên hệ hỗ trợ']
            };
        }

        // Filter events by keywords if specified
        let filtered = events;
        let filterMsg = "nổi bật nhất hiện tại";

        if (msg.includes('hà nội')) {
            filtered = events.filter(e => {
                const venueStr = `${e.venue?.venueName} ${e.venue?.address} ${e.venue?.city}`.toLowerCase();
                return venueStr.includes('hà nội') || venueStr.includes('ha noi');
            });
            filterMsg = "tại Hà Nội";
        } else if (msg.includes('hcm') || msg.includes('sài gòn') || msg.includes('hồ chí minh')) {
            filtered = events.filter(e => {
                const venueStr = `${e.venue?.venueName} ${e.venue?.address} ${e.venue?.city}`.toLowerCase();
                return venueStr.includes('hồ chí minh') || venueStr.includes('hcm') || venueStr.includes('sài gòn') || venueStr.includes('sai gon');
            });
            filterMsg = "tại TP. Hồ Chí Minh";
        } else if (msg.includes('ca nhạc') || msg.includes('concert') || msg.includes('liveshow') || msg.includes('show')) {
            filtered = events.filter(e => {
                const catStr = `${e.categoryName} ${e.title}`.toLowerCase();
                return catStr.includes('ca nhạc') || catStr.includes('concert') || catStr.includes('liveshow') || catStr.includes('show') || catStr.includes('music');
            });
            filterMsg = "thể loại Ca nhạc & Liveshow";
        } else if (msg.includes('workshop') || msg.includes('hội thảo') || msg.includes('học tập')) {
            filtered = events.filter(e => {
                const catStr = `${e.categoryName} ${e.title}`.toLowerCase();
                return catStr.includes('workshop') || catStr.includes('hội thảo') || catStr.includes('seminar') || catStr.includes('lớp học');
            });
            filterMsg = "thể loại Workshop & Hội thảo";
        }

        // Fallback to top events if filtering returned empty
        if (filtered.length === 0) {
            filtered = events;
            filterMsg = "nổi bật nhất đang diễn ra";
        }

        // Limit results to top 3 cards
        const topEvents = filtered.slice(0, 3);
        const cardHtml = `
            <div class="space-y-3">
                <p class="text-sm font-extrabold text-slate-800">Dưới đây là các sự kiện ${filterMsg}:</p>
                <div class="grid gap-3.5 sm:grid-cols-1">${topEvents.map(e => buildEventCardHtml(e)).join('')}</div>
                <p class="text-[11px] text-slate-500 font-medium">Bạn có thể nhấp vào **"Mua vé ngay"** của từng sự kiện để xem sơ đồ ghế và đặt mua trực tiếp.</p>
            </div>
        `;

        return {
            html: cardHtml,
            chips: ['💳 Cách mua vé', '🔄 Đổi/Hủy vé', '📞 Liên hệ hỗ trợ']
        };
    }

    // 4. CHECK USER/LOGIN/REGISTER FLOWS
    if (/(đăng nhập|login|tài khoản|sign in)/i.test(msg) && !/(đăng ký|register|tạo tài khoản)/i.test(msg)) {
        const loginUrl = window.pageUtils?.resolveUrl('pages/user/nat-login.html') || 'nat-login.html';
        return {
            text: `Bạn có thể đăng nhập vào hệ thống BDHT bằng cách click vào **[Trang Đăng Nhập](${loginUrl})**.\n\nSau khi đăng nhập thành công, bạn sẽ dễ dàng quản lý thông tin cá nhân, tra cứu vé đã mua và thanh toán nhanh chóng hơn.`,
            chips: ['👤 Đăng ký tài khoản', '🔑 Quên mật khẩu']
        };
    }

    if (/(đăng ký|register|tạo tài khoản|sign up)/i.test(msg)) {
        const registerUrl = window.pageUtils?.resolveUrl('pages/user/nat-register.html') || 'nat-register.html';
        return {
            text: `Để đăng ký tài khoản mới, vui lòng truy cập **[Trang Đăng Ký](${registerUrl})**.\n\nĐiền đầy đủ thông tin: Họ tên, Email, Số điện thoại và Mật khẩu để bắt đầu sở hữu tài khoản BDHT với nhiều ưu đãi hấp dẫn!`,
            chips: ['🔑 Đi đến Đăng nhập', '📞 Liên hệ hỗ trợ']
        };
    }

    // 5. MATCH FAQ KNOWLEDGE BASE
    for (const faq of FAQ_KNOWLEDGE_BASE) {
        if (faq.keywords.some(keyword => msg.includes(keyword))) {
            return {
                text: `### ${faq.title}\n\n${faq.answer}`,
                chips: faq.chips
            };
        }
    }

    // No local intent detected, fallback to standard LLM integration
    return null;
}

async function sendChatMessage() {
    if (!currentChatInput) return;

    const message = currentChatInput.value.trim();
    if (!message) return;

    // Display user message instantly
    appendMessage('user', message);
    currentChatInput.value = '';

    // Trigger typing indicator
    showLoadingIndicator();

    try {
        // Try locally first
        const localResponse = await processSmartIntent(message);
        if (localResponse) {
            removeLoadingIndicator();
            if (localResponse.html) {
                appendAssistantCard(localResponse.html);
            } else {
                appendMessage('ai', localResponse.text);
            }
            setQuickReplyChips(localResponse.chips);
            return;
        }

        // Call backend API if no quick response matched
        if (!chatSessionCode) {
            chatSessionCode = crypto.randomUUID();
        }

        if (window.apiClient) {
            const response = await window.apiClient.post('/api/vtd/public/ai-chat/message', {
                sessionCode: chatSessionCode,
                message: message
            });

            removeLoadingIndicator();

            const aiText = response?.aiResponse?.messageText || 
                           response?.aiResponse?.message || 
                           response?.aiResponse?.content || 
                           response?.aiResponse?.response || 
                           "Tôi xin lỗi, hiện tại tôi đang gặp khó khăn khi kết nối với máy chủ. Bạn có cần tôi hỗ trợ các chức năng mua vé hay giải đáp FAQ không?";

            appendMessage('ai', aiText);
            setQuickReplyChips(['🎫 Xem sự kiện', '💳 Quy trình thanh toán', '🔄 Đổi/Hủy vé', '📞 Liên hệ hỗ trợ']);
        } else {
            throw new Error('API Client not initialized');
        }
    } catch (error) {
        console.error('Lỗi gửi tin nhắn:', error);
        removeLoadingIndicator();
        appendMessage('ai', `Hệ thống hỗ trợ AI đang bận. Đừng lo lắng, bạn vẫn có thể thực hiện mọi thao tác mua bán vé dễ dàng:\n\n` +
            `- Để **mua vé**: Nhấp chọn bất kỳ sự kiện nào bên ngoài màn hình, xem chi tiết và nhấp **"Mua vé ngay"**.\n` +
            `- Để **thanh toán**: Sau khi điền thông tin người nhận, click **"Thanh toán"** để chuyển sang cổng VNPay hoặc ví điện tử.\n` +
            `- Để **đăng nhập / đăng ký**: Click vào nút tương ứng trên thanh điều hướng đầu trang.\n\n` +
            `Tôi hỗ trợ thêm gì cho bạn nữa không?`);
        setQuickReplyChips(['🎫 Xem sự kiện', '💳 Quy trình thanh toán', '📞 Liên hệ hỗ trợ']);
    }
}

async function initAiChat() {
    let fab = document.getElementById('chat-widget-fab');
    let popup = document.getElementById('chat-popup-container');

    if (!fab || !popup) {
        try {
            const widgetUrl = (window.pageUtils && typeof window.pageUtils.resolveUrl === 'function')
                ? window.pageUtils.resolveUrl('components/nat-chat-widget.html')
                : '../components/nat-chat-widget.html';

            const response = await fetch(widgetUrl);
            if (!response.ok) {
                console.error('Không thể tải chat widget');
                return;
            }

            document.body.insertAdjacentHTML('beforeend', await response.text());
            fab = document.getElementById('chat-widget-fab');
            popup = document.getElementById('chat-popup-container');
        } catch (error) {
            console.error('Không thể load chat widget:', error);
            return;
        }
    }

    if (!fab || !popup) return;

    const fabChatIcon = document.getElementById('fab-chat-icon');
    const fabCloseIcon = document.getElementById('fab-close-icon');
    const fabBadge = document.getElementById('fab-notification-badge');
    const chatCloseBtn = document.getElementById('chat-close-btn');
    const chatClearBtn = document.getElementById('chat-clear-btn');
    const chatInput = document.getElementById('chat-input-field');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatBox = document.getElementById('chat-messages-box');
    
    currentChatBox = chatBox;
    currentChatInput = chatInput;
    currentQuickRepliesContainer = document.getElementById('chat-quick-replies');
    currentQuickRepliesInner = document.getElementById('chat-quick-replies-inner');

    if (!chatInput || !chatSendBtn || !chatBox) return;

    // Show initial dynamic notification badge to draw attention
    setTimeout(() => {
        if (popup.classList.contains('hidden') && fabBadge) {
            fabBadge.classList.remove('hidden');
        }
    }, 4000);

    const openPopup = () => {
        popup.classList.remove('hidden');
        fabChatIcon?.classList.add('hidden');
        fabCloseIcon?.classList.remove('hidden');
        if (fabBadge) fabBadge.classList.add('hidden');
        requestAnimationFrame(() => chatInput.focus());
    };

    const closePopup = () => {
        popup.classList.add('hidden');
        fabChatIcon?.classList.remove('hidden');
        fabCloseIcon?.classList.add('hidden');
    };

    fab.addEventListener('click', (event) => {
        event.stopPropagation();
        if (popup.classList.contains('hidden')) {
            openPopup();
        } else {
            closePopup();
        }
    });

    chatCloseBtn?.addEventListener('click', closePopup);

    chatClearBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Bạn có muốn xóa toàn bộ lịch sử trò chuyện này không?')) {
            clearLocalChatHistory();
            chatBox.innerHTML = '';
            showWelcomeMessage();
        }
    });

    window.addEventListener('click', (event) => {
        if (!popup.classList.contains('hidden') && !popup.contains(event.target) && !fab.contains(event.target)) {
            closePopup();
        }
    });

    popup.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    chatInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendChatMessage();
        }
    });

    chatSendBtn.addEventListener('click', sendChatMessage);

    // Initial message display logic
    const showWelcomeMessage = () => {
        const stored = readLocalChatHistory();
        if (stored.length > 0) {
            stored.forEach(msg => {
                if (msg.sender === 'ai_html') {
                    appendAssistantCard(msg.html, true);
                } else {
                    appendMessage(msg.sender, msg.text, true);
                }
            });
        } else {
            appendMessage('ai', `Xin chào! Tôi là trợ lý ảo thông minh **BDHT Assistant** 🤖.\n\nTôi có thể giúp gì cho bạn hôm nay?\n- 🎫 Tìm sự kiện nổi bật, liveshow ca nhạc, workshop học tập.\n- 💳 Hướng dẫn quy trình đặt vé và thanh toán trực tuyến.\n- 🔄 Giải đáp chính sách đổi/hủy vé, hoàn tiền.\n- 🔑 Trợ giúp về tài khoản và các vấn đề kỹ thuật.`, true);
        }
        setQuickReplyChips(['🎫 Sự kiện nổi bật', '💳 Hướng dẫn mua vé', '🔄 Chính sách đổi/hủy vé', '📞 Liên hệ hỗ trợ']);
    };

    showWelcomeMessage();
}
