const express = require("express");
const {
  handleUserSignup,
  handleUserLogin,
  handleUserLogout,
  handleGetMe,
} = require("../controllers/user");
const { checkAuth, restrictToLoggedinUserOnly } = require("../middlewares/auth");

const router = express.Router();

router.post("/", handleUserSignup);
router.post("/signup", handleUserSignup);
router.post("/login", handleUserLogin);
router.post("/logout", handleUserLogout);
router.get("/me", checkAuth, handleGetMe);

module.exports = router;
