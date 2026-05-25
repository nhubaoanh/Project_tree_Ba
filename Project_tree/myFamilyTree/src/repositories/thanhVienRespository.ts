import { injectable } from "tsyringe";
import { thanhVien } from "../models/thanhvien";
import { Database } from "../config/database";

// Helper: Format date cho MySQL (YYYY-MM-DD)
const formatDateForMySQL = (date: any): string | null => {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split("T")[0];
  } catch {
    return null;
  }
};

@injectable()
export class thanhVienRespository {
  constructor(private db: Database) {}

  // Tạo thành viên mới - sử dụng Composite Key (tự động tăng ID theo dòng họ)
  async createThanhVien(thanhvien: thanhVien): Promise<any> {
    try {
      const sql = `CALL InsertMemberComposite(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, @newId, @err_code, @err_msg)`;
      await this.db.query(sql, [
        thanhvien.dongHoId,
        thanhvien.hoTen,
        thanhvien.gioiTinh,
        formatDateForMySQL(thanhvien.ngaySinh),
        formatDateForMySQL(thanhvien.ngayMat),
        thanhvien.noiSinh,
        thanhvien.noiMat,
        thanhvien.ngheNghiep,
        thanhvien.trinhDoHocVan,
        thanhvien.soDienThoai,
        thanhvien.diaChiHienTai,
        thanhvien.tieuSu,
        thanhvien.anhChanDung,
        thanhvien.doiThuoc,
        thanhvien.chaId,
        thanhvien.meId,
        thanhvien.voId,
        thanhvien.chongId,
        thanhvien.nguoiTaoId,
      ]);
      
      // Lấy ID mới được tạo
      const [result]: any = await this.db.query('SELECT @newId AS newThanhVienId', []);
      return { success: true, thanhVienId: result[0]?.newThanhVienId };
    } catch (error: any) {
      console.log("error database => ", error);
      throw new Error(error.message);
    }
  }

  // Update thành viên - cần cả dongHoId và thanhVienId (Composite Key)
  async updateMultipleThanhVien(thanhVien: thanhVien): Promise<any> {
    try {
      const sql = `CALL UpdateThanhVien(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, @err_code, @err_msg)`;
      await this.db.query(sql, [
        thanhVien.dongHoId,
        thanhVien.thanhVienId,
        thanhVien.hoTen,
        thanhVien.gioiTinh,
        formatDateForMySQL(thanhVien.ngaySinh),
        formatDateForMySQL(thanhVien.ngayMat),
        thanhVien.noiSinh,
        thanhVien.noiMat,
        thanhVien.ngheNghiep,
        thanhVien.trinhDoHocVan,
        thanhVien.soDienThoai, // Thêm số điện thoại
        thanhVien.diaChiHienTai,
        thanhVien.tieuSu,
        thanhVien.anhChanDung,
        thanhVien.doiThuoc,
        thanhVien.chaId,
        thanhVien.meId,
        thanhVien.voId,
        thanhVien.chongId,
        thanhVien.lu_user_id,
      ]);
      return true;
    } catch (error: any) {
      console.log("error database => ", error);
      throw new Error(error.message);
    }
  }

  async saveCoordinates(
    dongHoId: string,
    coordinates: Array<{ thanhVienId: number; toaDoX?: number | null; toaDoY?: number | null }>,
    luUserId?: string
  ): Promise<any> {
    if (!coordinates || coordinates.length === 0) {
      return { success: true, updated: 0 };
    }

    const connection = await this.db.getRawConnection();
    try {
      await connection.beginTransaction();

      const updateSql = `
        UPDATE thanhvien
        SET toaDoX = ?,
            toaDoY = ?,
            updatedCoordinates = NOW(),
            lu_user_id = ?
        WHERE dongHoId = ? AND thanhVienId = ?
      `;

      for (const item of coordinates) {
        if (!item || typeof item.thanhVienId !== "number") {
          throw new Error("Mỗi coordinate phải chứa thanhVienId hợp lệ");
        }

        await connection.query(updateSql, [
          item.toaDoX ?? null,
          item.toaDoY ?? null,
          luUserId || null,
          dongHoId,
          item.thanhVienId,
        ]);
      }

      await connection.commit();
      return { success: true, updated: coordinates.length };
    } catch (error: any) {
      await connection.rollback();
      console.error("❌ [saveCoordinates] Database error:", error.message);
      throw new Error(error.message);
    } finally {
      connection.release();
    }
  }

  async saveEdgeCoordinates(
    dongHoId: string,
    edgeCoordinates: Array<{
      edgeId: string;
      bendX?: number | null;
      bendY?: number | null;
      dx?: number | null;
      dy?: number | null;
      cp1x?: number | null;
      cp1y?: number | null;
      cp2x?: number | null;
      cp2y?: number | null;
    }>,
    luUserId?: string
  ): Promise<any> {
    if (!edgeCoordinates || edgeCoordinates.length === 0) {
      return { success: true, updated: 0 };
    }

    const connection = await this.db.getRawConnection();
    try {
      await connection.beginTransaction();

      const insertSql = `
        INSERT INTO edge_coordinates
        (dongHoId, edgeId, bendX, bendY, dx, dy, cp1x, cp1y, cp2x, cp2y, lu_user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          bendX = VALUES(bendX),
          bendY = VALUES(bendY),
          dx = VALUES(dx),
          dy = VALUES(dy),
          cp1x = VALUES(cp1x),
          cp1y = VALUES(cp1y),
          cp2x = VALUES(cp2x),
          cp2y = VALUES(cp2y),
          lu_user_id = VALUES(lu_user_id),
          active_flag = 1
      `;

      for (const item of edgeCoordinates) {
        if (!item || !item.edgeId) {
          throw new Error("Mỗi edgeCoordinate phải chứa edgeId");
        }

        await connection.query(insertSql, [
          dongHoId,
          item.edgeId,
          item.bendX ?? null,
          item.bendY ?? null,
          item.dx ?? null,
          item.dy ?? null,
          item.cp1x ?? null,
          item.cp1y ?? null,
          item.cp2x ?? null,
          item.cp2y ?? null,
          luUserId || null,
        ]);
      }

      await connection.commit();
      return { success: true, updated: edgeCoordinates.length };
    } catch (error: any) {
      await connection.rollback();
      console.error("❌ [saveEdgeCoordinates] Database error:", error.message);
      throw new Error(error.message);
    } finally {
      connection.release();
    }
  }

