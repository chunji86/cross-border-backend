const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key";

// ✅ 인증 미들웨어
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "인증 토큰이 없습니다." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ error: "사용자를 찾을 수 없습니다." });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "유효하지 않은 토큰입니다." });
  }
};

// ✅ 역할 기반 권한 미들웨어
const authorize = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({ error: "권한이 없습니다." });
    }
    next();
  };
};

// ✅ 역할별 전용 미들웨어
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "관리자 권한이 필요합니다." });
  next();
};

const authorizeVendor = (req, res, next) => {
  if (req.user.role !== "vendor") return res.status(403).json({ error: "공급사 전용 기능입니다." });
  next();
};

const authorizeInfluencer = (req, res, next) => {
  if (req.user.role !== "influencer" && req.user.role !== "pro") {
    return res.status(403).json({ error: "인플루언서 전용 기능입니다." });
  }
  next();
};

module.exports = {
  authenticate,
  authorize,
  authorizeAdmin,
  authorizeVendor,
  authorizeInfluencer,
};
