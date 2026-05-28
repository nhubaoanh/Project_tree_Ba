import { injectable } from "tsyringe";
import { Request, Response } from "express";
import { PhaKyService } from "../services/phaKyService";
import { PhaKy } from "../models/phaky";

@injectable()
export class PhaKyController {
  constructor(private phaKyService: PhaKyService) {}

  async getByDongHo(req: Request, res: Response): Promise<void> {
    try {
      const { dongHoId } = req.params;
      if (!dongHoId) {
        res.status(400).json({ success: false, message: "dongHoId là bắt buộc" });
        return;
      }
      const data = await this.phaKyService.getByDongHo(dongHoId);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Lỗi lấy phả ký" });
    }
  }

  async search(req: Request, res: Response): Promise<void> {
    try {
      const { pageIndex, pageSize, search_content, dongHoId } = req.body;
      if (!dongHoId) {
        res.status(400).json({ success: false, message: "dongHoId là bắt buộc" });
        return;
      }
      const data = await this.phaKyService.search(
        pageIndex || 1,
        pageSize || 10,
        search_content || "",
        dongHoId
      );
      res.json({
        success: true,
        totalItems: data && data.length > 0 ? (data[0] as any).RecordCount : 0,
        page: pageIndex || 1,
        pageSize: pageSize || 10,
        data,
        pageCount: Math.ceil(
          (data && data.length > 0 ? (data[0] as any).RecordCount : 0) / (pageSize || 10)
        ),
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Lỗi tìm kiếm phả ký" });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const phaKy = req.body as PhaKy;
      if (!phaKy.dongHoId) {
        res.status(400).json({ success: false, message: "dongHoId là bắt buộc" });
        return;
      }
      phaKy.nguoiTaoId = (req as any).user?.userId;
      const result = await this.phaKyService.create(phaKy);
      res.status(201).json({ success: true, message: "Tạo phả ký thành công", data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Lỗi tạo phả ký" });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const phaKyId = req.params.id;
      const phaKy = req.body as PhaKy;
      phaKy.phaKyId = phaKyId;
      if (!phaKy.dongHoId) {
        res.status(400).json({ success: false, message: "dongHoId là bắt buộc" });
        return;
      }
      phaKy.lu_user_id = (req as any).user?.userId;
      const result = await this.phaKyService.update(phaKy);
      res.json({ success: true, message: "Cập nhật phả ký thành công", data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Lỗi cập nhật phả ký" });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const phaKyId = req.params.id;
      const luUserId = (req as any).user?.userId || "";
      await this.phaKyService.delete(phaKyId, luUserId);
      res.json({ success: true, message: "Xóa phả ký thành công" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Lỗi xóa phả ký" });
    }
  }
}
