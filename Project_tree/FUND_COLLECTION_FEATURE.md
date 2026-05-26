# 📋 Báo Cáo Thêm Tính Năng "Đóng Quỹ Gia Đình"

## ✅ Tóm Tắt Công Việc

Đã thêm chức năng **"Đóng Quỹ Gia Đình"** lên trang Phả Ký. Khi nhấn nút, sẽ hiển thị modal chứa:
- 📸 Mã QR code để quét
- 🏦 Thông tin chuyển khoản ngân hàng
- 📋 Nút sao chép số tài khoản (1 click)
- ⬇️ Nút tải QR code

---

## 📁 Các File Được Thêm/Sửa

### 1️⃣ File Mới Tạo

#### `FE/tree/components/ui/FundCollectionModal.tsx` (NEW)
- **Mục đích:** Component Modal hiển thị thông tin đóng quỹ
- **Tính năng:**
  - Hiển thị QR code (SVG placeholder)
  - Thông tin ngân hàng: Tên, số tài khoản, tên chủ tài khoản
  - Sao chép số tài khoản (clipboard)
  - Tải QR code
  - Close button
- **Responsive:** Hỗ trợ mobile, tablet, desktop
- **Styling:** Tailwind CSS + gradient colors (theme của ứng dụng)

#### `FE/tree/public/qr-code.svg` (NEW)
- **Mục đích:** Placeholder SVG cho QR code
- **Lưu ý:** Đây là ảnh tạm. Thay bằng QR code thực tế (xem hướng dẫn bên dưới)

### 2️⃣ File Được Sửa

#### `FE/tree/components/ui/HeaderSub.tsx` (MODIFIED)
**Thay đổi:**
- ➕ Import `FundCollectionModal` component
- ➕ Import icon `Wallet` từ lucide-react
- ➕ Thêm state `showFundModal`
- ➕ Thêm nút "Đóng Quỹ" (floating button, bottom-right)
- ➕ Render `FundCollectionModal` component

**Vị trí nút:**
- Góc dưới phải (bottom-6 right-20)
- Bên cạnh nút User (bottom-6 left-6)
- Responsive: Icon chỉ hiện trên mobile, chữ + icon hiện trên desktop

---

## 🎨 Giao Diện Chi Tiết

### Nút "Đóng Quỹ" (Header)
```
┌─────────────────────────────────────────────┐
│ Phả Ký | Phả Đồ | Sự Kiện | Tin Tức       │
│            [Logo Gia Phả]                   │
└─────────────────────────────────────────────┘
        ↙️                                    ✅🟢 Đóng Quỹ
   User Menu                              
```

### Modal "Đóng Quỹ Gia Đình"
```
╔══════════════════════════════════════╗
║ Đóng Quỹ Gia Đình               ✕    ║
╟──────────────────────────────────────╢
║                                      ║
║        ┌────────────────┐            ║
║        │   QR CODE      │            ║
║        │   (PLACEHOLDER)│            ║
║        └────────────────┘            ║
║     Quét mã QR để thực hiện          ║
║       chuyển khoản                    ║
║           [Tải mã QR]                ║
║                                      ║
║ ═══════════════════════════════════  ║
║ THÔNG TIN CHUYỂN KHOẢN               ║
║ ───────────────────────────────────  ║
║ Ngân Hàng: Vietcombank               ║
║ Chủ Tài Khoản: Gia Đình              ║
║ Số Tài Khoản: 1234567890 [📋]        ║
║ Nội Dung: Quỹ gia đình -...          ║
║                                      ║
║ 💡 Lưu ý: Quỹ gia đình được...      ║
║                                      ║
║               [Đóng]                 ║
╚══════════════════════════════════════╝
```

---

## ⚙️ Cách Cấu Hình

### 1. Thay Đổi Thông Tin Ngân Hàng

Mở file `FE/tree/components/ui/FundCollectionModal.tsx` (dòng 16-21):

```typescript
const bankInfo = {
  bankName: "Vietcombank",                    // Tên ngân hàng
  accountName: "Nguyễn Văn A",                // Tên chủ tài khoản
  accountNumber: "1234567890",                // Số tài khoản THỰC
  description: "Quỹ gia đình - Chi trợ cấp",  // Nội dung chuyển khoản
};
```

### 2. Thay Thế QR Code

**Cách A: Upload file PNG thực tế**
1. Tạo QR code tại: https://www.qr-code-generator.com/
2. Tải file ảnh về
3. Đặt file vào: `FE/tree/public/qr-code.png`
4. Sửa file `FundCollectionModal.tsx`:
   ```typescript
   src="/qr-code.png"  // Thay từ qr-code.svg
   ```

