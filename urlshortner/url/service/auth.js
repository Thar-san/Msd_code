const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "linklet-super-secret-key-2026-mern";
const sessionIdToUserMap = new Map();

function setUser(idOrUser, user) {
  if (user) {
    sessionIdToUserMap.set(idOrUser, user);
    try {
      return jwt.sign(
        { _id: user._id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
    } catch {
      return idOrUser;
    }
  }
  return jwt.sign(
    { _id: idOrUser._id, email: idOrUser.email, name: idOrUser.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function getUser(tokenOrId) {
  if (!tokenOrId) return null;
  if (sessionIdToUserMap.has(tokenOrId)) {
    return sessionIdToUserMap.get(tokenOrId);
  }
  try {
    return jwt.verify(tokenOrId, JWT_SECRET);
  } catch {
    return null;
  }
}

module.exports = {
  setUser,
  getUser,
};
