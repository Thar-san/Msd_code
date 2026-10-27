const { getUser } = require("../service/auth");

function extractToken(req) {
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  return req.cookies?.uid || null;
}

async function restrictToLoggedinUserOnly(req, res, next) {
  const token = extractToken(req);
  const isApiRequest = req.originalUrl?.startsWith("/api") || req.xhr || req.headers?.accept?.includes("application/json");

  if (!token) {
    if (isApiRequest) {
      return res.status(401).json({ error: "Authentication required" });
    }
    return res.redirect("/login");
  }

  const user = getUser(token);
  if (!user) {
    if (isApiRequest) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }
    return res.redirect("/login");
  }

  req.user = user;
  next();
}

async function checkAuth(req, res, next) {
  const token = extractToken(req);
  if (token) {
    req.user = getUser(token);
  }
  next();
}

module.exports = {
  restrictToLoggedinUserOnly,
  checkAuth,
};
