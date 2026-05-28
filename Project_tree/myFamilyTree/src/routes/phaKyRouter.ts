import { Router } from "express";
import { container } from "tsyringe";
import { PhaKyController } from "../controllers/phaKyController";
import { authenticate } from "../middlewares/authMiddleware";

const phaKyRouter = Router();
const phaKyController = container.resolve(PhaKyController);

phaKyRouter.get("/dongho/:dongHoId", authenticate, phaKyController.getByDongHo.bind(phaKyController));
phaKyRouter.post("/search", authenticate, phaKyController.search.bind(phaKyController));
phaKyRouter.post("/", authenticate, phaKyController.create.bind(phaKyController));
phaKyRouter.put("/:id", authenticate, phaKyController.update.bind(phaKyController));
phaKyRouter.delete("/:id", authenticate, phaKyController.delete.bind(phaKyController));

export default phaKyRouter;
