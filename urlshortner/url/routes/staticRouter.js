const express = require("express");
const { handleGetDashboard } = require("../controllers/url");

const router = express.Router();

router.get("/", async (req, res, next) => {
  if (!req.user) return res.redirect("/login");
  try {
    return await handleGetDashboard(req, res);
  } catch (error) {
    return next(error);
  }
});

router.get("/signup", (req, res) => {
  return res.render("signup");
});

router.get("/login", (req, res) => {
  return res.render("login");
});

module.exports = router;