  async loadEdgeCoordinates(dongHoId: string): Promise<any> {
    try {
      const sql = `SELECT * FROM edge_coordinates WHERE dongHoId = ? AND active_flag = 1`;
      const [rows] = await this.db.rawQuery(sql, [dongHoId]);
      return Array.isArray(rows) ? rows : [];
    } catch (error: any) {
      console.error("❌ [loadEdgeCoordinates] Database error:", error.message);
      throw new Error(error.message);
    }
  }

  // Lấy thành viên theo Composite Key (dongHoId + thanhVienId)
  async getThanhVienById(dongHoId: string, thanhVienId: number): Promise<any> {
    try {
      const sql = "CALL GetMemberById(?, ?, @err_code, @err_mgs)";
      const [result] = await this.db.query(sql, [dongHoId, thanhVienId]);
      return result;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Xóa thành viên (soft delete) - cần Composite Key
  async deleteThanhVien(dongHoId: string, thanhVienId: number): Promise<any> {
    try {
      const sql = "CALL DeleteThanhVien(?, ?, @err_code, @err_msg)";
      await this.db.query(sql, [dongHoId, thanhVienId]);
      
      // Lấy output params
      const [outParams]: any = await this.db.query('SELECT @err_code AS err_code, @err_msg AS err_msg', []);
      if (outParams[0]?.err_code !== 0) {
        throw new Error(outParams[0]?.err_msg || 'Lỗi xóa thành viên');
      }
      
      return true;
    } catch (error: any) {
      console.log("error database => ", error);
      throw new Error(error.message);
    }
  }

  // Xóa nhiều thành viên
  async deleteMultipleThanhVien(listJson: any[], luUserId: string): Promise<any> {
    try {
      const sql = "CALL DeleteThanhVienMultiple(?, ?, @err_code, @err_msg)";
      await this.db.query(sql, [JSON.stringify(listJson), luUserId]);
      return true;
    } catch (error: any) {
      console.log("error database => ", error);
      throw new Error(error.message);
    }
  }


  async getAllThanhVien(): Promise<any> {
    try {
      const sql = "CALL getAllMember(@err_code, @err_msg)";
      const result = await this.db.query(sql, []);
      return result;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async getAllByDongHo(dongHoId: string): Promise<any> {
    try { 
      const sql = "CALL GetAllMemberByDongHo(?, @err_code, @err_mgs)";
      // Dùng rawQuery vì đây là SELECT thuần, không phải stored procedure
      const result = await this.db.query(sql, [dongHoId]);
      // result là [[rows], fields] từ mysql2
      if (Array.isArray(result) && Array.isArray(result[0])) {
        return result[0];
      }
      return Array.isArray(result) ? result : [];
    } catch (error: any) {
      console.error("❌ getAllByDongHo error:", error);
      throw new Error(error?.message || "Lỗi truy vấn database");
    }
  }

  // Search thành viên theo dòng họ cụ thể (dùng procedure mới)
  async searchThanhVienByDongHo(
    pageIndex: number,
    pageSize: number,
    search_content: string,
    dongHoId: string
  ): Promise<any[]> {
    try {
      const sql = "CALL SearchThanhVienByDongHo(?,?,?,?, @err_code, @err_msg)";
      const [result] = await this.db.query(sql, [
        pageIndex,
        pageSize,
        search_content || null,
        dongHoId,
      ]);
      // Nếu result là array of arrays, lấy array đầu tiên
      if (Array.isArray(result) && Array.isArray(result[0])) {
        console.log('[Repository] Detected nested array, using first array');
        return result[0];
      }
      
      return result;
    } catch (error: any) {
      console.error('[Repository] SearchThanhVienByDongHo error:', error.message);
      throw new Error(error);
    }
  }

  // Import từ JSON - sử dụng procedure mới cho Composite Key
  async importFromJson(
    thanhviens: any[],
    dongHoId: string,
    nguoiTaoId: string
  ): Promise<any> {
    const connection = await this.db.getRawConnection();
    try {
      const jsonData = JSON.stringify(thanhviens);
      // Gọi stored procedure với OUT params
      await connection.query(
        'CALL ImportThanhVienFromJsonComposite(?, ?, ?, @err_code, @err_msg)',
        [jsonData, dongHoId, nguoiTaoId]
      );

      // Lấy output params
      const [outParams]: any = await connection.query(
        'SELECT @err_code AS err_code, @err_msg AS err_msg'
      );

      if (outParams[0].err_code !== 0 && outParams[0].err_code !== null) {
        throw new Error(outParams[0].err_msg || 'Lỗi khi import dữ liệu');
      }

      return { 
        success: true, 
        count: thanhviens.length,
        message: outParams[0].err_msg 
      };
    } catch (error: any) {
      console.error("❌ Import error:", error.message);
      throw error;
    } finally {
      connection.release();
    }
  }
}
