const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const {
  Attendance,
  validateCreateAttendance,
  validateUpdateAttendance,
} = require("../models/Attendance");
const { verifyToken, verifyTokenAndAdmin } = require("../middleewares/verifyToken");


// ─── Helper: normalise a date to midnight UTC ─────────────────────────────────
const toMidnight = (d) => {
  const date = new Date(d);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};


/*
 * @desc  Create a new attendance record  (called when user taps "حفظ السجل")
 * @route POST /api/attendance
 * @method POST
 * @access Private (logged-in khadem or admin)
 *
 * Body:
 *  {
 *    "khadem":           "<ObjectId>",
 *    "date":             "2026-04-18",
 *    "attendedMass":     true,
 *    "attendedService":  false,
 *    "attendedOpening":  false,
 *    "preparedKashkol":  true,
 *    "notes":            "ملاحظة اليوم"
 *  }
 */
router.post(
  "/",
  verifyToken,
  asyncHandler(async (req, res) => {
    const { error } = validateCreateAttendance(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Normalise date so the unique index works regardless of time component
    const date = toMidnight(req.body.date);

    // Guard: one record per khadem per day
    const existing = await Attendance.findOne({ khadem: req.body.khadem, date });
    if (existing) {
      return res
        .status(409)
        .json({ message: "Attendance already recorded for this khadem on this date." });
    }

    const attendance = new Attendance({
      khadem:          req.body.khadem,
      date,
      attendedMass:    req.body.attendedMass    ?? false,
      attendedService: req.body.attendedService ?? false,
      attendedOpening: req.body.attendedOpening ?? false,
      preparedKashkol: req.body.preparedKashkol ?? false,
      notes:           req.body.notes           ?? "",
    });

    const saved = await attendance.save();
    res.status(201).json({ message: "Attendance saved successfully.", attendance: saved });
  })
);


/*
 * @desc  Get all attendance records  (optionally filtered)
 * @route GET /api/attendance
 * @method GET
 * @access Private (admin)
 *
 * Query params (all optional):
 *   khadem  – filter by khadem ObjectId
 *   date    – exact date  e.g. 2026-04-18
 *   from    – range start e.g. 2026-04-01
 *   to      – range end   e.g. 2026-04-30
 *   page    – page number (default 1)
 *   limit   – records per page (default 20)
 */
router.get(
  "/",
  verifyTokenAndAdmin,
  asyncHandler(async (req, res) => {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filter = {};

    if (req.query.khadem) filter.khadem = req.query.khadem;

    if (req.query.date) {
      filter.date = toMidnight(req.query.date);
    } else if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = toMidnight(req.query.from);
      if (req.query.to)   filter.date.$lte = toMidnight(req.query.to);
    }

    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .populate("khadem", "name imageUrl")   // embed khadem name + avatar
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Attendance.countDocuments(filter),
    ]);

    res.status(200).json({
      total,
      page,
      pages: Math.ceil(total / limit),
      records,
    });
  })
);


/*
 * @desc  Get all attendance records for ONE khadem
 * @route GET /api/attendance/khadem/:khademId
 * @method GET
 * @access Private (admin or the khadem themselves)
 *
 * Query params: from, to, page, limit  (same as above)
 */
router.get(
  "/khadem/:khademId",
  verifyToken,
  asyncHandler(async (req, res) => {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;

    const filter = { khadem: req.params.khademId };
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = toMidnight(req.query.from);
      if (req.query.to)   filter.date.$lte = toMidnight(req.query.to);
    }

    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Attendance.countDocuments(filter),
    ]);

    res.status(200).json({ total, page, pages: Math.ceil(total / limit), records });
  })
);


/*
 * @desc  Get a single attendance record by its ID
 * @route GET /api/attendance/:id
 * @method GET
 * @access Private
 */
router.get(
  "/:id",
  verifyToken,
  asyncHandler(async (req, res) => {
    const record = await Attendance.findById(req.params.id).populate("khadem", "name");
    if (!record) {
      return res.status(404).json({ message: "Attendance record not found." });
    }
    res.status(200).json(record);
  })
);


/*
 * @desc  Update an attendance record  (e.g. correct a mistake)
 * @route PUT /api/attendance/:id.    (id is the id of the attendance record)
 * @method PUT
 * @access Private (admin)
 *
 * Body: any subset of { attendedMass, attendedService, attendedOpening, preparedKashkol, notes }
 */
router.put(
  "/:id",
  verifyTokenAndAdmin,
  asyncHandler(async (req, res) => {
    const { error } = validateUpdateAttendance(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const record = await Attendance.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ message: "Attendance record not found." });
    }

    res.status(200).json({ message: "Attendance updated successfully.", attendance: record });
  })
);


/*
 * @desc  Delete an attendance record
 * @route DELETE /api/attendance/:id
 * @method DELETE
 * @access Private (admin)
 */
router.delete(
  "/:id",
  verifyTokenAndAdmin,
  asyncHandler(async (req, res) => {
    const record = await Attendance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Attendance record not found." });
    }
    await Attendance.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Attendance record deleted successfully." });
  })
);


module.exports = router;