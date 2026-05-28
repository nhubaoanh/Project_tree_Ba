/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                         TEXT-TO-SQL SERVICE                                   ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  Chuyển đổi câu hỏi tiếng Việt thành SQL query sử dụng GROQ hoặc Gemini AI ║
 * ║                                                                               ║
 * ║  FLOW:                                                                        ║
 * ║  1. Nhận câu hỏi tiếng Việt từ user                                          ║
 * ║  2. Build prompt với schema + examples                                       ║
 * ║  3. Gọi GROQ API (ưu tiên) hoặc Gemini API (fallback)                       ║
 * ║  4. Parse và validate SQL                                                    ║
 * ║  5. Thực thi SQL trên database                                               ║
 * ║  6. Format và trả kết quả                                                    ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { Database } from "../config/database";
import * as fs from "fs";
import * as path from "path";

// Database Schema - Mô tả chi tiết cho AI
const DATABASE_SCHEMA = `
-- Bảng thành viên gia phả
CREATE TABLE thanhvien (
  thanhVienId INT PRIMARY KEY AUTO_INCREMENT,
  dongHoId VARCHAR(50) NOT NULL,           -- ID dòng họ (bắt buộc filter)
  hoTen VARCHAR(255) NOT NULL,             -- Họ tên đầy đủ (VD: "Nguyễn Văn A")
  gioiTinh TINYINT,                        -- 1=Nam, 0=Nữ
  ngaySinh DATE,                           -- Ngày sinh
  ngayMat DATE,                            -- Ngày mất (NULL = còn sống)
  noiSinh VARCHAR(255),                    -- Nơi sinh (VD: "Hà Nội")
  noiMat VARCHAR(255),                     -- Nơi mất
  ngheNghiep VARCHAR(255),                 -- Nghề nghiệp
  trinhDoHocVan VARCHAR(255),              -- Trình độ học vấn
  soDienThoai VARCHAR(11),                 -- Số điện thoại
  diaChiHienTai VARCHAR(255),              -- Địa chỉ hiện tại
  tieuSu TEXT,                             -- Tiểu sử
  doiThuoc INT,                            -- Đời thứ mấy (1, 2, 3...)
  chaId INT,                               -- ID của cha (NULL = không có)
  meId INT,                                -- ID của mẹ (NULL = không có)
  voId INT,                                -- ID của vợ (NULL = chưa có vợ)
  chongId INT,                             -- ID của chồng (NULL = chưa có chồng)
  active_flag TINYINT DEFAULT 1,           -- 1=active, 0=deleted
  FOREIGN KEY (chaId) REFERENCES thanhvien(thanhVienId),
  FOREIGN KEY (meId) REFERENCES thanhvien(thanhVienId)
);

-- Bảng quan hệ giữa các thành viên
CREATE TABLE quanhe (
  quanHeId VARCHAR(50) PRIMARY KEY,
  thanhVien1Id INT NOT NULL,               -- ID thành viên 1
  thanhVien2Id INT NOT NULL,               -- ID thành viên 2
  loaiQuanHeId VARCHAR(50) NOT NULL,       -- Loại quan hệ (HONNHAN, CHACONRUOT...)
  dongHoId1 VARCHAR(50),                   -- Dòng họ của thành viên 1
  dongHoId2 VARCHAR(50),                   -- Dòng họ của thành viên 2
  ngayBatDau DATE,                         -- Ngày bắt đầu quan hệ
  ngayKetThuc DATE,                        -- Ngày kết thúc (NULL = còn hiệu lực)
  active_flag TINYINT DEFAULT 1,
  FOREIGN KEY (thanhVien1Id) REFERENCES thanhvien(thanhVienId),
  FOREIGN KEY (thanhVien2Id) REFERENCES thanhvien(thanhVienId)
);

-- Bảng loại quan hệ
CREATE TABLE loaiquanhe (
  loaiQuanHeId VARCHAR(50) PRIMARY KEY,
  tenLoaiQuanHe VARCHAR(100) NOT NULL      -- Tên loại quan hệ
);

-- Bảng loại sự kiện
CREATE TABLE loaisukien (
  loaiSuKien INT PRIMARY KEY,
  tenLoaiSuKien VARCHAR(200)               -- 1=Tin Vui, 2=Sự Kiện, 3=Tin Chung
);

-- Bảng sự kiện
CREATE TABLE sukien (
  suKienId VARCHAR(50) PRIMARY KEY,
  dongHoId VARCHAR(50) NOT NULL,           -- ID dòng họ (bắt buộc filter)
  tenSuKien VARCHAR(255),                  -- Tên sự kiện
  ngayDienRa DATE,                         -- Ngày diễn ra
  gioDienRa TIME,                          -- Giờ diễn ra
  diaDiem VARCHAR(255),                    -- Địa điểm
  moTa TEXT,                               -- Mô tả
  lapLai TINYINT,                          -- Lặp lại hay không
  loaiSuKien INT,                          -- FK → loaisukien (1=Tin Vui, 2=Sự Kiện, 3=Tin Chung)
  uuTien INT,                              -- Mức ưu tiên
  active_flag TINYINT DEFAULT 1,
  FOREIGN KEY (loaiSuKien) REFERENCES loaisukien(loaiSuKien)
);

-- Bảng thu tài chính
CREATE TABLE taichinhthu (
  thuId INT,
  dongHoId VARCHAR(50) NOT NULL,           -- ID dòng họ (bắt buộc filter)
  hoTenNguoiDong VARCHAR(255),             -- Họ tên người đóng tiền
  ngayDong DATE,                           -- Ngày đóng
  soTien DECIMAL(18,2),                    -- Số tiền (VND)
  phuongThucThanhToan VARCHAR(100),        -- Phương thức thanh toán
  noiDung TEXT,                            -- Nội dung
  ghiChu TEXT,                             -- Ghi chú
  ngayTao DATETIME,
  active_flag TINYINT DEFAULT 1,
  PRIMARY KEY (thuId, dongHoId)
);

-- Bảng chi tài chính
CREATE TABLE taichinhchi (
  chiId INT,
  dongHoId VARCHAR(50) NOT NULL,           -- ID dòng họ (bắt buộc filter)
  ngayChi DATE,                            -- Ngày chi
  soTien DECIMAL(18,2),                    -- Số tiền (VND)
  phuongThucThanhToan VARCHAR(100),        -- Phương thức thanh toán
  noiDung TEXT,                            -- Nội dung chi
  nguoiNhan VARCHAR(255),                  -- Người nhận tiền
  ghiChu TEXT,                             -- Ghi chú
  ngayTao DATETIME,
  active_flag TINYINT DEFAULT 1,
  PRIMARY KEY (chiId, dongHoId)
);

-- Bảng người dùng hệ thống
CREATE TABLE nguoidung (
  nguoiDungId VARCHAR(50) PRIMARY KEY,
  dongHoId VARCHAR(50),                    -- Dòng họ của người dùng
  full_name VARCHAR(255),                  -- Họ tên đầy đủ
  email VARCHAR(255),
  phone VARCHAR(20),
  active_flag TINYINT DEFAULT 1
);

-- Bảng giao dịch đóng quỹ online (VNPay, Momo, chuyển khoản)
CREATE TABLE bank_transaction (
  bankTransactionId VARCHAR(50) PRIMARY KEY,
  dongHoId VARCHAR(50) NOT NULL,           -- ID dòng họ (bắt buộc filter)
  nguoiDungId VARCHAR(50),                 -- FK → nguoidung (người thực hiện giao dịch)
  soTien DECIMAL(18,2) NOT NULL,           -- Số tiền đóng quỹ (VND)
  phuongThucThanhToan VARCHAR(50),         -- momo, vnpay, bank_transfer
  tenTaiKhoanChuyen VARCHAR(100),          -- Tên người đóng quỹ (từ ngân hàng)
  soTaiKhoanChuyen VARCHAR(50),            -- Số tài khoản người chuyển
  ngayChuyenKhoan DATETIME,               -- Ngày chuyển khoản
  ngayXacNhan DATETIME,                   -- Ngày xác nhận (NULL = chưa xác nhận)
  trangThai VARCHAR(50),                  -- pending, completed, failed, verified
  noiDungChuyenKhoan VARCHAR(255),        -- Nội dung chuyển khoản
  ghiChu TEXT,
  active_flag TINYINT DEFAULT 1,
  FOREIGN KEY (nguoiDungId) REFERENCES nguoidung(nguoiDungId)
);
`;

