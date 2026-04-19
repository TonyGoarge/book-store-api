const mongoose = require("mongoose");
const Joi = require("joi");

// ─── Schema ───────────────────────────────────────────────────────────────────
const AttendanceSchema = new mongoose.Schema(
  {
    khadem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Khadem",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: () => new Date().setHours(0, 0, 0, 0), // store date only (midnight)
    },

    // ── Attendance checkboxes (matches the Flutter UI) ──────────────────────
    attendedMass: {          // حضور القداس
      type: Boolean,
      default: false,
    },
    attendedService: {       // حضور الخدمة
      type: Boolean,
      default: false,
    },
    attendedOpening: {       // حضور الافتتاحية
      type: Boolean,
      default: false,
    },
    preparedKashkol: {       // تحضير الكشكول
      type: Boolean,
      default: false,
    },

    // ── Free-text notes ─────────────────────────────────────────────────────
    notes: {                 // ملحوظات اليوم
      type: String,
      default: "",
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

// Prevent duplicate records for the same khadem on the same day
AttendanceSchema.index({ khadem: 1, date: 1 }, { unique: true });

// ─── Joi Validators ───────────────────────────────────────────────────────────
function validateCreateAttendance(obj) {
  const schema = Joi.object({
    khadem:           Joi.string().required(),                 // MongoDB ObjectId as string
    date:             Joi.date().required(),
    attendedMass:     Joi.boolean().default(false),
    attendedService:  Joi.boolean().default(false),
    attendedOpening:  Joi.boolean().default(false),
    preparedKashkol:  Joi.boolean().default(false),
    notes:            Joi.string().allow("").max(1000).default(""),
  });
  return schema.validate(obj);
}

function validateUpdateAttendance(obj) {
  const schema = Joi.object({
    attendedMass:     Joi.boolean(),
    attendedService:  Joi.boolean(),
    attendedOpening:  Joi.boolean(),
    preparedKashkol:  Joi.boolean(),
    notes:            Joi.string().allow("").max(1000),
  }).min(1); // at least one field must be provided
  return schema.validate(obj);
}

// ─── Model ────────────────────────────────────────────────────────────────────
const Attendance = mongoose.model("Attendance", AttendanceSchema);

module.exports = { Attendance, validateCreateAttendance, validateUpdateAttendance };