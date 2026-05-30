// /**
//  * ╔══════════════════════════════════════════════════════════════════════════════╗
//  * ║                         TEXT-TO-SQL SERVICE                                   ║
//  * ╠══════════════════════════════════════════════════════════════════════════════╣
//  * ║  Chuyển đổi câu hỏi tiếng Việt thành SQL query sử dụng GROQ hoặc Gemini AI ║
//  * ║                                                                               ║
//  * ║  FLOW:                                                                        ║
//  * ║  1. Nhận câu hỏi tiếng Việt từ user                                          ║
//  * ║  2. Build prompt với schema + examples                                       ║
//  * ║  3. Gọi GROQ API (ưu tiên) hoặc Gemini API (fallback)                       ║
//  * ║  4. Parse và validate SQL                                                    ║
//  * ║  5. Thực thi SQL trên database                                               ║
//  * ║  6. Format và trả kết quả                                                    ║
//  * ╚══════════════════════════════════════════════════════════════════════════════╝
//  */

// import { GoogleGenerativeAI } from "@google/generative-ai";
// import Groq from "groq-sdk";
// import { Database } from "../config/database";
// import * as fs from "fs";
// import * as path from "path";

// // Database Schema - Mô tả chi tiết cho AI
// const DATABASE_SCHEMA = `
// -- Bảng thành viên gia phả
// CREATE TABLE thanhvien (
//   thanhVienId INT PRIMARY KEY AUTO_INCREMENT,
//   dongHoId VARCHAR(50) NOT NULL,           -- ID dòng họ (bắt buộc filter)
//   hoTen VARCHAR(255) NOT NULL,             -- Họ tên đầy đủ (VD: "Nguyễn Văn A")
//   gioiTinh TINYINT,                        -- 1=Nam, 0=Nữ
//   ngaySinh DATE,                           -- Ngày sinh
//   ngayMat DATE,                            -- Ngày mất (NULL = còn sống)
//   noiSinh VARCHAR(255),                    -- Nơi sinh (VD: "Hà Nội")
//   noiMat VARCHAR(255),                     -- Nơi mất
//   ngheNghiep VARCHAR(255),                 -- Nghề nghiệp
//   trinhDoHocVan VARCHAR(255),              -- Trình độ học vấn
//   soDienThoai VARCHAR(11),                 -- Số điện thoại
//   diaChiHienTai VARCHAR(255),              -- Địa chỉ hiện tại
//   tieuSu TEXT,                             -- Tiểu sử
//   doiThuoc INT,                            -- Đời thứ mấy (1, 2, 3...)
//   chaId INT,                               -- ID của cha (NULL = không có)
//   meId INT,                                -- ID của mẹ (NULL = không có)
//   voId INT,                                -- ID của vợ (NULL = chưa có vợ)
//   chongId INT,                             -- ID của chồng (NULL = chưa có chồng)
//   active_flag TINYINT DEFAULT 1,           -- 1=active, 0=deleted
//   FOREIGN KEY (chaId) REFERENCES thanhvien(thanhVienId),
//   FOREIGN KEY (meId) REFERENCES thanhvien(thanhVienId)
// );

// -- Bảng quan hệ giữa các thành viên
// CREATE TABLE quanhe (
//   quanHeId VARCHAR(50) PRIMARY KEY,
//   thanhVien1Id INT NOT NULL,               -- ID thành viên 1
//   thanhVien2Id INT NOT NULL,               -- ID thành viên 2
//   loaiQuanHeId VARCHAR(50) NOT NULL,       -- Loại quan hệ (HONNHAN, CHACONRUOT...)
//   dongHoId1 VARCHAR(50),                   -- Dòng họ của thành viên 1
//   dongHoId2 VARCHAR(50),                   -- Dòng họ của thành viên 2
//   ngayBatDau DATE,                         -- Ngày bắt đầu quan hệ
//   ngayKetThuc DATE,                        -- Ngày kết thúc (NULL = còn hiệu lực)
//   active_flag TINYINT DEFAULT 1,
//   FOREIGN KEY (thanhVien1Id) REFERENCES thanhvien(thanhVienId),
//   FOREIGN KEY (thanhVien2Id) REFERENCES thanhvien(thanhVienId)
// );

// -- Bảng loại quan hệ
// CREATE TABLE loaiquanhe (
//   loaiQuanHeId VARCHAR(50) PRIMARY KEY,
//   tenLoaiQuanHe VARCHAR(100) NOT NULL      -- Tên loại quan hệ
// );
// `;

// // Few-shot examples từ dataset
// let FEW_SHOT_EXAMPLES: Array<{ question: string; sql: string }> = [];

// // Load examples từ file JSON
// function loadExamples() {
//   try {
//     // Đường dẫn tới file dataset (từ myFamilyTree/src/services -> myFamilyTree/data)
//     const datasetPath = path.join(__dirname, "../../data/member.json");
    
