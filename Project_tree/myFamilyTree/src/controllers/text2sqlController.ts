/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                         TEXT-TO-SQL CONTROLLER                                ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  Controller xử lý API endpoints cho Text-to-SQL                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { Request, Response } from "express";
import { Text2SQLService } from "../services/text2sqlService";

let text2sqlService: Text2SQLService | null = null;

const getService = () => {
  if (!text2sqlService) {
    text2sqlService = new Text2SQLService();
  }
  return text2sqlService;
};

/**
 * POST /api-core/text2sql/query
 * Body: { question: string, dongHoId: string }
 */
export const queryText2SQL = async (req: Request, res: Response) => {
  try {
    const { question, dongHoId } = req.body;

    // Validation
    if (!question || typeof question !== "string") {
      return res.status(400).json({
        success: false,
        message: "Câu hỏi không hợp lệ",
        error_code: "INVALID_QUESTION",
      });
    }

    if (!dongHoId || typeof dongHoId !== "string") {
      return res.status(400).json({
        success: false,
        message: "dongHoId không hợp lệ",
        error_code: "INVALID_DONGHO_ID",
      });
    }

    // Xử lý câu hỏi
    console.log(`📥 Received question: "${question}" for dongHoId: ${dongHoId}`);
    const result = await getService().processQuestion(question, dongHoId);

    return res.status(200).json({
      success: true,
      message: "Truy vấn thành công",
      data: result,
    });
  } catch (error: any) {
    console.error("❌ Error in queryText2SQL:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi xử lý câu hỏi",
      error_code: "TEXT2SQL_ERROR",
    });
  }
};

/**
 * GET /api-core/text2sql/examples
 * Lấy danh sách câu hỏi mẫu
 */
export const getExamples = async (req: Request, res: Response) => {
  try {
    const examples = getService().getExamples();

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách câu hỏi mẫu thành công",
      data: {
        total: examples.length,
        examples: examples.map((ex) => ex.question),
        fullExamples: examples,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in getExamples:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi lấy danh sách câu hỏi mẫu",
      error_code: "GET_EXAMPLES_ERROR",
    });
  }
};

/**
 * POST /api-core/text2sql/reload-examples
 * Reload examples từ file dataset
 */
export const reloadExamples = async (req: Request, res: Response) => {
  try {
    getService().reloadExamples();

    return res.status(200).json({
      success: true,
      message: "Reload examples thành công",
      data: {
        total: getService().getExamples().length,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in reloadExamples:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi reload examples",
      error_code: "RELOAD_EXAMPLES_ERROR",
    });
  }
};

/**
 * GET /api-core/text2sql/health
 * Health check cho Text2SQL service
 */
export const healthCheck = async (req: Request, res: Response) => {
  try {
    const hasApiKey = !!process.env.GROQ_API_KEY;
    const examplesCount = getService().getExamples().length;

    return res.status(200).json({
      success: true,
      message: "Text2SQL service is running",
      data: {
        status: "healthy",
        geminiApiKey: hasApiKey ? "configured" : "missing",
        examplesLoaded: examplesCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Text2SQL service is unhealthy",
      error: error.message,
    });
  }
};
