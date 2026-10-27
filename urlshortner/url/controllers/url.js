const mongoose = require("mongoose");
const shortid = require("shortid");
const URLModel = require("../models/url");
const URLOperationAudit = require("../models/urlOperationAudit");

const MAX_BULK_URLS = 50;
const MAX_SELECTED_URLS = 100;
const MAX_PAGE_SIZE = 50;

function isJsonRequest(req) {
  return (
    req.originalUrl?.startsWith("/api") ||
    req.xhr ||
    req.headers?.accept?.includes("application/json") ||
    req.headers["content-type"]?.includes("application/json")
  );
}

function redirectWithMessage(res, key, message) {
  return res.redirect(`/?${key}=${encodeURIComponent(message)}`);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isValidHttpUrl(value) {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const parsed = new globalThis.URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function parseExpiry(value) {
  if (value === undefined || value === "" || value === null) return { valid: true, value: null };
  if (typeof value !== "string") return { valid: false };
  const dateStr = value.includes("T") ? value.split("T")[0] : value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return { valid: false };
  const date = new Date(`${dateStr}T23:59:59.999Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateStr) return { valid: false };
  return { valid: true, value: date };
}

function parseNonNegativeNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const str = String(value);
  if (!/^\d+$/.test(str)) return null;
  const parsed = Number(str);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function parseObjectIds(value) {
  const values = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  if (!values.length || values.length > MAX_SELECTED_URLS || values.some((id) => !mongoose.isValidObjectId(id))) {
    return [];
  }
  return [...new Set(values)];
}

function isAdmin(req) {
  const configuredAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(configuredAdmin && req.user?.email?.toLowerCase() === configuredAdmin);
}

function ownsShortId(req, shortId) {
  return { shortId, createdBy: req.user._id };
}

async function handleGenerateNewShortURL(req, res) {
  const isJson = isJsonRequest(req);
  const { url, title, expiresAt, customAlias } = req.body;
  const expiry = parseExpiry(expiresAt);

  if (!isValidHttpUrl(url) || !expiry.valid) {
    if (isJson) return res.status(400).json({ error: "Enter a valid http(s) URL and valid expiry date." });
    return redirectWithMessage(res, "error", "Enter a valid http(s) URL and expiry date.");
  }

  let finalShortId = "";
  if (customAlias && typeof customAlias === "string" && customAlias.trim()) {
    const alias = customAlias.trim();
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(alias)) {
      if (isJson) return res.status(400).json({ error: "Custom alias must be 3-30 letters, numbers, hyphens, or underscores." });
      return redirectWithMessage(res, "error", "Custom alias must be 3-30 alphanumeric characters.");
    }
    const existing = await URLModel.findOne({ shortId: alias });
    if (existing) {
      if (isJson) return res.status(409).json({ error: "This custom alias is already in use. Please choose another." });
      return redirectWithMessage(res, "error", "Custom alias is already taken.");
    }
    finalShortId = alias;
  } else {
    finalShortId = shortid();
  }

  const record = new URLModel({
    shortId: finalShortId,
    redirectURL: url,
    title: typeof title === "string" ? title.trim().slice(0, 120) : "",
    expiresAt: expiry.value,
    visitHistory: [],
    createdBy: req.user._id,
  });
  await record.save();

  if (isJson) {
    return res.status(201).json({
      success: true,
      message: "Short URL created successfully",
      url: record,
    });
  }

  return res.redirect(`/?created=${encodeURIComponent(record.shortId)}`);
}

async function handleBulkCreate(req, res) {
  const isJson = isJsonRequest(req);
  let lines = [];

  if (Array.isArray(req.body.urls)) {
    lines = req.body.urls.map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        return item.title ? `${item.title} | ${item.url}` : item.url;
      }
      return "";
    }).filter(Boolean);
  } else if (typeof req.body.urls === "string") {
    lines = req.body.urls.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  }

  if (!lines.length || lines.length > MAX_BULK_URLS) {
    const msg = `Enter between 1 and ${MAX_BULK_URLS} URLs.`;
    if (isJson) return res.status(400).json({ error: msg });
    return redirectWithMessage(res, "error", msg);
  }

  const records = [];
  for (let index = 0; index < lines.length; index += 1) {
    const separator = lines[index].indexOf("|");
    const title = separator >= 0 ? lines[index].slice(0, separator).trim() : "";
    const destination = separator >= 0 ? lines[index].slice(separator + 1).trim() : lines[index];
    if (!isValidHttpUrl(destination) || title.length > 120) {
      const msg = `Line ${index + 1} must contain a valid http(s) URL and an optional title of at most 120 characters.`;
      if (isJson) return res.status(400).json({ error: msg });
      return redirectWithMessage(res, "error", msg);
    }
    records.push({
      shortId: shortid(),
      redirectURL: destination,
      title,
      visitHistory: [],
      createdBy: req.user._id,
    });
  }

  const createdRecords = await URLModel.insertMany(records, { ordered: true });
  if (isJson) {
    return res.status(201).json({
      success: true,
      message: `${createdRecords.length} links created successfully.`,
      count: createdRecords.length,
      urls: createdRecords,
    });
  }
  return redirectWithMessage(res, "created", `${records.length} links created.`);
}

function buildListFilters(req) {
  const filters = [{ createdBy: req.user._id }];
  const query = req.query || {};
  const search = typeof query.q === "string" ? query.q.trim().slice(0, 80) : "";
  const statuses = new Set(["active", "archived", "expired"]);
  const status = statuses.has(query.status) ? query.status : "";

  if (search) {
    const expression = new RegExp(escapeRegex(search), "i");
    filters.push({
      $or: [
        { title: { $regex: expression } },
        { shortId: { $regex: expression } },
        { redirectURL: { $regex: expression } },
      ],
    });
  }

  if (status === "archived") filters.push({ status: "archived" });
  if (status === "active") {
    filters.push({ status: "active" });
    filters.push({ $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] });
  }
  if (status === "expired") filters.push({ expiresAt: { $lte: new Date() }, status: { $ne: "archived" } });

  const clicksAbove = parseNonNegativeNumber(query.clicksAbove);
  const clicksAtLeast = parseNonNegativeNumber(query.clicksMin);
  const clicksBelow = parseNonNegativeNumber(query.clicksBelow);
  const clicksAtMost = parseNonNegativeNumber(query.clicksMax);
  const clickFilters = {};
  if (clicksAbove !== null) clickFilters.$gt = clicksAbove;
  if (clicksAtLeast !== null) clickFilters.$gte = clicksAtLeast;
  if (clicksBelow !== null) clickFilters.$lt = clicksBelow;
  if (clicksAtMost !== null) clickFilters.$lte = clicksAtMost;
  if (Object.keys(clickFilters).length) {
    filters.push({ clickCount: clickFilters });
  }

  if (typeof query.createdAfter === "string" && /^\d{4}-\d{2}-\d{2}$/.test(query.createdAfter)) {
    filters.push({ createdAt: { $gte: new Date(`${query.createdAfter}T00:00:00.000Z`) } });
  }
  if (typeof query.expiresBefore === "string" && /^\d{4}-\d{2}-\d{2}$/.test(query.expiresBefore)) {
    filters.push({
      expiresAt: {
        $ne: null,
        $lte: new Date(`${query.expiresBefore}T23:59:59.999Z`),
      },
    });
  }

  return filters.length === 1 ? filters[0] : { $and: filters };
}

function validateListFilters(query) {
  if (query.q !== undefined && (typeof query.q !== "string" || query.q.length > 80)) {
    return "Search text must be 80 characters or fewer.";
  }
  if (query.status !== undefined && query.status !== "" && !["active", "archived", "expired"].includes(query.status)) {
    return "Choose a valid link status.";
  }
  if (query.sort !== undefined && !["createdAt", "clickCount", "title", "expiresAt"].includes(query.sort)) {
    return "Choose a valid sort field.";
  }
  if (query.order !== undefined && !["asc", "desc"].includes(query.order)) {
    return "Choose ascending or descending sort order.";
  }
  if (query.pageSize !== undefined && !["10", "20", "50"].includes(query.pageSize)) {
    return "Choose a page size of 10, 20, or 50.";
  }
  for (const key of ["clicksAbove", "clicksMin", "clicksBelow", "clicksMax"]) {
    if (query[key] !== undefined && query[key] !== "" && parseNonNegativeNumber(query[key]) === null) {
      return "Click filters must be whole numbers greater than or equal to zero.";
    }
  }
  return "";
}

async function handleGetDashboard(req, res) {
  const isJson = isJsonRequest(req);
  const filter = buildListFilters(req);
  const allowedSorts = new Set(["createdAt", "clickCount", "title", "expiresAt"]);
  const sortBy = allowedSorts.has(req.query.sort) ? req.query.sort : "createdAt";
  const sortOrder = req.query.order === "asc" ? 1 : -1;
  const requestedPageSize = parseNonNegativeNumber(req.query.pageSize);
  const pageSize = [10, 20, MAX_PAGE_SIZE].includes(requestedPageSize) ? requestedPageSize : 10;
  const requestedPage = parseNonNegativeNumber(req.query.page);
  const page = Math.max(1, requestedPage || 1);
  const totalResults = await URLModel.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const currentPage = Math.min(page, totalPages);
  const now = new Date();

  const [urls, totalCount, activeCount, expiredCount, archivedCount, auditEntries] = await Promise.all([
    URLModel.find(filter)
      .select({
        shortId: 1,
        redirectURL: 1,
        title: 1,
        status: 1,
        expiresAt: 1,
        clickCount: 1,
        analyticsMultiplier: 1,
        createdAt: 1,
        _id: 1,
      })
      .sort({ [sortBy]: sortOrder, _id: 1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    URLModel.countDocuments({ createdBy: req.user._id }),
    URLModel.countDocuments({
      createdBy: req.user._id,
      status: { $ne: "archived" },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }),
    URLModel.countDocuments({
      createdBy: req.user._id,
      status: { $ne: "archived" },
      expiresAt: { $lte: now },
    }),
    URLModel.countDocuments({ createdBy: req.user._id, status: "archived" }),
    isAdmin(req)
      ? URLOperationAudit.find({ adminEmail: req.user.email }).sort({ createdAt: -1 }).limit(10).lean()
      : Promise.resolve([]),
  ]);

  const baseUrl = (process.env.BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/+$/, "");

  if (isJson) {
    return res.json({
      success: true,
      urls,
      stats: { total: totalCount, active: activeCount, expired: expiredCount, archived: archivedCount },
      pagination: {
        page: currentPage,
        pageSize,
        totalPages,
        totalResults,
      },
      filters: req.query,
      admin: isAdmin(req),
      auditEntries,
      baseUrl,
    });
  }

  const pageParams = new URLSearchParams();
  for (const key of [
    "q", "status", "sort", "order", "pageSize", "clicksAbove", "clicksMin",
    "clicksBelow", "clicksMax", "createdAfter", "expiresBefore",
  ]) {
    if (typeof req.query[key] === "string" && req.query[key]) pageParams.set(key, req.query[key]);
  }
  const pageUrl = (targetPage) => {
    pageParams.set("page", String(targetPage));
    return `/?${pageParams.toString()}`;
  };

  return res.render("home", {
    urls,
    created: req.query.created,
    error: req.query.error || validateListFilters(req.query),
    baseUrl,
    stats: { total: totalCount, active: activeCount, expired: expiredCount, archived: archivedCount },
    filters: req.query,
    pagination: {
      page: currentPage,
      pageSize,
      totalPages,
      totalResults,
      previousUrl: currentPage > 1 ? pageUrl(currentPage - 1) : "",
      nextUrl: currentPage < totalPages ? pageUrl(currentPage + 1) : "",
    },
    admin: isAdmin(req),
    auditEntries,
  });
}

async function handleGetAnalytics(req, res) {
  const result = await URLModel.findOne(ownsShortId(req, req.params.shortId))
    .select({ _id: 1, shortId: 1, redirectURL: 1, title: 1, status: 1, clickCount: 1, analyticsMultiplier: 1, visitHistory: 1, createdAt: 1, expiresAt: 1 })
    .lean();
  if (!result) return res.status(404).json({ error: "URL not found" });

  const rawClicks = result.clickCount ?? result.visitHistory.length;
  const multiplier = result.analyticsMultiplier ?? 1;

  return res.json({
    success: true,
    url: {
      _id: result._id,
      shortId: result.shortId,
      redirectURL: result.redirectURL,
      title: result.title,
      status: result.status,
      createdAt: result.createdAt,
      expiresAt: result.expiresAt,
    },
    totalClicks: rawClicks,
    weightedClicks: rawClicks * multiplier,
    analyticsMultiplier: multiplier,
    analytics: result.visitHistory || [],
  });
}

async function handleShortRedirect(req, res) {
  const entry = await URLModel.findOne({ shortId: req.params.shortId })
    .select("_id redirectURL status expiresAt")
    .lean();
  if (!entry) return res.status(404).send("Short link not found.");
  if (entry.status === "archived" || (entry.expiresAt && entry.expiresAt <= new Date())) {
    return res.status(410).send("This short link is no longer active.");
  }
  if (!isValidHttpUrl(entry.redirectURL)) {
    return res.status(410).send("This short link has an invalid destination.");
  }

  const result = await URLModel.updateOne(
    {
      _id: entry._id,
      status: { $ne: "archived" },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    },
    {
      $inc: { clickCount: 1 },
      $push: { visitHistory: { timestamp: Date.now() } },
    }
  );
  if (!result.matchedCount) return res.status(410).send("This short link is no longer active.");
  return res.redirect(302, entry.redirectURL);
}

async function handleEditURL(req, res) {
  const isJson = isJsonRequest(req);
  if (!mongoose.isValidObjectId(req.params.id)) {
    if (isJson) return res.status(400).json({ error: "Invalid link identifier." });
    return redirectWithMessage(res, "error", "Invalid link identifier.");
  }
  const { title, url, status, expiresAt } = req.body;
  const expiry = parseExpiry(expiresAt);
  if (
    typeof title !== "string" ||
    title.trim().length > 120 ||
    !isValidHttpUrl(url) ||
    !["active", "archived"].includes(status) ||
    !expiry.valid
  ) {
    const msg = "Check the title, destination URL, status, and expiry date.";
    if (isJson) return res.status(400).json({ error: msg });
    return redirectWithMessage(res, "error", msg);
  }

  const result = await URLModel.updateOne(
    { _id: req.params.id, createdBy: req.user._id },
    { $set: { title: title.trim(), redirectURL: url, status, expiresAt: expiry.value } },
    { runValidators: true }
  );

  if (isJson) {
    if (!result.matchedCount) return res.status(404).json({ error: "Link not found or not owned by you." });
    return res.json({ success: true, message: "Link updated successfully." });
  }

  return redirectWithMessage(res, result.matchedCount ? "created" : "error", result.matchedCount ? "Link updated." : "Link not found.");
}

async function handleBulkStatus(req, res) {
  const isJson = isJsonRequest(req);
  const ids = parseObjectIds(req.body.ids);
  if (!ids.length || !["active", "archived"].includes(req.body.status)) {
    const msg = "Select links and a valid status.";
    if (isJson) return res.status(400).json({ error: msg });
    return redirectWithMessage(res, "error", msg);
  }
  const result = await URLModel.updateMany(
    { _id: { $in: ids }, createdBy: req.user._id },
    { $set: { status: req.body.status } },
    { runValidators: true }
  );
  if (isJson) {
    return res.json({
      success: true,
      message: `${result.modifiedCount} link(s) updated.`,
      modifiedCount: result.modifiedCount,
    });
  }
  return redirectWithMessage(res, "created", `${result.modifiedCount} link(s) updated.`);
}

async function handleDeleteURL(req, res) {
  const isJson = isJsonRequest(req);
  if (!mongoose.isValidObjectId(req.params.id)) {
    if (isJson) return res.status(400).json({ error: "Invalid link identifier." });
    return redirectWithMessage(res, "error", "Invalid link identifier.");
  }
  if (!isJson && req.body.confirm !== "delete") {
    return redirectWithMessage(res, "error", "Confirm deletion of a valid link.");
  }
  const result = await URLModel.deleteOne({ _id: req.params.id, createdBy: req.user._id });
  if (isJson) {
    if (!result.deletedCount) return res.status(404).json({ error: "Link not found." });
    return res.json({ success: true, message: "Link deleted successfully." });
  }
  return redirectWithMessage(res, result.deletedCount ? "created" : "error", result.deletedCount ? "Link deleted." : "Link not found.");
}

async function handleBulkDelete(req, res) {
  const isJson = isJsonRequest(req);
  const ids = parseObjectIds(req.body.ids);
  if (!ids.length || (!isJson && req.body.confirm !== "delete")) {
    const msg = "Select links and confirm bulk deletion.";
    if (isJson) return res.status(400).json({ error: msg });
    return redirectWithMessage(res, "error", msg);
  }
  const result = await URLModel.deleteMany({ _id: { $in: ids }, createdBy: req.user._id });
  if (isJson) {
    return res.json({
      success: true,
      message: `${result.deletedCount} link(s) deleted.`,
      deletedCount: result.deletedCount,
    });
  }
  return redirectWithMessage(res, "created", `${result.deletedCount} link(s) deleted.`);
}

async function handleReplaceURL(req, res) {
  const isJson = isJsonRequest(req);
  if (!isAdmin(req)) {
    if (isJson) return res.status(403).json({ error: "Admin access required." });
    return res.sendStatus(403);
  }
  const existing = await URLModel.findOne(ownsShortId(req, req.params.shortId)).lean();
  if (!existing) {
    if (isJson) return res.status(404).json({ error: "Link not found in your account." });
    return redirectWithMessage(res, "error", "Link not found in your account.");
  }

  const { title, url, status, expiresAt } = req.body;
  const expiry = parseExpiry(expiresAt);
  if (
    (!isJson && req.body.confirm !== "replace") ||
    typeof title !== "string" ||
    title.trim().length > 120 ||
    !isValidHttpUrl(url) ||
    !["active", "archived"].includes(status) ||
    !expiry.valid
  ) {
    const msg = "Confirm the replacement and enter valid link details.";
    if (isJson) return res.status(400).json({ error: msg });
    return redirectWithMessage(res, "error", msg);
  }

  const replacement = {
    _id: existing._id,
    shortId: existing.shortId,
    createdBy: existing.createdBy,
    redirectURL: url,
    title: title.trim(),
    status,
    expiresAt: expiry.value,
    clickCount: existing.clickCount ?? existing.visitHistory.length,
    analyticsMultiplier: existing.analyticsMultiplier ?? 1,
    visitHistory: existing.visitHistory || [],
    createdAt: existing.createdAt,
    updatedAt: new Date(),
  };
  const audit = await URLOperationAudit.create({
    adminEmail: req.user.email,
    action: "replace_url",
    shortId: existing.shortId,
  });
  try {
    const result = await URLModel.replaceOne(
      ownsShortId(req, req.params.shortId),
      replacement,
      { runValidators: true }
    );
    if (!result.matchedCount) {
      await URLOperationAudit.updateOne({ _id: audit._id }, { $set: { outcome: "failed" } });
      const msg = "The link was removed before it could be replaced.";
      if (isJson) return res.status(404).json({ error: msg });
      return redirectWithMessage(res, "error", msg);
    }
    await URLOperationAudit.updateOne({ _id: audit._id }, { $set: { outcome: "succeeded" } });
  } catch (error) {
    await URLOperationAudit.updateOne({ _id: audit._id }, { $set: { outcome: "failed" } });
    throw error;
  }
  if (isJson) return res.json({ success: true, message: "URL record replaced successfully." });
  return redirectWithMessage(res, "created", "URL record replaced; its identifier and analytics history were preserved.");
}

async function handleMultiplyAnalytics(req, res) {
  const isJson = isJsonRequest(req);
  if (!isAdmin(req)) {
    if (isJson) return res.status(403).json({ error: "Admin access required." });
    return res.sendStatus(403);
  }
  const factor = Number(req.body.factor);
  if (
    (!isJson && req.body.confirm !== "multiply") ||
    !Number.isFinite(factor) ||
    factor < 0.1 ||
    factor > 10 ||
    typeof req.params.shortId !== "string"
  ) {
    const msg = "Confirm the action and enter a multiplier from 0.1 to 10.";
    if (isJson) return res.status(400).json({ error: msg });
    return redirectWithMessage(res, "error", msg);
  }

  const existing = await URLModel.findOne(ownsShortId(req, req.params.shortId))
    .select("analyticsMultiplier")
    .lean();
  if (!existing) {
    if (isJson) return res.status(404).json({ error: "Link not found in your account." });
    return redirectWithMessage(res, "error", "Link not found in your account.");
  }
  const currentMultiplier = existing.analyticsMultiplier ?? 1;
  const nextMultiplier = currentMultiplier * factor;
  if (nextMultiplier < 0.1 || nextMultiplier > 10) {
    const msg = "The resulting analytics multiplier must remain between 0.1 and 10.";
    if (isJson) return res.status(400).json({ error: msg });
    return redirectWithMessage(res, "error", msg);
  }

  const audit = await URLOperationAudit.create({
    adminEmail: req.user.email,
    action: "multiply_analytics",
    shortId: req.params.shortId,
    factor,
  });
  try {
    const result = await URLModel.updateOne(
      {
        ...ownsShortId(req, req.params.shortId),
        analyticsMultiplier: { $gte: 0.1 / factor, $lte: 10 / factor },
      },
      { $mul: { analyticsMultiplier: factor } },
      { runValidators: true }
    );
    if (!result.matchedCount) {
      await URLOperationAudit.updateOne({ _id: audit._id }, { $set: { outcome: "failed" } });
      const msg = "Link was not updated; it may have been removed or its multiplier changed.";
      if (isJson) return res.status(404).json({ error: msg });
      return redirectWithMessage(res, "error", msg);
    }
    await URLOperationAudit.updateOne({ _id: audit._id }, { $set: { outcome: "succeeded" } });
    if (isJson) return res.json({ success: true, message: "Analytics multiplier updated.", multiplier: nextMultiplier });
    return redirectWithMessage(res, "created", "Analytics multiplier updated. Raw clicks and click history are unchanged.");
  } catch (error) {
    await URLOperationAudit.updateOne({ _id: audit._id }, { $set: { outcome: "failed" } });
    throw error;
  }
}

module.exports = {
  handleGenerateNewShortURL,
  handleBulkCreate,
  handleGetDashboard,
  handleGetAnalytics,
  handleShortRedirect,
  handleEditURL,
  handleBulkStatus,
  handleDeleteURL,
  handleBulkDelete,
  handleReplaceURL,
  handleMultiplyAnalytics,
};
