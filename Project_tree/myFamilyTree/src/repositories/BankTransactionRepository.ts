import { injectable } from "tsyringe";
import { Database } from "../config/database";
import { BankTransaction } from "../models/BankTransaction";
import { v4 as uuidv4 } from "uuid";

@injectable()
export class BankTransactionRepository {
  constructor(private db: Database) {}

  async createBankTransaction(data: Partial<BankTransaction>): Promise<BankTransaction> {
    const id = uuidv4();

    const query = `
      INSERT INTO bank_transaction (
        bankTransactionId, dongHoId, nguoiDungId, soTien,
        phuongThucThanhToan, noiDungChuyenKhoan, maGiaoDichNganHang,
        trangThai, soTaiKhoanChuyen, tenTaiKhoanChuyen,
        ngayChuyenKhoan, webhookData, ghiChu, soLanThapTai,
        thanhToanId, lu_user_id, ngayTao, active_flag
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      id,
      data.dongHoId,
      data.nguoiDungId,
      data.soTien,
      data.phuongThucThanhToan,
      data.noiDungChuyenKhoan,
      data.maGiaoDichNganHang,
      data.trangThai || "pending",
      data.soTaiKhoanChuyen || null,
      data.tenTaiKhoanChuyen || null,
      data.ngayChuyenKhoan || new Date(),
      data.webhookData || null,
      data.ghiChu || null,
      data.soLanThapTai || 0,
      data.thanhToanId || null,
      data.luUserId || "SYSTEM",
      new Date(),
      1
    ];

    await this.db.query(query, values);
    return {
      ...data,
      bankTransactionId: id,
    } as BankTransaction;
  }

  async getBankTransactionById(id: string): Promise<BankTransaction | null> {
    const query = `SELECT * FROM bank_transaction WHERE bankTransactionId = ? AND active_flag = 1`;
    const rows = await this.db.query(query, [id]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  async getBankTransactionByMaGiaoDich(maGiaoDich: string): Promise<BankTransaction | null> {
    const query = `SELECT * FROM bank_transaction WHERE maGiaoDichNganHang = ? AND active_flag = 1 LIMIT 1`;
    const [rows] = await this.db.query(query, [maGiaoDich]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  async getBankTransactionsByDongHo(dongHoId: string, pageIndex = 1, pageSize = 10, trangThai?: string) {
    const offset = (pageIndex - 1) * pageSize;
    let query = `SELECT * FROM bank_transaction WHERE dongHoId = ? AND active_flag = 1`;
    const params: any[] = [dongHoId];
    if (trangThai) {
      query += ` AND trangThai = ?`;
      params.push(trangThai);
    }

    const countQuery = query.replace("SELECT *", "SELECT COUNT(*) as total");
    const countResult: any = await this.db.query(countQuery, params);
    const countRows = Array.isArray(countResult[0]) ? countResult[0] : countResult;
    const total = countRows?.[0]?.total ?? 0;

    const dataQuery = query + ` ORDER BY ngayChuyenKhoan DESC LIMIT ? OFFSET ?`;
    const dataParams = [...params, pageSize, offset];
    const dataResult: any = await this.db.query(dataQuery, dataParams);
    const rows = Array.isArray(dataResult[0]) ? dataResult[0] : dataResult;

    return { data: rows ?? [], total };
  }

  async getBankTransactionsByUser(nguoiDungId: string, pageIndex = 1, pageSize = 10) {
    const offset = (pageIndex - 1) * pageSize;
    const countQuery = `SELECT COUNT(*) as total FROM bank_transaction WHERE nguoiDungId = ? AND active_flag = 1`;
    const [countResult] = await this.db.query(countQuery, [nguoiDungId]);
    const total = countResult[0].total;

    const dataQuery = `SELECT * FROM bank_transaction WHERE nguoiDungId = ? AND active_flag = 1 ORDER BY ngayChuyenKhoan DESC LIMIT ? OFFSET ?`;
    const [rows] = await this.db.query(dataQuery, [nguoiDungId, pageSize, offset]);

    return { data: rows, total };
  }

  async updateBankTransactionStatus(bankTransactionId: string, trangThai: string, ngayXacNhan?: Date): Promise<boolean> {
    const query = `UPDATE bank_transaction SET trangThai = ?, ngayXacNhan = ?, lu_updated = ? WHERE bankTransactionId = ?`;
    const result = await this.db.query(query, [trangThai, ngayXacNhan || new Date(), new Date(), bankTransactionId]);
    return result?.affectedRows > 0 || result?.[0]?.affectedRows > 0;
  }

  async getPendingTransactions(dongHoId?: string) {
    let query = `SELECT * FROM bank_transaction WHERE trangThai IN ('pending', 'verified') AND active_flag = 1`;
    const params: any[] = [];
    if (dongHoId) {
      query += ` AND dongHoId = ?`;
      params.push(dongHoId);
    }
    query += ` ORDER BY ngayChuyenKhoan ASC`;
    const [rows] = await this.db.query(query, params);
    return rows;
  }

  async searchBankTransactions(keyword: string, pageIndex = 1, pageSize = 10) {
    const offset = (pageIndex - 1) * pageSize;
    const countQuery = `SELECT COUNT(*) as total FROM bank_transaction WHERE active_flag = 1 AND (noiDungChuyenKhoan LIKE ? OR maGiaoDichNganHang LIKE ? OR tenTaiKhoanChuyen LIKE ?)`;
    const searchTerm = `%${keyword}%`;
    const [countResult] = await this.db.query(countQuery, [searchTerm, searchTerm, searchTerm]);
    const total = countResult[0].total;
    const dataQuery = `SELECT * FROM bank_transaction WHERE active_flag = 1 AND (noiDungChuyenKhoan LIKE ? OR maGiaoDichNganHang LIKE ? OR tenTaiKhoanChuyen LIKE ?) ORDER BY ngayChuyenKhoan DESC LIMIT ? OFFSET ?`;
    const [rows] = await this.db.query(dataQuery, [searchTerm, searchTerm, searchTerm, pageSize, offset]);
    return { data: rows, total };
  }
}
