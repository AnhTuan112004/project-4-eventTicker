# 📮 HƯỚNG DẪN TEST API BẰNG POSTMAN

## 1. SETUP POSTMAN

### Bước 1: Download & Install
- Download Postman từ https://www.postman.com/downloads/
- Hoặc dùng web version tại https://web.postman.co/

### Bước 2: Tạo Collection
1. Click "Create" → "Collection" → Đặt tên "Event Ticket API"
2. Thêm base URL: 
   - **Environment**: Dev
   - **Base URL**: `http://localhost:8080`

### Bước 3: Tạo Environment Variables
1. Click "Environments" → "Create New"
2. Tên: "Event Ticket Dev"
3. Thêm các variables:
   ```
   base_url: http://localhost:8080
   token: (sẽ được cập nhật sau khi login)
   userId: (user id sau khi register)
   eventId: (event id)
   ```

---

## 2. TEST FLOW - USER JOURNEY

### **PHASE 1: AUTH (Đăng Ký & Đăng Nhập)**

#### **Test 1: Đăng Ký (Register)**
```
📌 METHOD: POST
📌 URL: {{base_url}}/api/vtd/public/auth/register
📌 BODY (JSON):
{
    "email": "user1@example.com",
    "password": "Password123",
    "fullName": "Nguyễn Văn A",
    "phoneNumber": "0912345678"
}

✅ EXPECTED RESPONSE (201):
{
    "userId": 1,
    "email": "user1@example.com",
    "fullName": "Nguyễn Văn A",
    "phoneNumber": "0912345678",
    "role": "USER",
    "isActive": true,
    "isVerified": false,
    "createdAt": "2026-05-13T10:30:00"
}

💾 SAVE: Lưu userId vào environment variable {{userId}}
```

---

#### **Test 2: Đăng Nhập (Login)**
```
📌 METHOD: POST
📌 URL: {{base_url}}/api/vtd/public/auth/login
📌 BODY (JSON):
{
    "email": "user1@example.com",
    "password": "Password123"
}

✅ EXPECTED RESPONSE (200):
{
    "userId": 1,
    "email": "user1@example.com",
    "fullName": "Nguyễn Văn A",
    "role": "USER",
    "isActive": true
}

💾 SAVE: Lưu token vào environment variable {{token}}
   (Nếu API trả về token field)
```

---

#### **Test 3: Test Login Sai Password**
```
📌 METHOD: POST
📌 URL: {{base_url}}/api/vtd/public/auth/login
📌 BODY (JSON):
{
    "email": "user1@example.com",
    "password": "WrongPassword"
}

❌ EXPECTED RESPONSE (401/400):
{
    "error": "Mật khẩu không chính xác"
}
```

---

#### **Test 4: Test Email Đã Tồn Tại**
```
📌 METHOD: POST
📌 URL: {{base_url}}/api/vtd/public/auth/register
📌 BODY (JSON):
{
    "email": "user1@example.com",  // Email đã dùng
    "password": "Password456",
    "fullName": "Nguyễn Văn B",
    "phoneNumber": "0987654321"
}

❌ EXPECTED RESPONSE (400):
{
    "error": "Email đã tồn tại trong hệ thống"
}
```

---

### **PHASE 2: EVENTS (Xem Sự Kiện)**

#### **Test 5: Lấy Danh Sách Sự Kiện Nổi Bật**
```
📌 METHOD: GET
📌 URL: {{base_url}}/api/vtd/public/events/featured
📌 HEADERS: Không cần token (PUBLIC)

✅ EXPECTED RESPONSE (200):
[
    {
        "eventId": 1,
        "title": "Concert 2026 - BTS",
        "description": "...",
        "eventDate": "2026-06-15T19:00:00",
        "location": "Sân vận động Quốc gia",
        "totalTickets": 5000,
        "soldTickets": 1200,
        "status": "PUBLISHED"
    },
    {
        "eventId": 2,
        "title": "Comedy Show",
        ...
    }
]
```

---

#### **Test 6: Tìm Kiếm Sự Kiện**
```
📌 METHOD: GET
📌 URL: {{base_url}}/api/vtd/public/events/search?keyword=BTS
📌 HEADERS: Không cần token

✅ EXPECTED RESPONSE (200):
[
    {
        "eventId": 1,
        "title": "Concert 2026 - BTS",
        ...
    }
]
```

---

