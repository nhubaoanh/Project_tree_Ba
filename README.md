# Gia Phả Thông Minh - Hệ Thống Quản Lý Gia Phả

Ứng dụng web quản lý gia phả dòng họ toàn diện, hỗ trợ trực quan hóa cây phả hệ, quản lý thành viên, sự kiện, tài chính, tài liệu và tích hợp AI.

---

## Cấu Trúc Dự Án

```
Project_tree/
├── FE/tree/            # Frontend - Next.js
├── myFamilyTree/       # Backend - Express.js
└── database/           # SQL migration scripts
```

---

## Công Nghệ Chính

### Frontend — `FE/tree`

| Công nghệ | Phiên bản | Vai trò |
|-----------|-----------|---------|
| **Next.js** | ^16.0.1 | Framework React (App Router) |
| **React** | ^19.2.0 | UI library |
| **TypeScript** | ^5.9.3 | Ngôn ngữ lập trình |
| **Tailwind CSS** | ^4 | CSS utility framework |

### Backend — `myFamilyTree`

| Công nghệ | Phiên bản | Vai trò |
|-----------|-----------|---------|
| **Node.js** | — | Runtime |
| **Express.js** | ^5.1.0 | Web framework |
| **TypeScript** | ^5.9.3 | Ngôn ngữ lập trình |
| **MySQL** | — | Cơ sở dữ liệu quan hệ |

---

## Kết Nối Frontend ↔ Backend

### Cơ chế giao tiếp

Frontend và Backend giao tiếp qua **REST API** sử dụng **Axios** với base URL cấu hình qua biến môi trường.

```
Frontend (Next.js :3000)
        │
        │  HTTP REST API (JSON)
        │  Authorization: Bearer <JWT>
        ▼
Backend (Express.js :3001)
        │  prefix: /api-core/*
        ▼
     MySQL Database
```

### Axios Client (`FE/tree/lib/api.ts`)

Frontend tạo một `apiClient` dùng chung toàn app với các tính năng:

| Tính năng | Chi tiết |
|-----------|----------|
| **Base URL** | `NEXT_PUBLIC_API_BASE_URL` (env var) |
| **Timeout** | 3 phút (mặc định) |
| **Auto JWT** | Request interceptor tự động gắn `Authorization: Bearer <token>` vào mọi request |
| **Token refresh** | Response interceptor bắt lỗi `401`, tự động gọi `/api-core/users/refresh-token` để lấy token mới, retry request gốc |
| **Redirect login** | Nếu refresh token hết hạn → xóa storage → redirect về trang `/login` |
| **Queue** | Các request bị 401 trong lúc đang refresh sẽ được xếp hàng, xử lý sau khi có token mới |

### Cấu hình môi trường Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/
NEXT_PUBLIC_UPLOAD_BASE_URL=http://localhost:3001/
```

### Prefix API

Tất cả API backend đều có prefix `/api-core/`, ví dụ:
- `POST /api-core/users/login`
- `GET  /api-core/thanhvien`
- `POST /api-core/text2sql/query`
- `POST /api-core/ai/ask`

### Luồng bảo mật request (Backend `app.ts`)

Mỗi request từ Frontend đi qua 7 lớp middleware theo thứ tự:

```
Request từ Client
     ↓
1. CORS          → Kiểm tra origin được phép
     ↓
2. Helmet        → Thêm HTTP security headers
     ↓
3. Rate Limiter  → Chặn spam/DDoS (100 req/15 phút)
     ↓
4. Body Parser   → Parse JSON (giới hạn 10MB)
     ↓
5. HPP           → Chống HTTP parameter pollution
     ↓
6. Sanitizer     → Làm sạch input, chống XSS
     ↓
7. SQL Injection  → Phát hiện và block SQL injection
     ↓
8. Route Handler → Business logic
     ↓