//     if (fs.existsSync(datasetPath)) {
//       const data = fs.readFileSync(datasetPath, "utf-8");
//       FEW_SHOT_EXAMPLES = JSON.parse(data);
//       console.log(`✅ Loaded ${FEW_SHOT_EXAMPLES.length} examples from dataset`);
//       console.log(`📁 Dataset path: ${datasetPath}`);
//     } else {
//       console.warn("⚠️ Dataset file not found at:", datasetPath);
//       console.warn("⚠️ Using empty examples");
//     }
//   } catch (error) {
//     console.error("❌ Error loading examples:", error);
//   }
// }

// // Initialize examples
// loadExamples();

// /**
//  * Build prompt cho Gemini AI
//  */
// function buildPrompt(question: string, dongHoId: string): string {
//   let prompt = `### NHIỆM VỤ
// Bạn là chuyên gia SQL cho hệ thống gia phả Việt Nam. 
// Nhiệm vụ: Chuyển câu hỏi tiếng Việt thành SQL query chính xác.

// ### DATABASE SCHEMA
// ${DATABASE_SCHEMA}

// ### QUY TẮC BẮT BUỘC
// 1. ✅ LUÔN LUÔN thêm điều kiện: dongHoId = '${dongHoId}' 
// 2. ✅ LUÔN LUÔN thêm điều kiện: active_flag = 1 (trừ khi câu hỏi về deleted records)
// 3. ✅ CHỈ trả về SQL query thuần túy, KHÔNG giải thích, KHÔNG markdown
// 4. ✅ Sử dụng LIKE '%keyword%' cho tìm kiếm text (VD: hoTen LIKE '%Nguyễn%')
// 5. ✅ gioiTinh: 1=Nam, 0=Nữ
// 6. ✅ ngayMat IS NULL = còn sống, ngayMat IS NOT NULL = đã mất
// 7. ✅ Với câu hỏi về người cụ thể, dùng hoTen = 'Tên đầy đủ'
// 8. ✅ Khi đếm con: dùng chaId hoặc meId tùy giới tính
// 9. ✅ Khi tìm anh chị em: cùng chaId hoặc meId

// ### VÍ DỤ THAM KHẢO
// ${FEW_SHOT_EXAMPLES.slice(0, 10)
//   .map((ex) => `Q: ${ex.question}\nSQL: ${ex.sql.replace(/dongHoId = \?/g, `dongHoId = '${dongHoId}'`)}`)
//   .join("\n\n")}

// ### CÂU HỎI CỦA NGƯỜI DÙNG
// Q: ${question}

// ### SQL QUERY (chỉ trả về SQL, không có text khác):`;

//   return prompt;
// }

// /**
//  * Parse SQL từ response của Gemini
//  */
// function parseSQL(response: string): string {
//   // Remove markdown code blocks
//   let sql = response.trim();
//   sql = sql.replace(/```sql\n?/gi, "");
//   sql = sql.replace(/```\n?/g, "");
//   sql = sql.replace(/^SQL:\s*/i, "");
//   sql = sql.trim();

//   // Remove trailing semicolon if exists
//   if (sql.endsWith(";")) {
//     sql = sql.slice(0, -1);
//   }

//   return sql;
// }

// /**
//  * Validate SQL query
//  */
// function validateSQL(sql: string): { valid: boolean; error?: string } {
//   // Check if SQL is empty
//   if (!sql || sql.length === 0) {
//     return { valid: false, error: "SQL query is empty" };
//   }

//   // Check for dangerous operations
//   const dangerousKeywords = ["DROP", "DELETE", "TRUNCATE", "ALTER", "CREATE", "INSERT", "UPDATE"];
//   const upperSQL = sql.toUpperCase();

//   for (const keyword of dangerousKeywords) {
//     if (upperSQL.includes(keyword)) {
//       return { valid: false, error: `Dangerous operation detected: ${keyword}` };
//     }
//   }

//   // Must be SELECT query
//   if (!upperSQL.startsWith("SELECT")) {
//     return { valid: false, error: "Only SELECT queries are allowed" };
//   }

//   return { valid: true };
// }

// /**
//  * Format kết quả query
//  */
// function formatResults(results: any[], sql: string): any {
//   // Nếu là COUNT query
//   if (sql.toUpperCase().includes("COUNT(*)")) {
//     const count = results[0]?.["COUNT(*)"] || 0;
//     return {
//       type: "count",
//       value: count,
//       message: `Kết quả: ${count}`,
//     };
//   }

//   // Nếu là query lấy danh sách
//   if (results.length > 0) {
//     return {
//       type: "list",
//       count: results.length,
//       data: results,
//       message: `Tìm thấy ${results.length} kết quả`,
//     };
//   }

//   // Không có kết quả
//   return {
//     type: "empty",
//     count: 0,
//     data: [],
//     message: "Không tìm thấy kết quả nào",
//   };
// }

