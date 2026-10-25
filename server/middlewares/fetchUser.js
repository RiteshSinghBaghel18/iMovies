const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "imovies_super_secret_jwt_key_2026_secured";

const fetchUser = (req, res, next) => {
  // Get token from Authorization header or custom header
  let token = req.header("Authorization") || req.header("auth-token") || req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access Denied: No authentication token provided.",
    });
  }

  // Handle 'Bearer <token>' format
  if (token.startsWith("Bearer ")) {
    token = token.slice(7).trim();
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
      error: err.message,
    });
  }
};

const fetchAdmin = (req, res, next) => {
  fetchUser(req, res, () => {
    if (req.user && req.user.role === "admin") {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Administrative access required.",
      });
    }
  });
};

module.exports = { fetchUser, fetchAdmin };
