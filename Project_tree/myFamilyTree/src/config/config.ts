import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  port: process.env.PORT,

  // Base URL for file uploads
  baseUrl: process.env.BASE_URL,

  // Frontend base URL for redirects and payment callbacks
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Database configuration
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: "utf8mb4",
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || "thong tin cua gia dinh toi nhe 21",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      "refresh token secret gia dinh toi 2024",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  // Gateway configuration
  gatewaySecret: process.env.GATEWAY_SECRET || "family-tree-gateway-2024",

  // AI Service configuration
  aiServiceUrl: process.env.AI_SERVICE_URL || "http://localhost:7000",

  // API Keys
  groqApiKey: process.env.GROQ_API_KEY || "",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  bankTransfer: {
    vnpay: {
      merchantCode: process.env.VNPAY_MERCHANT_CODE || "",
      hashSecret: process.env.VNPAY_HASH_SECRET || "",
      apiUrl: process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      queryUrl: process.env.VNPAY_QUERY_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/merchant_information',
      webhookUrl: process.env.VNPAY_WEBHOOK_URL || `${process.env.BASE_URL}/webhook/vnpay`,
      returnUrl: process.env.VNPAY_RETURN_URL || `${process.env.BASE_URL}/api-core/bank-transfer/vnpay-return`,
      ipnUrl: process.env.VNPAY_IPN_URL || `${process.env.BASE_URL}/webhook/vnpay`,
      isTestMode: process.env.VNPAY_TEST_MODE === 'true' || true,
    },
    momo: {
      partnerCode: process.env.MOMO_PARTNER_CODE || "",
      accessKey: process.env.MOMO_ACCESS_KEY || "",
      secretKey: process.env.MOMO_SECRET_KEY || "",
      momoUrl: process.env.MOMO_URL || "",
      webhookUrl: process.env.MOMO_WEBHOOK_URL || "",
      partnerName: process.env.MOMO_PARTNER_NAME || "Test",
      storeId: process.env.MOMO_STORE_ID || "MomoTestStore",
    }
  },
};