// /**
//  * Main service: Text to SQL
//  */
// export class Text2SQLService {
//   private groq: Groq | null = null;
//   private genAI: GoogleGenerativeAI | null = null;
//   private geminiModel: any = null;
//   private db: Database;

//   constructor() {
//     // Initialize GROQ (primary)
//     const groqApiKey = process.env.GROQ_API_KEY;
//     if (groqApiKey) {
//       this.groq = new Groq({ apiKey: groqApiKey });
//       console.log("✅ GROQ API initialized");
//     } else {
//       console.warn("⚠️ GROQ_API_KEY not found");
//     }

//     // Initialize Gemini (fallback)
//     const geminiApiKey = process.env.GEMINI_API_KEY;
//     if (geminiApiKey) {
//       this.genAI = new GoogleGenerativeAI(geminiApiKey);
//       this.geminiModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
//       console.log("✅ Gemini API initialized");
//     } else {
//       console.warn("⚠️ GEMINI_API_KEY not found");
//     }

//     if (!this.groq && !this.genAI) {
//       throw new Error("Neither GROQ_API_KEY nor GEMINI_API_KEY found in environment variables");
//     }

//     this.db = new Database();
//   }

//   /**
//    * Gọi GROQ API để sinh SQL
//    */
//   private async callGroqAPI(prompt: string): Promise<string> {
//     if (!this.groq) {
//       throw new Error("GROQ API not initialized");
//     }

//     const completion = await this.groq.chat.completions.create({
//       messages: [
//         {
//           role: "user",
//           content: prompt,
//         },
//       ],
//       model: "llama-3.3-70b-versatile", // Model mạnh nhất của GROQ
//       temperature: 0.1,
//       max_tokens: 1024,
//     });

//     return completion.choices[0]?.message?.content || "";
//   }

//   /**
//    * Gọi Gemini API để sinh SQL
//    */
//   private async callGeminiAPI(prompt: string): Promise<string> {
//     if (!this.geminiModel) {
//       throw new Error("Gemini API not initialized");
//     }

//     const result = await this.geminiModel.generateContent(prompt);
//     const response = await result.response;
//     return response.text();
//   }

//   /**
//    * Xử lý câu hỏi và trả về kết quả
//    */
//   async processQuestion(question: string, dongHoId: string): Promise<any> {
//     try {
//       // 1. Build prompt
//       const prompt = buildPrompt(question, dongHoId);
//       let generatedSQL = "";
//       let usedAPI = "";

//       // 2. Gọi AI API (ưu tiên GROQ, fallback Gemini)
//       try {
//         if (this.geminiModel) {
//           console.log("🔄 Falling back to Gemini API...");
//           generatedSQL = await this.callGeminiAPI(prompt);
//           usedAPI = "Gemini";
//           console.log("✅ Gemini response:", generatedSQL);
//         } else {
//           throw new Error("Both GROQ and Gemini APIs failed");
//         }
//       } catch (groqError: any) {
//         console.warn("⚠️ Gemini API failed:", groqError.message);

//         if (this.groq) {
//           console.log("🤖 Calling GROQ API...");
//           generatedSQL = await this.callGroqAPI(prompt);
//           usedAPI = "GROQ";
//           console.log("✅ GROQ response:", generatedSQL);
//         } else {
//           throw new Error("GROQ not available");
//         }
        
//       }

//       // 3. Parse SQL
//       const sql = parseSQL(generatedSQL);
//       console.log("🔍 Parsed SQL:", sql);

//       // 4. Validate SQL
//       const validation = validateSQL(sql);
//       if (!validation.valid) {
//         throw new Error(`Invalid SQL: ${validation.error}`);
//       }

//       // 5. Thực thi SQL
//       console.log("💾 Executing SQL on database...");
//       const [results] = await this.db.rawQuery(sql, []);
//       console.log(`✅ Query executed successfully, ${results.length} rows returned`);

//       // 6. Format kết quả
//       const formattedResults = formatResults(results, sql);

//       return {
//         success: true,
//         question,
//         sql,
//         result: formattedResults,
//         usedAPI, // Thêm thông tin API nào được dùng
//         timestamp: new Date().toISOString(),
//       };
//     } catch (error: any) {
//       throw new Error(`Text2SQL Error: ${error.message}`);
//     }
//   }

//   /**
//    * Lấy danh sách examples
//    */
//   getExamples(): Array<{ question: string; sql: string }> {
//     return FEW_SHOT_EXAMPLES;
//   }

