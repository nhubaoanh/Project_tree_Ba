import { Router } from "express";
import { container } from "tsyringe";
import { suKienController } from "../controllers/suKienController";
import { authenticate } from "../middlewares/authMiddleware";

const suKienRouter = Router();

suKienRouter.use((err: any, req: any, res: any, next: any) => {
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Có lỗi xảy ra khi xử lý yêu cầu",
    });
  }
  next();
});

const eventcontroller = container.resolve(suKienController);

// Tìm kiếm sự kiện
suKienRouter.post(
  "/search",
  authenticate,
  eventcontroller.searchSuKien.bind(eventcontroller)
);

// Tạo sự kiện
suKienRouter.post(
  "/create",
  authenticate,
  eventcontroller.createSuKien.bind(eventcontroller)
);

// Cập nhật sự kiện
suKienRouter.post(
  "/update",
  authenticate,
  eventcontroller.updateSuKien.bind(eventcontroller)
);

// Xóa sự kiện
suKienRouter.post(
  "/delete",
  authenticate,
  eventcontroller.deleteSuKien.bind(eventcontroller)
);

export default suKienRouter;
