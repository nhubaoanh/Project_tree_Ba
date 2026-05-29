ản đóng góp

## 🎨 Customization

### Thay đổi màu chủ đạo

Sửa file `src/components/common/AppHeader.tsx` và các file styles:

```typescript
const PRIMARY_COLOR = '#4472C4'; // Màu xanh dương
```

### Thêm tính năng mới

1. Tạo service trong `src/services/`
2. Tạo component trong `src/components/`
3. Tạo screen trong `app/(tabs)/`
4. Thêm route trong `app/(tabs)/_layout.tsx`

## 📄 License

MIT
T http://YOUR_IP:3000/api-core/text2sql/query`
3. Xem logs backend để debug

## 📝 API Endpoints sử dụng

- `POST /nguoidung/login` - Đăng nhập
- `POST /nguoidung/refresh-token` - Refresh token
- `POST /text2sql/query` - Chatbot query
- `GET /text2sql/examples` - Lấy câu hỏi mẫu
- `POST /sukien/search` - Tìm kiếm sự kiện
- `POST /thanhvien/search-by-dongho` - Tìm kiếm thành viên
- `POST /taichinh-thu/search` - Danh sách thu
- `POST /taichinh-chi/search` - Danh sách chi
- `POST /taichinh-thu/create` - Tạo kho
└── package.json
```

## 🔧 Troubleshooting

### Lỗi kết nối API

1. Kiểm tra backend đang chạy: `http://YOUR_IP:3000/api-core/text2sql/health`
2. Kiểm tra firewall không chặn port 3000
3. Đảm bảo điện thoại và máy tính cùng mạng WiFi
4. Thử dùng IP thay vì localhost

### Lỗi "Network request failed"

- Kiểm tra `.env` có đúng IP không
- Restart Expo: `r` trong terminal
- Clear cache: `expo start -c`

### Chatbot không hoạt động

1. Kiểm tra backend có GROQ_API_KEY hoặc GEMINI_API_KEY
2. Test endpoint: `POS        # Common components (Header, EmptyState, Loading)
│   │   └── events/         # Event-specific components
│   ├── context/            # React Context (Auth)
│   ├── hooks/              # Custom hooks (useAsync, useRefresh)
│   ├── services/           # API services
│   ├── types/              # TypeScript types
│   ├── utils/              # Utility functions
│   └── config/             # Configuration (API)
├── assets/                 # Images, icons
├── .env                    # Environment variables
- Lọc theo giới tính, đời

### Tài chính

- Xem danh sách thu/chi
- Đóng góp trực tiếp từ app
- Theo dõi tổng thu chi

## 🏗️ Cấu trúc dự án

```
mobile-app/
├── app/                      # Expo Router screens
│   ├── (auth)/              # Auth screens (login)
│   ├── (tabs)/              # Tab screens (home, members, chat, finance, profile)
│   ├── _layout.tsx          # Root layout
│   └── index.tsx            # Entry point
├── src/
│   ├── components/          # Reusable components
│   │   ├── common/ thoại và máy tính cùng mạng WiFi

## 📱 Sử dụng

### Đăng nhập

- Sử dụng tài khoản có `roleCode = 'thanhvien'` hoặc `'admin'`
- Ví dụ: username/password từ database

### Chatbot AI

Chatbot sử dụng Text-to-SQL service từ backend. Bạn có thể hỏi:

- "Có bao nhiêu thành viên trong dòng họ?"
- "Có bao nhiêu thành viên nam?"
- "Danh sách thành viên đời thứ 3"
- "Có bao nhiêu người còn sống?"
- "Thành viên trẻ nhất là ai?"

### Tra cứu họ hàng

- Tìm kiếm theo tên, số điện thoại
- Xem thông tin chi tiết thành viênpconfig` (tìm IPv4 Address)
- Mac/Linux: `ifconfig` hoặc `ip addr`

### 3. Chạy ứng dụng

```bash
# Khởi động Expo
npm start

# Hoặc chạy trực tiếp trên Android
npm run android

# Hoặc chạy trực tiếp trên iOS
npm run ios
```

### 4. Quét QR code

- Cài đặt **Expo Go** trên điện thoại
- Quét QR code từ terminal
- Đảm bảo điện  ra
- ✅ Tra cứu thông tin họ hàng
- ✅ Chatbot AI (Text-to-SQL) - Hỏi đáp bằng tiếng Việt
- ✅ Quản lý tài chính (xem thu chi, đóng góp)
- ✅ Quản lý thông tin cá nhân

## 📋 Yêu cầu

- Node.js >= 18
- npm hoặc yarn
- Expo CLI
- Backend API đang chạy

## 🛠️ Cài đặt

### 1. Clone và cài đặt dependencies

```bash
cd mobile-app
npm install
```

### 2. Cấu hình API

Sửa file `.env`:

```env
API_URL=http://YOUR_IP:3000/api-core
```

**Lưu ý:** Thay `YOUR_IP` bằng IP máy chủ backend của bạn.

Để lấy IP:
- Windows: `iMobile

Ứng dụng React Native để quản lý thông tin dòng họ, tra cứu thành viên, nhận thông báo sự kiện và chatbot AI.

## 🚀 Tính năng

- ✅ Đăng nhập với tài khoản thành viên
- ✅ Xem thông báo sự kiện sắp diễn# Ứng dụng Gia Phả 