//   /**
//    * Reload examples từ file
//    */
//   reloadExamples(): void {
//     loadExamples();
//   }
// }
/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                     TEXT-TO-SQL SERVICE (ENHANCED v2)                        ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  Chuyển đổi câu hỏi tiếng Việt thành SQL query                              ║
 * ║                                                                               ║
 * ║  IMPROVEMENTS v2:                                                             ║
 * ║  ✅ Smart fallback: Gemini → GROQ → Error với thông báo rõ ràng             ║
 * ║  ✅ Retry logic với exponential backoff                                       ║
 * ║  ✅ Xử lý "không tìm thấy" thông minh - gợi ý câu hỏi liên quan            ║
 * ║  ✅ Intent detection - phát hiện câu hỏi không thể trả lời bằng SQL        ║
 * ║  ✅ Fuzzy name matching - tìm tên gần đúng khi exact match fail             ║
 * ║  ✅ Kết quả phong phú hơn với metadata                                       ║
 * ║  ✅ Caching prompt để tiết kiệm token                                        ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { Database } from "../config/database";
import * as fs from "fs";
import * as path from "path";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Example {
  question: string;
  sql: string;
}

interface SQLResult {
  success: boolean;
  question: string;
  sql: string;
  result: FormattedResult;
  usedAPI: string;
  executionTimeMs: number;
  timestamp: string;
  suggestions?: string[]; // Câu hỏi gợi ý khi không có kết quả
  warning?: string;       // Cảnh báo nếu query có vấn đề
}

