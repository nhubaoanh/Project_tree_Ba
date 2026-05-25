import { Router, Request, Response } from "express";
import { container } from "tsyringe";
import BankTransferController from "../controllers/BankTransferController";
import { authenticate, checkDongHoAccess, adminOnly } from "../middlewares/authMiddleware";

const router = Router();
const bankTransferController = container.resolve<BankTransferController>(BankTransferController);

router.post("/momo", async (req: Request, res: Response) => { await bankTransferController.handleMomoWebhook(req, res); });
router.post("/vnpay", async (req: Request, res: Response) => { await bankTransferController.handleVnpayWebhook(req, res); });
router.get("/vnpay-return", async (req: Request, res: Response) => { await bankTransferController.handleVnpayReturn(req, res); });
router.post("/verify-payment", authenticate, async (req: Request, res: Response) => { await bankTransferController.verifyPayment(req, res); });
router.post("/verify-vnpay-return", async (req: Request, res: Response) => { await bankTransferController.verifyVnpayReturn(req, res); });
router.get("/bank-transactions/:dongHoId", authenticate, checkDongHoAccess, async (req: Request, res: Response) => { await bankTransferController.getBankTransactionsByDongHo(req, res); });
router.get("/bank-transactions/user/:nguoiDungId", authenticate, async (req: Request, res: Response) => { await bankTransferController.getBankTransactionsByUser(req, res); });
router.get("/bank-transactions/detail/:id", authenticate, async (req: Request, res: Response) => { await bankTransferController.getBankTransactionById(req, res); });
router.get("/bank-transactions/pending", authenticate, checkDongHoAccess, async (req: Request, res: Response) => { await bankTransferController.getPendingTransactions(req, res); });
router.get("/bank-transactions/search", authenticate, async (req: Request, res: Response) => { await bankTransferController.searchBankTransactions(req, res); });
router.post("/bank-transactions/verify", authenticate, adminOnly, async (req: Request, res: Response) => { await bankTransferController.verifyTransaction(req, res); });
router.post("/bank-transactions/manual", authenticate, adminOnly, async (req: Request, res: Response) => { await bankTransferController.createManualTransaction(req, res); });
router.post("/initiate-fund-closure", authenticate, checkDongHoAccess, async (req: Request, res: Response) => { await bankTransferController.initiateFundClosure(req, res); });

export default router;
