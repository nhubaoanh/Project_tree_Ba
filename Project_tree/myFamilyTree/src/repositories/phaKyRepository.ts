import { injectable } from "tsyringe";
import { PhaKy } from "../models/phaky";
import { Database } from "../config/database";
import { v4 as uuidv4 } from "uuid";

const toJsonString = (val: any): string | null => {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") return val;
  return JSON.stringify(val);
};

@injectable()
export class PhaKyRepository {
  constructor(private db: Database) {}

  async getByDongHo(dongHoId: string): Promise<PhaKy | null> {
    try {
      const sql = `
        SELECT pk.phaKyId, pk.dongHoId, pk.luocSu, pk.butTich,
               pk.viToAnh, pk.viToBiography, pk.viToHoTen,
               pk.tuDuongDiaChi, pk.tuDuongLinkMap, pk.tuDuongAnh, pk.tuDuongIframe,
               pk.toQuanDiaChi, pk.toQuanLinkMap, pk.toQuanAnh, pk.toQuanIframe,
               pk.truyenThong, pk.nguoiTaoId, pk.active_flag,
               pk.lu_updated, pk.lu_user_id,
               dh.tenDongHo
        FROM PhaKy pk
        LEFT JOIN DongHo dh ON pk.dongHoId COLLATE utf8mb4_0900_ai_ci = dh.dongHoId
        WHERE pk.dongHoId = ? AND pk.active_flag = 1
        LIMIT 1
      `;
      const raw: any = await this.db.rawQuery(sql, [dongHoId]);
      const rows: any[] = Array.isArray(raw[0]) ? raw[0] : [];
      return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
      console.error("GetPhaKyByDongHo error:", error.message);
      throw new Error(error.message);
    }
  }

  async search(
    pageIndex: number,
    pageSize: number,
    searchContent: string,
    dongHoId: string
  ): Promise<PhaKy[]> {
    try {
      const offset = ((pageIndex || 1) - 1) * (pageSize || 10);
      const like = searchContent ? `%${searchContent}%` : null;
      const sql = `
        SELECT pk.phaKyId, pk.dongHoId, pk.viToHoTen, pk.viToAnh,
               pk.tuDuongDiaChi, pk.toQuanDiaChi, pk.lu_updated,
               dh.tenDongHo,
               COUNT(*) OVER() AS RecordCount
        FROM PhaKy pk
        LEFT JOIN DongHo dh ON pk.dongHoId COLLATE utf8mb4_0900_ai_ci = dh.dongHoId
        WHERE pk.active_flag = 1
          AND (? IS NULL OR pk.dongHoId = ?)
          AND (? IS NULL OR LOWER(CONCAT(
                COALESCE(dh.tenDongHo,''), COALESCE(pk.viToHoTen,''),
                COALESCE(pk.tuDuongDiaChi,''), COALESCE(pk.toQuanDiaChi,'')
              )) LIKE LOWER(?))
        ORDER BY pk.lu_updated DESC
        LIMIT ? OFFSET ?
      `;
      const raw: any = await this.db.rawQuery(sql, [
        dongHoId || null, dongHoId || null,
        like, like,
        pageSize || 10, offset,
      ]);
      const rows: any[] = Array.isArray(raw[0]) ? raw[0] : [];
      return rows as PhaKy[];
    } catch (error: any) {
      console.error("SearchPhaKy error:", error.message);
      throw new Error(error.message);
    }
  }

  async create(phaKy: PhaKy): Promise<any> {
    try {
      const id = uuidv4();
      const sql = `
        INSERT INTO PhaKy (
          phaKyId, dongHoId, luocSu, butTich,
          viToAnh, viToBiography, viToHoTen,
          tuDuongDiaChi, tuDuongLinkMap, tuDuongAnh, tuDuongIframe,
          toQuanDiaChi, toQuanLinkMap, toQuanAnh, toQuanIframe,
          truyenThong, nguoiTaoId, active_flag, lu_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
      `;
      await this.db.rawQuery(sql, [
        id, phaKy.dongHoId,
        toJsonString(phaKy.luocSu), toJsonString(phaKy.butTich),
        phaKy.viToAnh || null, phaKy.viToBiography || null, phaKy.viToHoTen || null,
        phaKy.tuDuongDiaChi || null, phaKy.tuDuongLinkMap || null, phaKy.tuDuongAnh || null, phaKy.tuDuongIframe || null,
        phaKy.toQuanDiaChi || null, phaKy.toQuanLinkMap || null, phaKy.toQuanAnh || null, phaKy.toQuanIframe || null,
        toJsonString(phaKy.truyenThong), phaKy.nguoiTaoId || null,
      ]);
      return { success: true, phaKyId: id };
    } catch (error: any) {
      console.error("InsertPhaKy error:", error.message);
      throw new Error(error.message);
    }
  }

  async update(phaKy: PhaKy): Promise<any> {
    try {
      const sql = `
        UPDATE PhaKy SET
          luocSu = ?, butTich = ?,
          viToAnh = ?, viToBiography = ?, viToHoTen = ?,
          tuDuongDiaChi = ?, tuDuongLinkMap = ?, tuDuongAnh = ?, tuDuongIframe = ?,
          toQuanDiaChi = ?, toQuanLinkMap = ?, toQuanAnh = ?, toQuanIframe = ?,
          truyenThong = ?, lu_updated = NOW(), lu_user_id = ?
        WHERE phaKyId = ? AND dongHoId = ?
      `;
      await this.db.rawQuery(sql, [
        toJsonString(phaKy.luocSu), toJsonString(phaKy.butTich),
        phaKy.viToAnh || null, phaKy.viToBiography || null, phaKy.viToHoTen || null,
        phaKy.tuDuongDiaChi || null, phaKy.tuDuongLinkMap || null, phaKy.tuDuongAnh || null, phaKy.tuDuongIframe || null,
        phaKy.toQuanDiaChi || null, phaKy.toQuanLinkMap || null, phaKy.toQuanAnh || null, phaKy.toQuanIframe || null,
        toJsonString(phaKy.truyenThong), phaKy.lu_user_id || null,
        phaKy.phaKyId, phaKy.dongHoId,
      ]);
      return { success: true };
    } catch (error: any) {
      console.error("UpdatePhaKy error:", error.message);
      throw new Error(error.message);
    }
  }

  async delete(phaKyId: string, luUserId: string): Promise<any> {
    try {
      const sql = `UPDATE PhaKy SET active_flag = 0, lu_updated = NOW(), lu_user_id = ? WHERE phaKyId = ?`;
      await this.db.rawQuery(sql, [luUserId, phaKyId]);
      return { success: true };
    } catch (error: any) {
      console.error("DeletePhaKy error:", error.message);
      throw new Error(error.message);
    }
  }
}