**Cách B: Dùng API VietQR (Khuyến Nghị - Tự động)**
```typescript
// Sửa handleDownloadQR function để gọi API VietQR
const handleDownloadQR = async () => {
  const qrData = {
    bank: "970422",  // Mã Vietcombank
    account: bankInfo.accountNumber,
    amount: 0,       // 0 = chọn tùy thích
  };
  // Gọi API VietQR để tạo QR code
};
```

### 3. Tùy Chỉnh Vị Trí & Màu Sắc Nút

Mở file `FE/tree/components/ui/HeaderSub.tsx` (dòng 106-116):

```typescript
{/* Thay đổi vị trí */}
<div className="fixed bottom-6 right-20 z-50">  // bottom-* right-* left-* top-*
  
{/* Thay đổi màu */}
className="bg-gradient-to-r from-green-500 to-green-600"
// Đổi thành:
// from-blue-500 to-blue-600    (xanh dương)
// from-red-500 to-red-600      (đỏ)
// from-purple-500 to-purple-600 (tím)
// from-yellow-500 to-yellow-600 (vàng)
```

---

## 🧪 Kiểm Tra

### Bước 1: Khởi động ứng dụng
```bash
cd FE/tree
npm install  # Nếu chưa
npm run dev
```

### Bước 2: Vào trang Phả Ký
- Truy cập: http://localhost:3000/genealogy

### Bước 3: Kiểm tra nút "Đóng Quỹ"
- ✅ Nút xuất hiện ở góc dưới phải
- ✅ Nhấn nút, modal hiển thị
- ✅ Sao chép số tài khoản hoạt động
- ✅ Tải QR code hoạt động
- ✅ Nút Đóng modal hoạt động

---

## 📱 Responsive Design

| Kích Thước | Nút "Đóng Quỹ" | Modal |
|-----------|---|---|
| Mobile (<640px) | Icon Wallet only | Full width, scrollable |
| Tablet (640-1024px) | Icon + Text | 90% width, centered |
| Desktop (>1024px) | Icon + Text | max-w-md, centered |

---

## 🔄 Tích Hợp Thêm (Tùy Chọn)

### Lưu Lịch Sử Đóng Quỹ
Tạo API endpoint để lưu records:
```
POST /api-core/fund-collection/record
Body: { donorId, amount, timestamp, bankTransfer }
```

### Thông Báo Email
Khi có đóng quỹ, gửi email tới admin:
- Tên người đóng
- Số tiền
- Thời gian

### Dashboard Quỹ
Tạo trang quản lý quỹ hiển thị:
- Tổng quỹ hiện tại
- Lịch sử đóng góp
- Chi tiêu quỹ
- Biểu đồ thống kê

---

## 📚 Tài Liệu Tham Khảo

- **QR Code Generator:** https://www.qr-code-generator.com/
- **VietQR API:** https://vietqr.io/
- **Lucide Icons:** https://lucide.dev/
- **Tailwind CSS:** https://tailwindcss.com/

---

## ✨ Tính Năng Hiện Tại

- ✅ Hiển thị modal với thông tin đóng quỹ
- ✅ QR code (placeholder SVG)
- ✅ Sao chép số tài khoản
- ✅ Tải QR code
- ✅ Responsive design
- ✅ Thiết kế đẹp (Tailwind CSS + gradient)
- ✅ Dễ tùy chỉnh
- ✅ Close button (X)
- ✅ Click outside to close (tùy chọn - có thể thêm)

---

## 🚀 Deployment

1. **Sửa thông tin ngân hàng** trong `FundCollectionModal.tsx`
2. **Thay QR code** bằng ảnh thực tế vào `public/qr-code.png`
3. **Build và deploy:**
   ```bash
   npm run build
   npm run start
   ```

---

## ❓ FAQ

**Q: Làm sao ẩn nút "Đóng Quỹ"?**
A: Xóa hoặc comment dòng 106-116 trong `HeaderSub.tsx`

**Q: Làm sao thay QR code?**
A: Đặt file PNG vào `public/` và sửa path trong `FundCollectionModal.tsx`

**Q: Có thể tạo QR code tự động không?**
A: Có, dùng API VietQR hoặc qrcode.react library

**Q: Modal có close được bằng click outside không?**
A: Hiện tại không, chỉ có nút X. Có thể thêm bằng:
```typescript
onClick={(e) => e.target === e.currentTarget && onClose()}
```

---

**Cập nhật lần cuối:** 26/05/2026  
**Người thực hiện:** AI Assistant  
**Trạng thái:** ✅ Hoàn thành