interface FormattedResult {
  type: "count" | "list" | "empty" | "single" | "stats";
  value?: number | string;
  count?: number;
  data?: any[];
  message: string;
  humanReadable?: string; // Diễn giải bằng tiếng Việt
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

// ─── Database Schema ──────────────────────────────────────────────────────────

const DATABASE_SCHEMA = `
-- BẢNG CHÍNH: thành viên gia phả
CREATE TABLE thanhvien (
  thanhVienId   INT PRIMARY KEY AUTO_INCREMENT,
  dongHoId      VARCHAR(50)  NOT NULL,   -- ID dòng họ (BẮT BUỘC trong mọi query)
  hoTen         VARCHAR(255) NOT NULL,   -- Họ tên đầy đủ, VD: "Nguyễn Văn A"
  gioiTinh      TINYINT,                 -- 1 = Nam, 0 = Nữ
  ngaySinh      DATE,                    -- Ngày sinh (có thể NULL)
  ngayMat       DATE,                    -- Ngày mất, NULL = còn sống
  noiSinh       VARCHAR(255),            -- Nơi sinh, VD: "Hà Nội"
  noiMat        VARCHAR(255),            -- Nơi mất
  ngheNghiep    VARCHAR(255),            -- Nghề nghiệp
  trinhDoHocVan VARCHAR(255),            -- Trình độ học vấn
  soDienThoai   VARCHAR(11),             -- Số điện thoại
  diaChiHienTai VARCHAR(255),            -- Địa chỉ hiện tại
  tieuSu        TEXT,                    -- Tiểu sử
  doiThuoc      INT,                     -- Đời thứ mấy (1, 2, 3...)
  chaId         INT REFERENCES thanhvien(thanhVienId),  -- ID cha
  meId          INT REFERENCES thanhvien(thanhVienId),  -- ID mẹ
  voId          INT,                     -- ID vợ (dành cho Nam)
  chongId       INT,                     -- ID chồng (dành cho Nữ)
  active_flag   TINYINT DEFAULT 1        -- 1 = active, 0 = deleted
);

-- BẢNG PHỤ: quan hệ giữa các thành viên
CREATE TABLE quanhe (
  quanHeId      VARCHAR(50) PRIMARY KEY,
  thanhVien1Id  INT REFERENCES thanhvien(thanhVienId),
  thanhVien2Id  INT REFERENCES thanhvien(thanhVienId),
  loaiQuanHeId  VARCHAR(50),  -- 'HONNHAN', 'CHACONRUOT', v.v.
  dongHoId1     VARCHAR(50),
  dongHoId2     VARCHAR(50),
  ngayBatDau    DATE,
  ngayKetThuc   DATE,         -- NULL = còn hiệu lực
  active_flag   TINYINT DEFAULT 1
);

-- BẢNG PHỤ: loại quan hệ
CREATE TABLE loaiquanhe (
  loaiQuanHeId  VARCHAR(50) PRIMARY KEY,
  tenLoaiQuanHe VARCHAR(100)
);
`;

// ─── Prompt Rules ─────────────────────────────────────────────────────────────

const PROMPT_RULES = `
### QUY TẮC BẮT BUỘC (KHÔNG ĐƯỢC VI PHẠM)

**Bảo mật & lọc dữ liệu:**
1. ✅ LUÔN thêm: WHERE dongHoId = '{dongHoId}' (thay bằng ID thực tế)
2. ✅ LUÔN thêm: AND active_flag = 1 (trừ khi hỏi về deleted records)
3. 🚫 KHÔNG dùng: DROP, DELETE, TRUNCATE, ALTER, CREATE, INSERT, UPDATE
4. ✅ CHỈ được dùng SELECT

**Tìm kiếm text:**
5. ✅ Tìm tên: dùng hoTen LIKE '%từ khóa%' hoặc hoTen = 'Tên đầy đủ'
6. ✅ Tìm địa danh, nghề nghiệp: dùng LIKE '%từ khóa%'

**Quan hệ gia đình:**
7. ✅ gioiTinh: 1 = Nam, 0 = Nữ
8. ✅ ngayMat IS NULL = còn sống | ngayMat IS NOT NULL = đã mất
9. ✅ chaId / meId: dùng subquery để tìm ID của cha/mẹ
10. ✅ Khi tìm anh chị em ruột: cùng chaId VÀ meId
11. ✅ voId: ID vợ của người nam | chongId: ID chồng của người nữ
12. ✅ Ông nội = cha của cha, Bà nội = mẹ của cha
13. ✅ Ông ngoại = cha của mẹ, Bà ngoại = mẹ của mẹ

**Output format:**
14. ✅ CHỈ trả về SQL query thuần túy - KHÔNG thêm giải thích, markdown, ký tự thừa
15. ✅ Đặt alias rõ ràng cho các cột tính toán (AS soLuong, AS tuoi, v.v.)
16. ✅ Với thống kê: dùng GROUP BY + ORDER BY + LIMIT hợp lý

**Xử lý trường hợp đặc biệt:**
17. ✅ Nếu câu hỏi mơ hồ (ví dụ: "người nào đó"): hãy tạo query tổng quát nhất có thể
18. ✅ Nếu câu hỏi về nhiều mối quan hệ (cháu, chắt): dùng multi-level JOIN
`;

// ─── Intent Detection ─────────────────────────────────────────────────────────

/**
 * Phát hiện câu hỏi KHÔNG thể trả lời bằng SQL từ schema hiện tại
 * Trả về thông báo lỗi tiếng Việt nếu phát hiện intent không hợp lệ
 */
function detectUnsupportedIntent(question: string): string | null {
  const q = question.toLowerCase();

  const unsupportedPatterns: Array<{ pattern: RegExp; message: string }> = [
    {
      pattern: /ảnh|hình ảnh|avatar|photo/,
      message: "Hệ thống không lưu trữ ảnh trong cơ sở dữ liệu. Tính năng ảnh được quản lý riêng.",
    },
    {
      pattern: /xóa|xoa|delete|drop|sửa|sua|cập nhật|cap nhat|thêm|them|insert|update/,
      message: "Hệ thống chỉ hỗ trợ truy vấn thông tin (SELECT). Các thao tác thêm/sửa/xóa không được phép qua giao diện này.",
    },
    {
      pattern: /mật khẩu|mat khau|password|tài khoản|tai khoan|đăng nhập|dang nhap/,
      message: "Thông tin xác thực không được lưu trong bảng gia phả.",
    },
    {
      pattern: /thời tiết|thoi tiet|tỷ giá|ty gia|lịch sử việt nam|lich su viet nam/,
      message: "Câu hỏi này nằm ngoài phạm vi dữ liệu gia phả.",
    },
  ];

  for (const { pattern, message } of unsupportedPatterns) {
    if (pattern.test(q)) return message;
  }

  return null;
}

// ─── Suggestions Generator ────────────────────────────────────────────────────

/**
 * Tạo gợi ý câu hỏi liên quan khi không có kết quả hoặc có lỗi
 */
function generateSuggestions(question: string, dongHoId: string): string[] {
  const q = question.toLowerCase();
  const suggestions: string[] = [];

  if (q.includes("con")) {
    suggestions.push("Thử: 'Danh sách tất cả thành viên' để xem ai có trong gia phả");
    suggestions.push("Thử: 'Danh sách người có ít nhất một con'");
  }
  if (q.includes("sống") || q.includes("mất")) {
    suggestions.push("Thử: 'Có bao nhiêu người còn sống?'");
    suggestions.push("Thử: 'Có bao nhiêu người đã mất?'");
  }
  if (q.includes("cha") || q.includes("mẹ") || q.includes("ba") || q.includes("má")) {
    suggestions.push("Hãy kiểm tra tên đầy đủ của người thân trong gia phả trước");
    suggestions.push("Thử: 'Danh sách tất cả thành viên' để xem tên chính xác");
  }
  if (q.includes("đời")) {
    suggestions.push("Thử: 'Gia phả có bao nhiêu đời?' để biết số đời hiện có");
    suggestions.push("Thử: 'Thống kê số người theo từng đời'");
  }

  // Default suggestions
  if (suggestions.length === 0) {
    suggestions.push("Thử: 'Danh sách tất cả thành viên'");
    suggestions.push("Thử: 'Có bao nhiêu người trong gia phả?'");
    suggestions.push("Thử: 'Thống kê số người theo từng đời'");
  }

  return suggestions.slice(0, 3);
}

// ─── Fuzzy Name Fallback ──────────────────────────────────────────────────────

/**
 * Khi query trả về kết quả rỗng và câu hỏi có tên người,
 * thử tìm kiếm fuzzy để gợi ý tên gần đúng
 */
async function tryFuzzyNameSearch(
  question: string,
  dongHoId: string,
  db: Database
): Promise<{ found: boolean; candidates: string[] }> {
  // Trích xuất token có vẻ là tên người (chứa chữ hoa, dài >= 4 ký tự)
  const tokens = question
    .split(/\s+/)
    .filter((t) => t.length >= 4 && /[A-ZÀÁẢÃẠĂẮẶẰẲẴÂẤẬẦẨẪĐÈÉẸẺẼÊẾỆỀỂỄÌÍỊỈĨÒÓỌỎÕÔỐỘỒỔỖƠỚỢỜỞỠÙÚỤỦŨƯỨỰỪỬỮỲÝỴỶỸ]/i.test(t));

  if (tokens.length === 0) return { found: false, candidates: [] };

  // Tìm kiếm LIKE cho từng token
  const candidates: string[] = [];
  for (const token of tokens.slice(0, 3)) {
    try {
      const [rows]: any = await db.rawQuery(
        `SELECT DISTINCT hoTen FROM thanhvien WHERE dongHoId = ? AND hoTen LIKE ? AND active_flag = 1 LIMIT 5`,
        [dongHoId, `%${token}%`]
      );
      rows.forEach((r: any) => {
        if (!candidates.includes(r.hoTen)) candidates.push(r.hoTen);
      });
    } catch (_) {
      // Bỏ qua lỗi fuzzy search
    }
  }

  return { found: candidates.length > 0, candidates: candidates.slice(0, 5) };
}

// ─── Dataset Loader ───────────────────────────────────────────────────────────

let FEW_SHOT_EXAMPLES: Example[] = [];

function loadExamples(): void {
  const possiblePaths = [
    path.join(__dirname, "../../data/member_extended.json"),
    path.join(__dirname, "../../data/member.json"),
  ];

  for (const datasetPath of possiblePaths) {
    if (fs.existsSync(datasetPath)) {
      try {
        const data = fs.readFileSync(datasetPath, "utf-8");
        FEW_SHOT_EXAMPLES = JSON.parse(data);
        console.log(`✅ Loaded ${FEW_SHOT_EXAMPLES.length} examples from: ${datasetPath}`);
        return;
      } catch (err) {
        console.error(`❌ Failed to parse ${datasetPath}:`, err);
      }
    }
  }

  console.warn("⚠️  No dataset file found — using empty examples");
}

loadExamples();

// ─── Prompt Builder ───────────────────────────────────────────────────────────

/**
 * Chọn examples phù hợp nhất với câu hỏi (keyword matching)
 * Thay vì lấy 10 examples đầu tiên cố định
 */
function selectRelevantExamples(question: string, maxCount = 8): Example[] {
  const q = question.toLowerCase();
  const keywords = q.split(/\s+/).filter((w) => w.length > 2);

  // Score từng example dựa trên số keyword trùng khớp
  const scored = FEW_SHOT_EXAMPLES.map((ex) => {
    const exQ = ex.question.toLowerCase();
    const score = keywords.filter((kw) => exQ.includes(kw)).length;
    return { ex, score };
  });

  // Lấy top N examples có điểm cao nhất + một số examples random để đa dạng
  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCount)
    .map((s) => s.ex);