Response về Client
```

### Upload file

File tĩnh (ảnh, PDF, tài liệu) được phục vụ qua `/uploads/*` với CORS mở và `Content-Disposition: inline` để browser hiển thị trực tiếp.

---

## AI Chatbot — Hệ Thống Tra Cứu Gia Phả Thông Minh

Hệ thống có **2 luồng AI** riêng biệt:

---

### Luồng 1 — Text2SQL (tích hợp trong Node.js Backend)

Cho phép user hỏi bằng tiếng Việt tự nhiên, AI chuyển câu hỏi thành SQL và thực thi trực tiếp trên MySQL.

**Endpoint:** `POST /api-core/text2sql/query`

**Luồng xử lý:**

```
User nhập câu hỏi tiếng Việt
(VD: "Có bao nhiêu người trong gia phả?")
        │
        ▼
[Frontend] text2sql.service.ts
POST /api-core/text2sql/query
{ question, dongHoId }
        │
        ▼
[Backend] text2sqlController.ts
→ Validate input (question, dongHoId)
        │
        ▼
[Backend] Text2SQLService.processQuestion()
→ Bước 1: Build Prompt
  - Nhúng DATABASE_SCHEMA (cấu trúc bảng thanhvien, quanhe, loaiquanhe)
  - Nhúng few-shot examples từ data/member.json
  - Nhúng quy tắc bắt buộc (filter dongHoId, active_flag=1, chỉ SELECT)
  - Nhúng câu hỏi của user
        │
        ▼
→ Bước 2: Gọi AI (ưu tiên Gemini, fallback GROQ)
  ┌─────────────────────────────┐
  │  Gemini 1.5 Flash (primary) │  ←── GEMINI_API_KEY
  │  hoặc                       │
  │  Groq Llama-3.3-70b         │  ←── GROQ_API_KEY
  └─────────────────────────────┘
        │  Trả về SQL raw text
        ▼
→ Bước 3: Parse SQL
  - Bỏ markdown code block (```sql```)
  - Bỏ prefix "SQL:", trim, bỏ dấu ";"
        │
        ▼
→ Bước 4: Validate SQL
  - Chỉ cho phép SELECT
  - Block: DROP, DELETE, TRUNCATE, ALTER, CREATE, INSERT, UPDATE
        │
        ▼
→ Bước 5: Thực thi SQL trên MySQL
  mysql2.rawQuery(sql, [])
        │
        ▼
→ Bước 6: Format kết quả
  - COUNT query → { type: "count", value, message }
  - Danh sách  → { type: "list", count, data[] }
  - Rỗng       → { type: "empty" }
        │
        ▼
[Frontend] Hiển thị kết quả trong giao diện Text2SQL
```

**Các endpoint Text2SQL:**

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api-core/text2sql/query` | Gửi câu hỏi, nhận SQL + kết quả |
| `GET`  | `/api-core/text2sql/examples` | Lấy danh sách câu hỏi mẫu |
| `POST` | `/api-core/text2sql/reload-examples` | Reload dataset từ file JSON |
| `GET`  | `/api-core/text2sql/health` | Kiểm tra trạng thái service |

---

### Luồng 2 — AI Chat (kết nối Python AI Service ngoài)

Chatbot tra cứu gia phả tương tác dạng hội thoại, giao diện tại trang `/genAI`.

**Endpoint:** `POST /api-core/ai/ask`

**Luồng xử lý:**

```
User nhập câu hỏi trong giao diện Chat
(trang /genAI)
        │
        ▼
[Frontend] aiQuery.service.ts
POST /api-core/ai/ask
{ question, dongHoId }
        │
        ▼
[Backend] aiQueryController.ts
→ Validate input
        │
        ▼
[Backend] AIQueryService.askQuestion()
→ Gọi Python AI Service (external)
POST http://localhost:7000/ask
{ question, dongHoId, execute: true }
        │
        ▼
[Python AI Service :7000]
→ Sinh SQL từ câu hỏi tự nhiên
→ Thực thi SQL trên database
→ Trả kết quả { sql, confidence, results, total_rows }
        │
        ▼
[Backend] Map response → trả về Frontend
{ success, sql, confidence, data[], row_count }
        │
        ▼
[Frontend] Hiển thị trong chat bubble
- Nếu COUNT → "Tổng số: X"
- Nếu danh sách → hiển thị từng dòng
- Độ chính xác: XX%
```

> **Lưu ý:** Python AI Service chạy độc lập tại `http://localhost:7000`. Nếu service chưa khởi động, chatbot báo "AI chưa khởi động" (status: offline). Backend tự động phát hiện qua health check.

**Các endpoint AI Query:**

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api-core/ai/ask` | Gửi câu hỏi, nhận kết quả SQL |
| `GET`  | `/api-core/ai/health` | Kiểm tra trạng thái AI service |
| `GET`  | `/api-core/ai/logs/questions` | Lấy log câu hỏi đã thu thập |
| `GET`  | `/api-core/ai/logs/results` | Lấy log kết quả queries |
| `POST` | `/api-core/ai/dataset/export` | Export dataset để fine-tune model |

**Giao diện chatbot (`/genAI`):**
- Chat bubble dạng hội thoại (user bên phải, bot bên trái)
- Indicator trạng thái AI: Online / Offline / Checking
- Câu hỏi gợi ý nhanh (quick questions)
- Hiển thị số câu hỏi đã thu thập để fine-tune
- Nút Export dataset khi đủ ≥ 10 câu hỏi

---

### So sánh hai hệ thống AI

| Tiêu chí | Text2SQL (Luồng 1) | AI Chat (Luồng 2) |
|----------|-------------------|-------------------|
| Nơi xử lý | Node.js Backend | Python AI Service (port 7000) |
| Model AI | Gemini 1.5 Flash + Groq Llama-3.3-70b | Python AI Service tự quản lý |
| Giao diện | Trang Text2SQL | Trang `/genAI` (chat bubble) |
| Few-shot | Có (data/member.json) | Phụ thuộc Python service |
| Fallback | Gemini → GROQ | Không (báo offline nếu service down) |
| Dataset | Thu thập qua AI Chat | — |

---

## Thư Viện Frontend

### UI Components
| Thư viện | Phiên bản | Mô tả |
|----------|-----------|-------|
| `@radix-ui/react-avatar` | ^1.1.11 | Avatar component |
| `@radix-ui/react-checkbox` | ^1.3.3 | Checkbox component |
| `@radix-ui/react-dialog` | ^1.1.15 | Modal/Dialog component |
| `@radix-ui/react-dropdown-menu` | ^2.1.16 | Dropdown menu |
| `@radix-ui/react-label` | ^2.1.8 | Label component |
| `@radix-ui/react-popover` | ^1.1.15 | Popover component |
| `@radix-ui/react-scroll-area` | ^1.2.10 | Scroll area |
| `@radix-ui/react-select` | ^2.2.6 | Select/combobox |
| `@radix-ui/react-separator` | ^1.1.8 | Separator |
| `@radix-ui/react-slot` | ^1.2.4 | Slot primitive |
| `@radix-ui/react-tabs` | ^1.1.13 | Tab navigation |
| `lucide-react` | ^0.553.0 | Icon library |
| `cmdk` | ^1.1.1 | Command palette |
| `class-variance-authority` | ^0.7.1 | Variant class builder |
| `clsx` | ^2.1.1 | Conditional className |
| `tailwind-merge` | ^3.4.0 | Merge Tailwind classes |
| `tailwindcss-animate` | ^1.0.7 | Animation utilities |
| `react-hot-toast` | ^2.6.0 | Toast notifications |

### Trực Quan Hóa Cây Phả Hệ
| Thư viện | Phiên bản | Mô tả |
|----------|-----------|-------|
| `d3` | ^7.9.0 | Data-Driven Documents |
| `d3-org-chart` | ^3.1.1 | Org/family tree chart |
| `react-family-tree` | ^3.2.0 | React family tree |
| `pedigree-tree` | ^1.0.1 | Pedigree tree |
| `reactflow` | ^11.11.4 | Interactive flow/graph |
| `dagre` | ^0.8.5 | DAG layout engine |
| `recharts` | ^3.5.0 | Chart components |
| `react-draggable` | ^4.5.0 | Kéo thả phần tử |

### Data Fetching & State Management
| Thư viện | Phiên bản | Mô tả |
|----------|-----------|-------|
| `@tanstack/react-query` | ^5.90.10 | Server state management |
| `@tanstack/react-table` | ^8.21.3 | Headless table |
| `recoil` | ^0.7.7 | Client state management |
| `axios` | ^1.13.2 | HTTP client |

### Export & File Handling
| Thư viện | Phiên bản | Mô tả |
|----------|-----------|-------|
| `jspdf` | ^3.0.3 | Xuất file PDF |
| `html2canvas` | ^1.4.1 | Chụp DOM thành ảnh |
| `html-to-image` | ^1.11.13 | DOM to image |
| `svg2pdf.js` | ^2.6.0 | SVG sang PDF |
| `canvg` | ^4.0.3 | Render SVG trên Canvas |
| `xlsx` | ^0.18.5 | Đọc/ghi file Excel |

### AI Integration
| Thư viện | Phiên bản | Mô tả |
|----------|-----------|-------|
| `@google/genai` | ^1.30.0 | Google Gemini AI SDK |

---

## Thư Viện Backend

### Web Framework & Core
| Thư viện | Phiên bản | Mô tả |
|----------|-----------|-------|
| `express` | ^5.1.0 | Web framework |
| `cors` | ^2.8.5 | Cross-Origin Resource Sharing |
| `dotenv` | ^17.2.3 | Biến môi trường |
| `@ltv/env` | ^4.0.3 | Environment config helper |
| `reflect-metadata` | ^0.2.2 | Decorator metadata |

### Database
| Thư viện | Phiên bản | Mô tả |
|----------|-----------|-------|
| `mysql2` | ^3.15.2 | MySQL driver với Promise support |

### Xác Thực & Bảo Mật
| Thư viện | Phiên bản | Mô tả |
|----------|-----------|-------|
| `jsonwebtoken` | ^9.0.2 | JWT authentication |
| `md5` | ^2.3.0 | Mã hóa mật khẩu MD5 |
| `helmet` | ^8.1.0 | HTTP security headers |
| `hpp` | ^0.2.3 | Chống HTTP parameter pollution |
| `xss-clean` | ^0.1.4 | Chống tấn công XSS |
| `express-rate-limit` | ^8.2.1 | Rate limiting |
| `express-validator` | ^7.3.1 | Input validation |

### File Upload & Email
| Thư viện | Phiên bản | Mô tả |
|----------|-----------|-------|
| `multer` | ^2.0.2 | Xử lý multipart/upload file |
| `nodemailer` | ^7.0.10 | Gửi email |
| `uuid` | ^13.0.0 | Tạo UUID |

### Export & File Processing
| Thư viện | Phiên bản | Mô tả |
|----------|-----------|-------|
| `exceljs` | ^4.4.0 | Xuất/đọc file Excel |
| `xlsx` | ^0.18.5 | Excel file processing |
| `axios` | ^1.13.2 | HTTP client (gọi Python AI Service) |

### Dependency Injection
| Thư viện | Phiên bản | Mô tả |
|----------|-----------|-------|
| `tsyringe` | ^4.10.0 | Dependency injection container |

### AI Integration
| Thư viện | Phiên bản | Mô tả |
|----------|-----------|-------|
| `@google/genai` | ^1.34.0 | Google Gemini AI SDK |
| `@google/generative-ai` | ^0.24.1 | Google Generative AI |
| `groq-sdk` | ^0.37.0 | Groq LLM SDK (Llama-3.3-70b) |

---

## Tính Năng Chính

- **Quản lý thành viên** — Thêm, sửa, xóa hồ sơ thành viên dòng họ
- **Cây phả hệ** — Trực quan hóa tương tác với D3, ReactFlow, react-family-tree
- **Phả Ký** — Quản lý lịch sử, bút tích, truyền thống, từ đường, tổ quán của dòng họ
- **Sự kiện dòng họ** — Tổ chức và theo dõi sự kiện
- **Tài chính** — Quản lý thu/chi quỹ dòng họ, giao dịch ngân hàng
- **Tài liệu** — Lưu trữ và chia sẻ tài liệu gia phả
- **Tin tức** — Bảng tin nội bộ dòng họ
- **AI Chatbot** — Tra cứu gia phả bằng ngôn ngữ tự nhiên (Text2SQL + AI Chat)
- **Xuất PDF/Excel** — In ấn và xuất dữ liệu
- **Phân quyền** — Hệ thống vai trò và quyền truy cập
- **Xác thực** — JWT + refresh token, đăng ký, đăng nhập, quên mật khẩu qua email

---

## Kiến Trúc Backend

Pattern: **MVC + Repository + Service**

```
src/
├── controllers/    # Xử lý request/response
├── services/       # Business logic
├── repositories/   # Data access layer (raw SQL)
├── models/         # Data models / interfaces
├── routes/         # Express routes
├── middlewares/    # Auth, validation, security, rate limit
├── validators/     # express-validator rules
├── config/         # Database, JWT, email config
└── ultis/          # Utility functions (BFS, tree, file)
```

---

## Cài Đặt & Chạy Dự Án

### Yêu Cầu
- Node.js >= 18
- MySQL >= 8.0
- Python >= 3.9 (nếu dùng AI Chat luồng 2)

### Backend

```bash
cd Project_tree/myFamilyTree
npm install

# Tạo file .env và điền thông tin
cp .env.example .env

# Chạy development
npm run dev
```

### Frontend

```bash
cd Project_tree/FE/tree
npm install

# Chạy development
npm run dev
```

### Database

Chạy các file SQL theo thứ tự:

```bash
# Schema chính
mysql -u root -p < database/tree_v26.sql

# Migrations bổ sung
mysql -u root -p < database/bank_transaction_tables.sql
mysql -u root -p < database/contributes_db.sql
mysql -u root -p < database/migration_event_fix.sql
mysql -u root -p < database/migration_phaky.sql
mysql -u root -p < database/migration_phaky_add_images.sql
mysql -u root -p < database/migration_phaky_add_iframe.sql
mysql -u root -p < database/migration_phaky_menu.sql
```

---

## Biến Môi Trường

### Backend (`.env`)

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=family_tree

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

GEMINI_API_KEY=your_google_gemini_key
GROQ_API_KEY=your_groq_key

AI_SERVICE_URL=http://localhost:7000
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/
NEXT_PUBLIC_UPLOAD_BASE_URL=http://localhost:3001/
```

---

## API Endpoints Chính

| Module | Method | Endpoint |
|--------|--------|----------|
| Auth | `POST` | `/api-core/users/login` |
| Auth | `POST` | `/api-core/users/refresh-token` |
| Thành viên | `GET/POST/PUT/DELETE` | `/api-core/thanhvien` |
| Sự kiện | `GET/POST/PUT/DELETE` | `/api-core/sukien` |
| Tài chính thu | `GET/POST` | `/api-core/taichinhThu` |
| Tài chính chi | `GET/POST` | `/api-core/taichinhChi` |
| Tài liệu | `GET/POST` | `/api-core/tailieu` |
| Tin tức | `GET/POST` | `/api-core/tintuc` |
| Phả Ký | `GET/POST` | `/api-core/phaky` |
| Text2SQL | `POST` | `/api-core/text2sql/query` |
| AI Chat | `POST` | `/api-core/ai/ask` |
| Upload | `POST` | `/api-core/upload` |
| Upload nhiều | `POST` | `/api-core/upload-multiple` |
| Thống kê | `GET` | `/api-core/thongke` |