#### **Test 7: Lọc Sự Kiện Theo Thể Loại**
```
📌 METHOD: GET
📌 URL: {{base_url}}/api/vtd/public/events/category/Concert
📌 HEADERS: Không cần token

✅ EXPECTED RESPONSE (200):
[
    {
        "eventId": 1,
        "title": "Concert 2026 - BTS",
        ...
    }
]
```

---

#### **Test 8: Chi Tiết Sự Kiện**
```
📌 METHOD: GET
📌 URL: {{base_url}}/api/vtd/public/events/{{eventId}}
📌 HEADERS: Không cần token
📌 URL PARAMS: eventId = 1

✅ EXPECTED RESPONSE (200):
{
    "eventId": 1,
    "title": "Concert 2026 - BTS",
    "description": "...",
    "eventDate": "2026-06-15T19:00:00",
    "location": "Sân vận động Quốc gia",
    "totalTickets": 5000,
    "soldTickets": 1200,
    "ticketTypes": [
        {
            "ticketTypeId": 1,
            "typeName": "VIP",
            "price": 500000,
            "totalQuantity": 500,
            "soldQuantity": 150
        },
        {
            "ticketTypeId": 2,
            "typeName": "Standard",
            "price": 200000,
            "totalQuantity": 3000,
            "soldQuantity": 800
        }
    ]
}
```

---

### **PHASE 3: ORDERS (Đặt Vé)**

#### **Test 9: Tạo Đơn Hàng (Create Order)**
```
📌 METHOD: POST
📌 URL: {{base_url}}/api/vtd/user/orders
📌 HEADERS: 
   - Authorization: Bearer {{token}}
   - Content-Type: application/json
📌 BODY (JSON):
{
    "eventId": 1,
    "ticketTypeId": 1,
    "quantity": 2
}

✅ EXPECTED RESPONSE (201):
{
    "orderId": 101,
    "userId": 1,
    "eventId": 1,
    "totalAmount": 1000000,
    "status": "PENDING",
    "createdAt": "2026-05-13T10:35:00"
}

💾 SAVE: Lưu orderId = 101
```

---

#### **Test 10: Lấy Chi Tiết Đơn Hàng**
```
📌 METHOD: GET
📌 URL: {{base_url}}/api/vtd/user/orders/{{orderId}}
📌 HEADERS: 
   - Authorization: Bearer {{token}}

✅ EXPECTED RESPONSE (200):
{
    "orderId": 101,
    "userId": 1,
    "eventId": 1,
    "totalAmount": 1000000,
    "status": "PENDING",
    "items": [
        {
            "orderItemId": 201,
            "ticketTypeId": 1,
            "quantity": 2,
            "price": 500000,
            "subtotal": 1000000
        }
    ],
    "createdAt": "2026-05-13T10:35:00"
}
```

---

#### **Test 11: Lấy Danh Sách Đơn Hàng của User**
```
📌 METHOD: GET
📌 URL: {{base_url}}/api/vtd/user/orders
📌 HEADERS: 
   - Authorization: Bearer {{token}}

✅ EXPECTED RESPONSE (200):
[
    {
        "orderId": 101,
        "eventId": 1,
        "totalAmount": 1000000,
        "status": "PENDING",
        "createdAt": "2026-05-13T10:35:00"
    },
    {
        "orderId": 102,
        ...
    }
]
```

---

### **PHASE 4: PAYMENTS (Thanh Toán)**

#### **Test 12: Tạo Thanh Toán**
```
📌 METHOD: POST
📌 URL: {{base_url}}/api/vtd/user/payments
📌 HEADERS: 
   - Authorization: Bearer {{token}}
   - Content-Type: application/json
📌 BODY (JSON):
{
    "orderId": 101,
    "paymentMethod": "MOMO",
    "amount": 1000000
}

✅ EXPECTED RESPONSE (201):
{
    "paymentId": 501,
    "orderId": 101,
    "amount": 1000000,
    "paymentMethod": "MOMO",
    "status": "PENDING",
    "redirectUrl": "https://momo.vn/pay?token=...",
    "createdAt": "2026-05-13T10:40:00"
}
```

---

#### **Test 13: Kiểm Tra Trạng Thái Thanh Toán**
```
📌 METHOD: GET
📌 URL: {{base_url}}/api/vtd/user/payments/{{paymentId}}
📌 HEADERS: 
   - Authorization: Bearer {{token}}

✅ EXPECTED RESPONSE (200):
{
    "paymentId": 501,
    "orderId": 101,
    "amount": 1000000,
    "paymentMethod": "MOMO",
    "status": "PENDING",  // hoặc COMPLETED, FAILED
    "createdAt": "2026-05-13T10:40:00"
}
```

