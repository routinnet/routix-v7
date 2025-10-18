// Security Configuration for Routix
export const securityConfig = {
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
    maxThumbnailGen: 10,
  },
  cors: {
    origin: ["https://routix.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
  headers: {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Strict-Transport-Security": "max-age=31536000",
  },
  validation: {
    maxPromptLength: 2000,
    maxFileSize: 10 * 1024 * 1024,
    allowedImageFormats: ["jpg", "jpeg", "png", "webp"],
  },
};
export default securityConfig;