// Few-shot examples từ dataset
let FEW_SHOT_EXAMPLES: Array<{ question: string; sql: string }> = [];

// Load examples từ file JSON
function loadExamples() {
  try {
    // Đường dẫn tới file dataset (từ myFamilyTree/src/services -> myFamilyTree/data)
    const datasetPath = path.join(__dirname, "../../data/member.json");
    
    if (fs.existsSync(datasetPath)) {
      const data = fs.readFileSync(datasetPath, "utf-8");
      FEW_SHOT_EXAMPLES = JSON.parse(data);
      console.log(`✅ Loaded ${FEW_SHOT_EXAMPLES.length} examples from dataset`);
      console.log(`📁 Dataset path: ${datasetPath}`);
    } else {
      console.warn("⚠️ Dataset file not found at:", datasetPath);
      console.warn("⚠️ Using empty examples");
    }
  } catch (error) {
    console.error("❌ Error loading examples:", error);
  }
}

// Initialize examples
loadExamples();

/**
 * Build prompt cho Gemini AI
 */
function buildPrompt(question: string, dongHoId: string): string {
  let prompt = `### NHIỆM VỤ
Bạn là chuyên gia SQL cho hệ thống gia phả Việt Nam. 
Nhiệm vụ: Chuyển câu hỏi tiếng Việt thành SQL query chính xác.

### DATABASE SCHEMA
${DATABASE_SCHEMA}

### QUY TẮC BẮT BUỘC
1. ✅ LUÔN LUÔN thêm điều kiện: dongHoId = '${dongHoId}' 
2. ✅ LUÔN LUÔN thêm điều kiện: active_flag = 1 (trừ khi câu hỏi về deleted records)
3. ✅ CHỈ trả về SQL query thuần túy, KHÔNG giải thích, KHÔNG markdown
4. ✅ Sử dụng LIKE '%keyword%' cho tìm kiếm text (VD: hoTen LIKE '%Nguyễn%')
5. ✅ gioiTinh: 1=Nam, 0=Nữ
6. ✅ ngayMat IS NULL = còn sống, ngayMat IS NOT NULL = đã mất
7. ✅ Với câu hỏi về người cụ thể, dùng hoTen = 'Tên đầy đủ'
8. ✅ Khi đếm con: dùng chaId hoặc meId tùy giới tính
9. ✅ Khi tìm anh chị em: cùng chaId hoặc meId
10. ✅ Bảng sukien: filter dongHoId, loaiSuKien (1=Tin Vui, 2=Sự Kiện, 3=Tin Chung)
11. ✅ Bảng taichinhthu: thu tiền từ thành viên, filter dongHoId
12. ✅ Bảng taichinhchi: chi tiền ra ngoài, filter dongHoId
13. ✅ Khi tính tổng tiền dùng SUM(soTien), tổng thu - tổng chi = số dư
14. ✅ Bảng bank_transaction: giao dịch đóng quỹ online, chỉ tính trangThai = 'completed' hoặc 'verified' là hợp lệ
15. ✅ "Tổng tiền đóng quỹ" = SUM(soTien) FROM bank_transaction WHERE trangThai IN ('completed','verified')
16. ✅ Khi cần tên người dùng từ bank_transaction: JOIN nguoidung ON bank_transaction.nguoiDungId = nguoidung.nguoiDungId, lấy full_name

### VÍ DỤ THAM KHẢO
${FEW_SHOT_EXAMPLES.slice(0, 8)
  .map((ex) => `Q: ${ex.question}\nSQL: ${ex.sql.replace(/dongHoId = \?/g, `dongHoId = '${dongHoId}'`)}`)
  .join("\n\n")}

Q: Có bao nhiêu sự kiện?
SQL: SELECT COUNT(*) FROM sukien WHERE dongHoId = '${dongHoId}' AND active_flag = 1

Q: Danh sách sự kiện sắp tới
SQL: SELECT tenSuKien, ngayDienRa, gioDienRa, diaDiem FROM sukien WHERE dongHoId = '${dongHoId}' AND active_flag = 1 AND ngayDienRa >= CURDATE() ORDER BY ngayDienRa ASC

Q: Tổng tiền thu được
SQL: SELECT SUM(soTien) FROM taichinhthu WHERE dongHoId = '${dongHoId}' AND active_flag = 1

Q: Tổng tiền chi
SQL: SELECT SUM(soTien) FROM taichinhchi WHERE dongHoId = '${dongHoId}' AND active_flag = 1

Q: Số dư quỹ dòng họ
SQL: SELECT (SELECT COALESCE(SUM(soTien),0) FROM taichinhthu WHERE dongHoId = '${dongHoId}' AND active_flag = 1) - (SELECT COALESCE(SUM(soTien),0) FROM taichinhchi WHERE dongHoId = '${dongHoId}' AND active_flag = 1) AS so_du

Q: Danh sách người đã đóng quỹ
SQL: SELECT hoTenNguoiDong, ngayDong, soTien, noiDung FROM taichinhthu WHERE dongHoId = '${dongHoId}' AND active_flag = 1 ORDER BY ngayDong DESC

Q: Tổng tiền đóng quỹ online
SQL: SELECT SUM(soTien) AS tong_dong_quy FROM bank_transaction WHERE dongHoId = '${dongHoId}' AND trangThai IN ('completed','verified') AND active_flag = 1

Q: Có bao nhiêu người đã đóng quỹ online?
SQL: SELECT COUNT(DISTINCT tenTaiKhoanChuyen) AS so_nguoi_dong FROM bank_transaction WHERE dongHoId = '${dongHoId}' AND trangThai IN ('completed','verified') AND active_flag = 1

Q: Danh sách giao dịch đóng quỹ
SQL: SELECT nd.full_name, bt.tenTaiKhoanChuyen, bt.soTien, bt.ngayChuyenKhoan, bt.phuongThucThanhToan, bt.trangThai FROM bank_transaction bt LEFT JOIN nguoidung nd ON bt.nguoiDungId = nd.nguoiDungId WHERE bt.dongHoId = '${dongHoId}' AND bt.active_flag = 1 ORDER BY bt.ngayChuyenKhoan DESC

Q: Tổng tiền đóng quỹ tháng này
SQL: SELECT SUM(soTien) AS tong_thang_nay FROM bank_transaction WHERE dongHoId = '${dongHoId}' AND trangThai IN ('completed','verified') AND active_flag = 1 AND MONTH(ngayChuyenKhoan) = MONTH(CURDATE()) AND YEAR(ngayChuyenKhoan) = YEAR(CURDATE())

### CÂU HỎI CỦA NGƯỜI DÙNG
Q: ${question}

### SQL QUERY (chỉ trả về SQL, không có text khác):`;

  return prompt;
}