---

### **PHASE 5: PROMOTIONS (Mã Giảm Giá)**

#### **Test 14: Lấy Danh Sách Promotion**
```
📌 METHOD: GET
📌 URL: {{base_url}}/api/vtd/public/promotions
📌 HEADERS: Không cần token

✅ EXPECTED RESPONSE (200):
[
    {
        "promotionId": 1,
        "code": "SUMMER2026",
        "description": "Giảm 20% cho hè 2026",
        "discountType": "PERCENTAGE",
        "discountValue": 20,
        "maxUsage": 1000,
        "usedCount": 150,
        "validFrom": "2026-06-01T00:00:00",
        "validTo": "2026-08-31T23:59:59",
        "status": "ACTIVE"
    }
]
```

---

#### **Test 15: Áp Dụng Promotion vào Đơn Hàng**
```
📌 METHOD: POST
📌 URL: {{base_url}}/api/vtd/user/orders/{{orderId}}/apply-promotion
📌 HEADERS: 
   - Authorization: Bearer {{token}}
   - Content-Type: application/json
📌 BODY (JSON):
{
    "promotionCode": "SUMMER2026"
}

✅ EXPECTED RESPONSE (200):
{
    "orderId": 101,
    "originalAmount": 1000000,
    "discountAmount": 200000,
    "finalAmount": 800000,
    "promotionCode": "SUMMER2026"
}

❌ ERROR RESPONSE (400):
{
    "error": "Mã khuyến mãi không hợp lệ hoặc hết hạn"
}
```

---

### **PHASE 6: REVIEWS (Đánh Giá)**

#### **Test 16: Thêm Review cho Sự Kiện**
```
📌 METHOD: POST
📌 URL: {{base_url}}/api/vtd/user/reviews
📌 HEADERS: 
   - Authorization: Bearer {{token}}
   - Content-Type: application/json
📌 BODY (JSON):
{
    "eventId": 1,
    "rating": 5,
    "comment": "Sự kiện tuyệt vời! BTS sung hay lắm."
}

✅ EXPECTED RESPONSE (201):
{
    "reviewId": 301,
    "eventId": 1,
    "userId": 1,
    "rating": 5,
    "comment": "Sự kiện tuyệt vời! BTS sung hay lắm.",
    "createdAt": "2026-05-13T11:00:00"
}
```

---

#### **Test 17: Lấy Reviews của Sự Kiện**
```
📌 METHOD: GET
📌 URL: {{base_url}}/api/vtd/public/events/{{eventId}}/reviews
📌 HEADERS: Không cần token

✅ EXPECTED RESPONSE (200):
[
    {
        "reviewId": 301,
        "fullName": "Nguyễn Văn A",
        "rating": 5,
        "comment": "Sự kiện tuyệt vời!",
        "createdAt": "2026-05-13T11:00:00"
    },
    {
        "reviewId": 302,
        ...
    }
]
```

---

### **PHASE 7: USER PROFILE (Hồ Sơ Người Dùng)**

#### **Test 18: Lấy Thông Tin Profile**
```
📌 METHOD: GET
📌 URL: {{base_url}}/api/vtd/user/profile
📌 HEADERS: 
   - Authorization: Bearer {{token}}

✅ EXPECTED RESPONSE (200):
{
    "userId": 1,
    "email": "user1@example.com",
    "fullName": "Nguyễn Văn A",
    "phoneNumber": "0912345678",
    "role": "USER",
    "isActive": true,
    "isVerified": false,
    "createdAt": "2026-05-13T10:30:00"
}
```

---

#### **Test 19: Cập Nhật Profile**
```
📌 METHOD: PUT
📌 URL: {{base_url}}/api/vtd/user/profile
📌 HEADERS: 
   - Authorization: Bearer {{token}}
   - Content-Type: application/json
📌 BODY (JSON):
{
    "fullName": "Nguyễn Văn A - Updated",
    "phoneNumber": "0987654321"
}

✅ EXPECTED RESPONSE (200):
{
    "userId": 1,
    "email": "user1@example.com",
    "fullName": "Nguyễn Văn A - Updated",
    "phoneNumber": "0987654321",
    "role": "USER"
}
```

---

#### **Test 20: Thay Đổi Mật Khẩu**
```
📌 METHOD: POST
📌 URL: {{base_url}}/api/vtd/user/change-password
📌 HEADERS: 
   - Authorization: Bearer {{token}}
   - Content-Type: application/json
📌 BODY (JSON):
{
    "currentPassword": "Password123",
    "newPassword": "NewPassword456",
    "confirmPassword": "NewPassword456"
}

✅ EXPECTED RESPONSE (200):
{
    "message": "Mật khẩu đã được thay đổi thành công"
}

❌ ERROR (401):
{
    "error": "Mật khẩu hiện tại không chính xác"
}
```

