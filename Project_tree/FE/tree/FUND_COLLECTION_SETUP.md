# Hướng Dẫn Thiết Lập Chức Năng Đóng Quỹ Gia Đình

## 📝 Mô Tả
Đã thêm nút "Đóng Quỹ" trên trang Phả Ký hiển thị thông tin chuyển khoản và mã QR để các thành viên gia đình có thể đóng góp vào quỹ gia đình.

## 🎯 Các File Được Thêm/Sửa

### 1. **Các File Mới Tạo:**
- `components/ui/FundCollectionModal.tsx` - Modal hiển thị QR code và thông tin chuyển khoản

### 2. **Các File Được Sửa:**
- `components/ui/HeaderSub.tsx` - Thêm nút "Đóng Quỹ" vào header

## 🔧 Cách Tùy Chỉnh Thông Tin Ngân Hàng

Mở file `components/ui/FundCollectionModal.tsx` và sửa các thông tin dưới đây:

```typescript
const bankInfo = {
  bankName: "Vietcombank",           // Tên ngân hàng
  accountName: "Gia Đình",           // Tên chủ tài khoản
  accountNumber: "1234567890",       // Số tài khoản (đổi thành số thực)
  description: "Quỹ gia đình - Đóng góp cho hoạt động gia phả", // Mô tả
};
```

## 📸 Thêm QR Code

1. **Cách 1: Dùng QR Code Generator Online**
   - Truy cập: https://www.qr-code-generator.com/
   - Nhập thông tin chuyển khoản (số tài khoản, tên ngân hàng)
   - Tải ảnh QR code về
   - Đặt file vào thư mục `public/` với tên `qr-code.png`

2. **Cách 2: Dùng Mã VietQR (Khuyến Nghị)**
   - Sử dụng API VietQR để tạo mã QR tự động
   - Thay đổi component để fetch QR code từ API

### Thay Thế Ảnh QR Code:
```bash
# Đặt file QR code vào thư mục public
public/qr-code.png
```

## 🎨 Giao Diện

### Nút "Đóng Quỹ"
- Vị trí: Góc dưới bên phải (bên cạnh nút User)
- Màu: Xanh lá (Green)
- Icon: Wallet (ví tiền)
- Responsive: Trên mobile hiện chỉ icon, trên desktop hiện chữ

### Modal
- Tiêu đề: "Đóng Quỹ Gia Đình"
- Hiển thị: QR code, thông tin ngân hàng, nút sao chép số tài khoản
- Có thể tải QR code

## ✨ Tính Năng

- ✅ Hiển thị QR code
- ✅ Sao chép số tài khoản (1 click)
- ✅ Tải QR code
- ✅ Responsive design (mobile & desktop)
- ✅ Hỗ trợ Tailwind CSS
- ✅ Dễ tùy chỉnh thông tin

## 📱 Responsive Design

| Device | Nút "Đóng Quỹ" |
|--------|---|
| Mobile | Chỉ hiện icon Wallet |
| Tablet | Hiện icon + "Đóng Quỹ" |
| Desktop | Hiện icon + "Đóng Quỹ" |

## 🔗 Tích Hợp Thêm (Tùy Chọn)

Nếu muốn tích hợp sâu hơn, có thể:

1. **Tạo trang quản lý quỹ** - Xem chi tiết lịch sử đóng góp
2. **Thêm API** - Lưu records của những lần đóng quỹ
3. **Thông báo** - Gửi email khi có đóng góp mới
4. **Báo cáo** - Thống kê tổng quỹ, chi tiêu

## 🚀 Deployment

Không cần cấu hình thêm gì, chỉ cần:
1. Thay đổi thông tin ngân hàng trong `FundCollectionModal.tsx`
2. Thêm file `qr-code.png` vào thư mục `public/`
3. Deploy lại ứng dụng

## ❓ Câu Hỏi Thường Gặp

**Q: Làm thế nào để ẩn nút "Đóng Quỹ"?**
A: Comment hoặc xóa đoạn code từ dòng 106-116 trong `HeaderSub.tsx`

**Q: Làm thế nào để thay đổi vị trí nút?**
A: Thay đổi class `bottom-6 right-20` trong `HeaderSub.tsx`

**Q: Có thể thay đổi màu nút không?**
A: Có, thay đổi class `bg-gradient-to-r from-green-500 to-green-600` thành màu bạn muốn

---

**Cập nhật lần cuối:** 26/05/2026