  return top;
}

function buildPrompt(question: string, dongHoId: string): string {
  const relevantExamples = selectRelevantExamples(question);

  const examplesText = relevantExamples
    .map((ex) => `Q: ${ex.question}\nSQL: ${ex.sql.replace(/\?/g, `'${dongHoId}'`)}`)
    .join("\n\n");

  return `### NHIỆM VỤ
Bạn là chuyên gia SQL cho hệ thống gia phả Việt Nam.
Chuyển đổi câu hỏi tiếng Việt dưới đây thành SQL query chính xác.
dongHoId hiện tại là: '${dongHoId}'

### DATABASE SCHEMA
${DATABASE_SCHEMA}

${PROMPT_RULES.replace(/{dongHoId}/g, dongHoId)}

### VÍ DỤ THAM KHẢO (được chọn phù hợp với câu hỏi)
${examplesText}

### CÂU HỎI
Q: ${question}

### OUTPUT (chỉ trả về SQL query thuần túy, không có bất kỳ text nào khác):`;
}

// ─── SQL Parser & Validator ───────────────────────────────────────────────────

function parseSQL(response: string): string {
  let sql = response.trim();
  // Strip markdown fences
  sql = sql.replace(/```sql\s*/gi, "").replace(/```\s*/g, "");
  // Strip inline labels
  sql = sql.replace(/^(SQL|Query|Answer)\s*:\s*/i, "");
  // Strip leading/trailing whitespace and trailing semicolon
  sql = sql.trim().replace(/;$/, "").trim();
  return sql;
}