/**
 * Parse SQL từ response của Gemini
 */
function parseSQL(response: string): string {
  // Remove markdown code blocks
  let sql = response.trim();
  sql = sql.replace(/```sql\n?/gi, "");
  sql = sql.replace(/```\n?/g, "");
  sql = sql.replace(/^SQL:\s*/i, "");
  sql = sql.trim();

  // Remove trailing semicolon if exists
  if (sql.endsWith(";")) {
    sql = sql.slice(0, -1);
  }

  return sql;
}

/**
 * Validate SQL query
 */
function validateSQL(sql: string): { valid: boolean; error?: string } {
  // Check if SQL is empty
  if (!sql || sql.length === 0) {
    return { valid: false, error: "SQL query is empty" };
  }

  // Check for dangerous operations
  const dangerousKeywords = ["DROP", "DELETE", "TRUNCATE", "ALTER", "CREATE", "INSERT", "UPDATE"];
  const upperSQL = sql.toUpperCase();

  for (const keyword of dangerousKeywords) {
    if (upperSQL.includes(keyword)) {
      return { valid: false, error: `Dangerous operation detected: ${keyword}` };
    }
  }

  // Must be SELECT query
  if (!upperSQL.startsWith("SELECT")) {
    return { valid: false, error: "Only SELECT queries are allowed" };
  }

  return { valid: true };
}