---

## 3. TEST SCENARIOS - TRƯỜNG HỢP THỰC TẾ

### **Scenario 1: Happy Path - Đặt Vé & Thanh Toán Thành Công**
```
1. Register user
2. Login
3. Browse events
4. View event details
5. Create order (2 tickets VIP)
6. Apply promotion code "SUMMER2026"
7. Create payment with MOMO
8. [Simulate payment success] - webhook callback
9. Check order status = COMPLETED
10. Leave review
```

### **Scenario 2: Failed Payment & Retry**
```
1. Create order
2. Apply promotion
3. Create payment (fails)
4. Check order status = PAYMENT_FAILED
5. Create new payment attempt
6. [Payment success]
7. Check order status = COMPLETED
```

### **Scenario 3: Invalid Coupon & Recovery**
```
1. Create order with totalAmount 1000000
2. Try to apply expired promo → ERROR
3. Try to apply invalid promo → ERROR
4. Try to apply valid promo → SUCCESS
5. Verify discount applied correctly
```

### **Scenario 4: Out of Stock Handling**
```
1. Event X có 100 tickets VIP còn lại
2. User A order 80 tickets
3. User B order 50 tickets (should fail)
4. Check error: "Không đủ vé còn lại"
```

---

## 4. DEBUGGING TIPS

### **Tip 1: Check Authorization Header**
```
❌ WRONG:
Headers: Authorization: {{token}}

✅ CORRECT:
Headers: Authorization: Bearer {{token}}
```

### **Tip 2: Check Content-Type**
```
❌ WRONG: Gửi JSON mà không có Content-Type header

✅ CORRECT:
Headers: 
  - Content-Type: application/json
```

### **Tip 3: Print Response Details**
```
1. Bấm "Response" tab
2. Xem status code (200, 400, 401, 500)
3. Xem response body
4. Xem response headers
```

### **Tip 4: Test Expired Token**
```
📌 Modify token (xóa ký tự cuối)
📌 Send request
❌ EXPECTED: 401 Unauthorized
```

### **Tip 5: Test Missing Required Field**
```
❌ Test 1: POST /register với thiếu "email"
❌ Test 2: POST /orders với thiếu "quantity"
```

---

## 5. AUTOMATION - POSTMAN SCRIPTING

### **Auto-Save Token (Trong Tests Tab của Login Request)**
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.token);
    console.log("✅ Token saved: " + jsonData.token);
}
```

### **Auto-Save OrderId (Trong Tests Tab của Create Order Request)**
```javascript
if (pm.response.code === 201) {
    var jsonData = pm.response.json();
    pm.environment.set("orderId", jsonData.orderId);
    console.log("✅ Order ID saved: " + jsonData.orderId);
}
```

### **Auto-Save EventId (Trong Tests Tab của Get Featured Events)**
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    if (jsonData.length > 0) {
        pm.environment.set("eventId", jsonData[0].eventId);
        console.log("✅ Event ID saved: " + jsonData[0].eventId);
    }
}
```

---

## 6. ERROR CODES REFERENCE

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | Success ✅ |
| 201 | Created | Resource created ✅ |
| 400 | Bad Request | Check request body |
| 401 | Unauthorized | Check token/auth |
| 403 | Forbidden | No permission |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Server crashed |

---

## 7. QUICK TEST CHECKLIST

- [ ] Start backend server (mvn spring-boot:run)
- [ ] Open Postman
- [ ] Create Collection & Environment
- [ ] Test Register
- [ ] Test Login → Copy token
- [ ] Test Get Events
- [ ] Test Create Order
- [ ] Test Apply Promotion
- [ ] Test Create Payment
- [ ] Test Add Review
- [ ] Test Get Profile
- [ ] Test Update Profile
- [ ] Test Change Password

---

## 8. PRODUCTION READY CHECKLIST

Trước khi deploy, test:
- [ ] All auth flows (register, login, password reset)
- [ ] All CRUD operations (create, read, update, delete)
- [ ] All business logic (promotion, discount, payment)
- [ ] Error cases (invalid input, out of stock, etc.)
- [ ] Security (jwt expiration, unauthorized access)
- [ ] Edge cases (duplicate email, race conditions)

---

**Happy Testing! 🚀**
