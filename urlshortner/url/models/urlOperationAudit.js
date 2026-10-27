const mongoose = require("mongoose");

const urlOperationAuditSchema = new mongoose.Schema(
  {
    adminEmail: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: ["replace_url", "multiply_analytics"],
      required: true,
    },
    shortId: {
      type: String,
      required: true,
    },
    factor: {
      type: Number,
      min: 0.1,
      max: 10,
    },
    outcome: {
      type: String,
      enum: ["requested", "succeeded", "failed"],
      default: "requested",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("urlOperationAudit", urlOperationAuditSchema, "urlOperationAudits");