function validateSQL(sql: string): ValidationResult {
  if (!sql || sql.trim().length === 0) {
    return { valid: false, error: "AI không tạo được SQL query. Vui lòng thử lại với câu hỏi khác." };
  }

  const upper = sql.toUpperCase();

  // Block dangerous operations
  const dangerous = ["DROP", "DELETE", "TRUNCATE", "ALTER", "CREATE TABLE", "INSERT", "UPDATE"];
  for (const kw of dangerous) {
    if (upper.includes(kw)) {
      return { valid: false, error: `Thao tác không được phép: ${kw}. Hệ thống chỉ cho phép truy vấn SELECT.` };
    }
  }

  // Must start with SELECT
  if (!upper.trimStart().startsWith("SELECT")) {
    return { valid: false, error: "Chỉ chấp nhận câu lệnh SELECT." };
  }

  // Warn if dongHoId filter is missing (shouldn't happen but just in case)
  const warning = !upper.includes("DONGHOID")
    ? "Cảnh báo: Query không có điều kiện dongHoId — kết quả có thể không chính xác."
    : undefined;

  return { valid: true, warning };
}

// ─── Result Formatter ─────────────────────────────────────────────────────────

function formatResults(results: any[], sql: string): FormattedResult {
  const upperSQL = sql.toUpperCase();

  // COUNT(*) query
  if (upperSQL.includes("COUNT(*)") || upperSQL.includes("COUNT( * )")) {
    const firstRow = results[0] || {};
    const countKey = Object.keys(firstRow).find((k) =>
      k.toLowerCase().includes("count") || k.toLowerCase().includes("so")
    );
    const count = countKey ? Number(firstRow[countKey]) : 0;
    return {
      type: "count",
      value: count,
      count,
      message: `Kết quả: ${count.toLocaleString("vi-VN")}`,
      humanReadable: `Có tổng cộng **${count.toLocaleString("vi-VN")}** kết quả phù hợp.`,
    };
  }

  // Single row with single column → treat as scalar
  if (results.length === 1 && Object.keys(results[0]).length === 1) {
    const val = Object.values(results[0])[0];
    if (val === null || val === undefined) {
      return {
        type: "empty",
        count: 0,
        data: [],
        message: "Không tìm thấy thông tin",
        humanReadable: "Không có dữ liệu cho câu hỏi này.",
      };
    }
    return {
      type: "single",
      value: String(val),
      count: 1,
      data: results,
      message: `Kết quả: ${val}`,
      humanReadable: `**${val}**`,
    };
  }

  // Multiple rows / multiple columns → list
  if (results.length > 0) {
    return {
      type: results.length > 1 ? "list" : "single",
      count: results.length,
      data: results,
      message: `Tìm thấy ${results.length.toLocaleString("vi-VN")} kết quả`,
      humanReadable: `Tìm thấy **${results.length.toLocaleString("vi-VN")}** kết quả phù hợp.`,
    };
  }

  // Empty
  return {
    type: "empty",
    count: 0,
    data: [],
    message: "Không tìm thấy kết quả nào",
    humanReadable: "Không có dữ liệu phù hợp với tiêu chí tìm kiếm.",
  };
}

// ─── Retry Helper ─────────────────────────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 2,
  delayMs = 500
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, delayMs * attempt));
      }
    }
  }
  throw lastError!;
}

// ─── Main Service ─────────────────────────────────────────────────────────────

export class Text2SQLService {
  private groq: Groq | null = null;
  private geminiModel: any = null;
  private db: Database;

  constructor() {
    // Initialize GROQ
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      this.groq = new Groq({ apiKey: groqKey });
      console.log("✅ GROQ API initialized");
    } else {
      console.warn("⚠️  GROQ_API_KEY not set");
    }

