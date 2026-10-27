const express = require("express");
const { restrictToLoggedinUserOnly } = require("../middlewares/auth");
const {
  handleGenerateNewShortURL,
  handleBulkCreate,
  handleGetDashboard,
  handleGetAnalytics,
  handleEditURL,
  handleBulkStatus,
  handleDeleteURL,
  handleBulkDelete,
  handleReplaceURL,
  handleMultiplyAnalytics,
} = require("../controllers/url");

const router = express.Router();
const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

// RESTful & API endpoints
router.get("/", restrictToLoggedinUserOnly, asyncHandler(handleGetDashboard));
router.post("/", restrictToLoggedinUserOnly, asyncHandler(handleGenerateNewShortURL));
router.post("/bulk", restrictToLoggedinUserOnly, asyncHandler(handleBulkCreate));
router.post("/bulk-status", restrictToLoggedinUserOnly, asyncHandler(handleBulkStatus));
router.post("/bulk-delete", restrictToLoggedinUserOnly, asyncHandler(handleBulkDelete));
router.delete("/bulk", restrictToLoggedinUserOnly, asyncHandler(handleBulkDelete));

// Single URL operations
router.get("/:shortId/analytics", restrictToLoggedinUserOnly, asyncHandler(handleGetAnalytics));
router.get("/analytics/:shortId", restrictToLoggedinUserOnly, asyncHandler(handleGetAnalytics));
router.patch("/:id", restrictToLoggedinUserOnly, asyncHandler(handleEditURL));
router.put("/:id", restrictToLoggedinUserOnly, asyncHandler(handleEditURL));
router.delete("/:id", restrictToLoggedinUserOnly, asyncHandler(handleDeleteURL));

// Legacy form POST routes
router.post("/:id/edit", restrictToLoggedinUserOnly, asyncHandler(handleEditURL));
router.post("/:id/delete", restrictToLoggedinUserOnly, asyncHandler(handleDeleteURL));
router.post("/:shortId/replace", restrictToLoggedinUserOnly, asyncHandler(handleReplaceURL));
router.post("/:shortId/multiply", restrictToLoggedinUserOnly, asyncHandler(handleMultiplyAnalytics));

module.exports = router;
