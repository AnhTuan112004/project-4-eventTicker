// Event Detail Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    
    if (!eventId) {
        showAlert('Sự kiện không tồn tại', 'error');
        return;
    }
    
    loadEventDetail(eventId);
    loadTicketTypes(eventId);
});

// Lưu trữ event hiện tại
let currentEvent = null;
let selectedTickets = {};

async function loadEventDetail(eventId) {
    try {
        const response = await fetch(`http://localhost:8080/api/public/events/${eventId}`);
        
        if (!response.ok) {
            throw new Error('Không tìm thấy sự kiện');
        }
        
        const event = await response.json();
        currentEvent = event;
        
        displayEventDetail(event);
        
    } catch (error) {
        console.error('Error loading event:', error);
        document.getElementById('event-detail').innerHTML = `
            <div class="alert alert-error">
                ⚠️ Lỗi tải sự kiện: ${error.message}
            </div>
        `;
    }
}

function displayEventDetail(event) {
    const container = document.getElementById('event-detail');
    
    container.innerHTML = `
        <div style="display: flex; gap: 2rem; margin-bottom: 2rem;">
            <div style="flex: 1;">
                <img 
                    src="${event.imageUrl || 'https://via.placeholder.com/400x300?text=Event'}" 
                    alt="${event.name}"
                    style="width: 100%; border-radius: 10px; object-fit: cover; max-height: 400px;"
                    onerror="this.src='https://via.placeholder.com/400x300?text=Event'"
                >
            </div>
            <div style="flex: 1;">
                <h2>${event.name}</h2>
                <p style="color: #666; margin-bottom: 1.5rem;">${event.description || 'Không có mô tả'}</p>
                
                <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px;">
                    <div style="margin-bottom: 1rem;">
                        <strong>📍 Địa điểm:</strong><br>${event.venue}
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <strong>📅 Ngày:</strong><br>${new Date(event.date).toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <strong>⏰ Giờ:</strong><br>${event.time || 'Chưa xác định'}
                    </div>
                    <div>
                        <strong>👥 Độ tuổi:</strong><br>${event.ageRestriction || 'Không hạn chế'}
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadTicketTypes(eventId) {
    try {
        const response = await fetch(`http://localhost:8080/api/public/events/${eventId}/tickets`);
        
        if (!response.ok) {
            throw new Error('Không tìm thấy loại vé');
        }
        
        const tickets = await response.json();
        displayTicketTypes(tickets);
        
    } catch (error) {
        console.error('Error loading tickets:', error);
        document.getElementById('tickets-container').innerHTML = `
            <div class="alert alert-error">
                ⚠️ Lỗi tải loại vé: ${error.message}
            </div>
        `;
    }
}

function displayTicketTypes(tickets) {
    const container = document.getElementById('tickets-container');
    
    if (!tickets || tickets.length === 0) {
        container.innerHTML = '<p>Không có loại vé nào</p>';
        return;
    }
    
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Loại Vé</th>
                    <th>Giá</th>
                    <th>Còn Lại</th>
                    <th>Số Lượng</th>
                </tr>
            </thead>
            <tbody>
                ${tickets.map(ticket => `
                    <tr>
                        <td><strong>${ticket.type}</strong></td>
                        <td>${formatPrice(ticket.price)} VNĐ</td>
                        <td>
                            <span class="badge ${ticket.availableCount > 0 ? 'badge-success' : 'badge-error'}">
                                ${ticket.availableCount} vé
                            </span>
                        </td>
                        <td>
                            <input 
                                type="number" 
                                id="qty-${ticket.id}" 
                                min="0" 
                                max="${ticket.availableCount}" 
                                value="0"
                                style="width: 70px; padding: 0.5rem;"
                                onchange="updateTicketSelection(${ticket.id}, ${ticket.price})"
                            >
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div style="margin-top: 2rem; padding: 1.5rem; background: #f5f5f5; border-radius: 8px; text-align: right;">
            <h4 style="margin-bottom: 0.5rem;">Tổng: <span id="total-price" style="color: #667eea; font-size: 1.5rem;">0</span> VNĐ</h4>
        </div>
    `;
}

function updateTicketSelection(ticketId, price) {
    const quantity = parseInt(document.getElementById(`qty-${ticketId}`).value) || 0;
    
    if (quantity > 0) {
        selectedTickets[ticketId] = { quantity, price };
    } else {
        delete selectedTickets[ticketId];
    }
    
    updateTotalPrice();
}

function updateTotalPrice() {
    const total = Object.values(selectedTickets).reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);
    
    document.getElementById('total-price').textContent = formatPrice(total);
}

function formatPrice(price) {
    if (!price) return '0';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function showAlert(message, type = 'info') {
    const container = document.getElementById('alert-container');
    const alertHtml = `
        <div class="alert alert-${type}">
            ${message}
        </div>
    `;
    container.innerHTML = alertHtml;
}

function bookTickets() {
    const token = localStorage.getItem('token');
    
    // Kiểm tra đăng nhập
    if (!token) {
        showAlert('Vui lòng đăng nhập để đặt vé', 'error');
        setTimeout(() => {
            window.location.href = '../auth/login.html';
        }, 1500);
        return;
    }
    
    // Kiểm tra chọn vé
    if (Object.keys(selectedTickets).length === 0) {
        showAlert('Vui lòng chọn ít nhất 1 loại vé', 'error');
        return;
    }
    
    // Lưu thông tin và chuyển đến checkout
    const bookingData = {
        eventId: currentEvent.id,
        tickets: selectedTickets,
        totalPrice: Object.values(selectedTickets).reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0)
    };
    
    localStorage.setItem('bookingData', JSON.stringify(bookingData));
    window.location.href = 'checkout.html';
}

function goBack() {
    window.history.back();
}