/**
 * Format kết quả query
 */
function formatResults(results: any[], sql: string): any {
  // Nếu là COUNT query
  if (sql.toUpperCase().includes("COUNT(*)")) {
    const count = results[0]?.["COUNT(*)"] || 0;
    return {
      type: "count",
      value: count,
      message: `Kết quả: ${count}`,
    };
  }

  // Nếu là query lấy danh sách
  if (results.length > 0) {
    return {
      type: "list",
      count: results.length,
      data: results,
      message: `Tìm thấy ${results.length} kết quả`,
    };
  }

  // Không có kết quả
  return {
    type: "empty",
    count: 0,
    data: [],
    message: "Không tìm thấy kết quả nào",
  };
}

/**
 * Main service: Text to SQL
 */
export class Text2SQLService {
  private groq: Groq | null = null;
  private genAI: GoogleGenerativeAI | null = null;
  private geminiModel: any = null;
  private db: Database;

  constructor() {
    // Initialize GROQ (primary)
    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey) {
      this.groq = new Groq({ apiKey: groqApiKey });
      console.log("✅ GROQ API initialized");
    } else {
      console.warn("⚠️ GROQ_API_KEY not found");
    }

    // Initialize Gemini (fallback)
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(geminiApiKey);
      this.geminiModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      console.log("✅ Gemini API initialized");
    } else {
      console.warn("⚠️ GEMINI_API_KEY not found");
    }

    if (!this.groq && !this.genAI) {
      throw new Error("Neither GROQ_API_KEY nor GEMINI_API_KEY found in environment variables");
    }

    this.db = new Database();
  }

  /**
   * Gọi GROQ API để sinh SQL
   */
  private async callGroqAPI(prompt: string): Promise<string> {
    if (!this.groq) {
      throw new Error("GROQ API not initialized");
    }

    const completion = await this.groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile", // Model mạnh nhất của GROQ
      temperature: 0.1,
      max_tokens: 1024,
    });

    return completion.choices[0]?.message?.content || "";
  }

  /**
   * Gọi Gemini API để sinh SQL
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    if (!this.geminiModel) {
      throw new Error("Gemini API not initialized");
    }

    const result = await this.geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  /**
   * Xử lý câu hỏi và trả về kết quả
   */
  async processQuestion(question: string, dongHoId: string): Promise<any> {
    try {
      // 1. Build prompt
      const prompt = buildPrompt(question, dongHoId);
      let generatedSQL = "";
      let usedAPI = "";

      // 2. Gọi AI API (ưu tiên GROQ, fallback Gemini)
      if (this.groq) {
        try {
          console.log("🤖 Calling GROQ API...");
          generatedSQL = await this.callGroqAPI(prompt);
          usedAPI = "GROQ";
          console.log("✅ GROQ response:", generatedSQL);
        } catch (groqError: any) {
          console.warn("⚠️ GROQ API failed:", groqError.message);
          if (this.geminiModel) {
            console.log("🔄 Falling back to Gemini API...");
            generatedSQL = await this.callGeminiAPI(prompt);
            usedAPI = "Gemini";
            console.log("✅ Gemini response:", generatedSQL);
          } else {
            throw groqError;
          }
        }
      } else if (this.geminiModel) {
        console.log("🔄 Calling Gemini API...");
        generatedSQL = await this.callGeminiAPI(prompt);
        usedAPI = "Gemini";
        console.log("✅ Gemini response:", generatedSQL);
      } else {
        throw new Error("No AI API available");
      }

      // 3. Parse SQL
      const sql = parseSQL(generatedSQL);
      console.log("🔍 Parsed SQL:", sql);

      // 4. Validate SQL
      const validation = validateSQL(sql);
      if (!validation.valid) {
        throw new Error(`Invalid SQL: ${validation.error}`);
      }

      // 5. Thực thi SQL
      console.log("💾 Executing SQL on database...");
      const [results] = await this.db.rawQuery(sql, []);
      console.log(`✅ Query executed successfully, ${results.length} rows returned`);

      // 6. Format kết quả
      const formattedResults = formatResults(results, sql);

      return {
        success: true,
        question,
        sql,
        result: formattedResults,
        usedAPI, // Thêm thông tin API nào được dùng
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Text2SQL Error: ${error.message}`);
    }
  }

  /**
   * Lấy danh sách examples
   */
  getExamples(): Array<{ question: string; sql: string }> {
    return FEW_SHOT_EXAMPLES;
  }

  /**
   * Reload examples từ file
   */
  reloadExamples(): void {
    loadExamples();
  }
}
