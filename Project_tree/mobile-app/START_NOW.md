# 🚀 CHẠY APP NGAY

## ✅ ĐÃ SỬA XONG

1. ✅ Xóa node_modules, .expo, package-lock.json
2. ✅ Cài lại dependencies: `npm install --legacy-peer-deps`
3. ✅ Sửa tất cả lỗi TypeScript
4. ✅ Sửa lỗi import React hooks
5. ✅ Xóa react-native-gifted-chat (gây lỗi reanimated)
6. ✅ Tạo chat UI đơn giản không cần dependencies phức tạp
7. ✅ Đã start Metro bundler: `npm start -- --clear`

## 📱 CÁCH CHẠY

### Bước 1: Kiểm tra Metro Bundler
Metro bundler đang chạy. Đợi đến khi thấy:
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above
```

### Bước 2: Cập nhật IP trong .env
```bash
# File: mobile-app/.env
API_URL=http://YOUR_COMPUTER_IP:3000/api-core
```

Lấy IP máy tính:
```bash
ipconfig
# Tìm IPv4 Address (ví dụ: 192.168.1.100)
```

### Bước 3: Mở Expo Go trên điện thoại
- Mở app Expo Go
- Scan QR code từ terminal
- Đợi app load

### Bước 4: Test app
1. **Login**: Dùng user có roleCode = 'thanhvien' hoặc 'admin'
2. **Home**: Xem thống kê
3. **Members**: Tìm kiếm thành viên
4. **Chat**: Hỏi AI chatbot (Text-to-SQL)
5. **Finance**: Xem thu chi
6. **Profile**: Xem thông tin cá nhân

## 🔧 NẾU VẪN LỖI PlatformConstants

### Giải pháp 1: Downgrade Expo SDK
```bash
cd mobile-app
npm install expo@~51.0.0 --legacy-peer-deps
npx expo install --fix --legacy-peer-deps
npm start -- --clear
```

### Giải pháp 2: Prebuild (Nâng cao)
```bash
npx expo prebuild --clean
npm start
```

### Giải pháp 3: Dùng Development Build
```bash
npx expo run:android
# hoặc
npx expo run:ios
```

## 📝 THÔNG TIN QUAN TRỌNG

### Backend API
- URL: `http://YOUR_IP:3000/api-core`
- Endpoint Text-to-SQL: `/text2sql/query`
- Phải chạy backend trước khi test mobile

### User Login
- Chỉ user có `roleCode = 'thanhvien'` hoặc `'admin'` mới login được
- Kiểm tra trong database: `SELECT * FROM nguoidung WHERE roleCode IN ('thanhvien', 'admin')`

### Chatbot
- Dùng Text-to-SQL service từ backend
- Không dùng AI-service riêng
- Format câu trả lời: count, list, hoặc empty

## 🎯 CÁC SCREEN ĐÃ TẠO

1. **Login** (`app/(auth)/login.tsx`)
   - Form đăng nhập
   - Kiểm tra roleCode
   - Lưu token vào AsyncStorage

2. **Home** (`app/(tabs)/home.tsx`)
   - Thống kê tổng quan
   - Danh sách sự kiện sắp tới
   - Card thông tin nhanh

3. **Members** (`app/(tabs)/members.tsx`)
   - Tìm kiếm thành viên
   - Hiển thị danh sách
   - Chi tiết thành viên

4. **Chat** (`app/(tabs)/chat.tsx`)
   - UI chat đơn giản (không dùng gifted-chat)
   - Tích hợp Text-to-SQL
   - Format câu trả lời đẹp

5. **Finance** (`app/(tabs)/finance.tsx`)
   - Tab Thu/Chi
   - Danh sách giao dịch
   - Tổng thu chi

6. **Profile** (`app/(tabs)/profile.tsx`)
   - Thông tin user
   - Logout

## 🐛 DEBUG

### Xem logs
```bash
# Trong terminal Expo
j  # Mở debugger
r  # Reload app
c  # Clear cache và reload
```

### Test API trực tiếp
```bash
# Health check
curl http://YOUR_IP:3000/api-core/text2sql/health

# Login
curl -X POST http://YOUR_IP:3000/api-core/nguoidung/login \
  -H "Content-Type: application/json" \
  -d '{"tenDangNhap":"test","matKhau":"test123"}'
```

## ✅ CHECKLIST

- [ ] Backend đang chạy (port 3000)
- [ ] IP trong .env đúng
- [ ] Điện thoại và máy cùng WiFi
- [ ] Firewall không chặn port 3000
- [ ] Metro bundler đã start xong
- [ ] Expo Go đã cài trên điện thoại
- [ ] Scan QR code thành công
- [ ] App load không lỗi đỏ

---

**Nếu app chạy được, bạn sẽ thấy màn hình login màu nâu đẹp!** 🎉