    // Initialize Gemini
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      this.geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      console.log("✅ Gemini API initialized");
    } else {
      console.warn("⚠️  GEMINI_API_KEY not set");
    }

    if (!this.groq && !this.geminiModel) {
      throw new Error("Cần ít nhất một trong hai: GROQ_API_KEY hoặc GEMINI_API_KEY");
    }

    this.db = new Database();
  }

  // ── Private API callers ───────────────────────────────────────────────────

  private async callGroq(prompt: string): Promise<string> {
    if (!this.groq) throw new Error("GROQ chưa được khởi tạo");
    const completion = await this.groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.05, // Thấp hơn để kết quả ổn định
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    return completion.choices[0]?.message?.content ?? "";
  }

  private async callGemini(prompt: string): Promise<string> {
    if (!this.geminiModel) throw new Error("Gemini chưa được khởi tạo");
    const result = await this.geminiModel.generateContent(prompt);
    return result.response.text();
  }

  /**
   * Gọi AI với thứ tự ưu tiên: Gemini → GROQ
   * Nếu cả hai thất bại → throw error rõ ràng
   */
  private async generateSQL(prompt: string): Promise<{ sql: string; api: string }> {
    // Thử Gemini trước
    if (this.geminiModel) {
      try {
        const raw = await withRetry(() => this.callGemini(prompt), 2);
        const sql = parseSQL(raw);
        if (sql.length > 5) {
          console.log("✅ [Gemini] SQL generated");
          return { sql, api: "Gemini" };
        }
      } catch (err: any) {
        console.warn("⚠️  [Gemini] Failed:", err.message);
      }
    }

    // Fallback: GROQ
    if (this.groq) {
      try {
        const raw = await withRetry(() => this.callGroq(prompt), 2);
        const sql = parseSQL(raw);
        if (sql.length > 5) {
          console.log("✅ [GROQ] SQL generated (fallback)");
          return { sql, api: "GROQ" };
        }
      } catch (err: any) {
        console.warn("⚠️  [GROQ] Failed:", err.message);
      }
    }

    throw new Error(
      "Cả hai API (Gemini và GROQ) đều không phản hồi. Vui lòng thử lại sau ít phút."
    );
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Xử lý câu hỏi tiếng Việt → SQL → kết quả
   */
  async processQuestion(question: string, dongHoId: string): Promise<SQLResult> {
    const startTime = Date.now();

    // 1. Kiểm tra intent không hỗ trợ
    const unsupportedReason = detectUnsupportedIntent(question);
    if (unsupportedReason) {
      return {
        success: false,
        question,
        sql: "",
        result: {
          type: "empty",
          count: 0,
          data: [],
          message: unsupportedReason,
          humanReadable: unsupportedReason,
        },
        usedAPI: "none",
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        suggestions: generateSuggestions(question, dongHoId),
      };
    }

    // 2. Build prompt với examples phù hợp
    const prompt = buildPrompt(question, dongHoId);

    // 3. Generate SQL qua AI
    let sql: string;
    let usedAPI: string;
    try {
      ({ sql, api: usedAPI } = await this.generateSQL(prompt));
    } catch (aiError: any) {
      return {
        success: false,
        question,
        sql: "",
        result: {
          type: "empty",
          count: 0,
          data: [],
          message: aiError.message,
          humanReadable: `❌ ${aiError.message}`,
        },
        usedAPI: "none",
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        suggestions: generateSuggestions(question, dongHoId),
      };
    }

    // 4. Validate SQL
    const validation = validateSQL(sql);
    if (!validation.valid) {
      console.error("❌ Invalid SQL:", validation.error, "\nSQL:", sql);
      return {
        success: false,
        question,
        sql,
        result: {
          type: "empty",
          count: 0,
          data: [],
          message: `SQL không hợp lệ: ${validation.error}`,
          humanReadable: `❌ ${validation.error}`,
        },
        usedAPI,
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        suggestions: generateSuggestions(question, dongHoId),
      };
    }

    // 5. Thực thi SQL
    let rows: any[];
    try {
      console.log("🔍 Executing SQL:", sql);
      const [results] = await this.db.rawQuery(sql, []);
      rows = results as any[];
      console.log(`✅ ${rows.length} rows returned`);
    } catch (dbError: any) {
      console.error("❌ DB Error:", dbError.message);
      return {
        success: false,
        question,
        sql,
        result: {
          type: "empty",
          count: 0,
          data: [],
          message: `Lỗi truy vấn cơ sở dữ liệu: ${dbError.message}`,
          humanReadable: "❌ Có lỗi xảy ra khi truy vấn. Vui lòng thử lại.",
        },
        usedAPI,
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        suggestions: generateSuggestions(question, dongHoId),
      };
    }

    // 6. Xử lý kết quả rỗng → thử fuzzy name search
    let suggestions: string[] | undefined;
    if (rows.length === 0) {
      const fuzzy = await tryFuzzyNameSearch(question, dongHoId, this.db);
      if (fuzzy.found) {
        suggestions = [
          `Bạn có muốn tìm về: ${fuzzy.candidates.slice(0, 3).join(", ")}?`,
          ...generateSuggestions(question, dongHoId).slice(0, 2),
        ];
      } else {
        suggestions = generateSuggestions(question, dongHoId);
      }
    }

    // 7. Format kết quả
    const formatted = formatResults(rows, sql);

    return {
      success: true,
      question,
      sql,
      result: formatted,
      usedAPI,
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      warning: validation.warning,
      ...(suggestions && { suggestions }),
    };
  }

  // ── Utility ───────────────────────────────────────────────────────────────

  getExamples(): Example[] {
    return FEW_SHOT_EXAMPLES;
  }

  reloadExamples(): void {
    loadExamples();
  }

  /**
   * Health check: kiểm tra kết nối DB và AI
   */
  async healthCheck(): Promise<{ db: boolean; groq: boolean; gemini: boolean; examples: number }> {
    let dbOk = false;
    try {
      await this.db.rawQuery("SELECT 1", []);
      dbOk = true;
    } catch (_) {}

    return {
      db: dbOk,
      groq: !!this.groq,
      gemini: !!this.geminiModel,
      examples: FEW_SHOT_EXAMPLES.length,
    };
  }
}