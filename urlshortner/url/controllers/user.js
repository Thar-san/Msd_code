const { v4: uuidv4 } = require("uuid");
const User = require("../models/user");
const { setUser } = require("../service/auth");

function isJsonRequest(req) {
  return (
    req.originalUrl?.startsWith("/api") ||
    req.xhr ||
    req.headers?.accept?.includes("application/json") ||
    req.headers["content-type"]?.includes("application/json")
  );
}

async function handleUserSignup(req, res) {
  const { name, email, password } = req.body;
  const isJson = isJsonRequest(req);

  if (!name || !email || !password) {
    if (isJson) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }
    return res.status(400).render("signup", {
      error: "All fields are required.",
      name,
      email,
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    if (isJson) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    return res.status(409).render("signup", {
      error: "An account with this email already exists. Sign in or use a different email.",
      name,
      email,
    });
  }

  try {
    const newUser = await User.create({ name: name.trim(), email: normalizedEmail, password });
    const sessionId = uuidv4();
    const token = setUser(sessionId, newUser);
    res.cookie("uid", token || sessionId, {
      httpOnly: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    if (isJson) {
      return res.status(201).json({
        success: true,
        message: "Account created successfully.",
        token: token || sessionId,
        user: { _id: newUser._id, name: newUser.name, email: newUser.email },
      });
    }

    return res.redirect("/");
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      if (isJson) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }
      return res.status(409).render("signup", {
        error: "An account with this email already exists. Sign in or use a different email.",
        name,
        email,
      });
    }
    throw error;
  }
}

async function handleUserLogin(req, res) {
  const { email, password } = req.body;
  const isJson = isJsonRequest(req);

  if (!email || !password) {
    if (isJson) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    return res.status(400).render("login", {
      error: "Email and password are required.",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail, password });

  if (!user) {
    if (isJson) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    return res.status(401).render("login", {
      error: "Invalid Username or Password",
    });
  }

  const sessionId = uuidv4();
  const token = setUser(sessionId, user);
  res.cookie("uid", token || sessionId, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  if (isJson) {
    return res.json({
      success: true,
      message: "Logged in successfully.",
      token: token || sessionId,
      user: { _id: user._id, name: user.name, email: user.email },
    });
  }

  return res.redirect("/");
}

async function handleUserLogout(req, res) {
  res.clearCookie("uid");
  if (isJsonRequest(req)) {
    return res.json({ success: true, message: "Logged out successfully" });
  }
  return res.redirect("/login");
}

async function handleGetMe(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.json({
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    },
  });
}

module.exports = {
  handleUserSignup,
  handleUserLogin,
  handleUserLogout,
  handleGetMe,
};
