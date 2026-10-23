const mongoose = require("mongoose");
const Joi = require("joi");

const SupervisorSchema = new mongoose.Schema(
  {
    khadem: { type: mongoose.Schema.Types.ObjectId, ref: "Khadem", required: true },
    role: { type: String, trim: true, default: "مشرف" }, // e.g. رئيس الفعالية / أمين الصندوق
    canCollectPayments: { type: Boolean, default: false },
  },
  { _id: false }
);

const TripSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["trip", "conference"], required: true }, // رحلة يوم واحد / مؤتمر-خلوة
    title: { type: String, required: true, trim: true, maxlength: 200 },
    church: { type: String, required: true, trim: true },
    diocese: { type: String, trim: true },
    serviceSector: { type: String, required: true, trim: true }, // قطاع الخدمة أو الأسرة
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    gatheringTime: { type: String, trim: true }, // "05:30"
    gatheringPoint: { type: String, trim: true },
    supervisors: [SupervisorSchema],
    location: {
      name: { type: String, trim: true },
      address: { type: String, trim: true },
      distanceKm: { type: Number, min: 0 },
      travelTimeMinutes: { type: Number, min: 0 },
      mapUrl: { type: String, trim: true },
    },
    images: { type: [String], validate: [(v) => v.length <= 5, "Max 5 images"] },
    pricePerPerson: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "EGP" },
    capacity: { type: Number, required: true, min: 1 },
    transportNote: { type: String, trim: true }, // حافلتان (٤٥ مقعد لكل حافلة)
    paymentDeadline: { type: Date, required: true },
    installments: {
      enabled: { type: Boolean, default: false },
      depositAmount: { type: Number, min: 0, default: 0 },
      count: { type: Number, min: 0, default: 0 },
    },
    terms: { type: String, trim: true },
    minAge: Number,
    maxAge: Number,
    status: { type: String, enum: ["draft", "active", "completed", "cancelled"], default: "active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Khadem" },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

TripSchema.virtual("durationDays").get(function () {
  if (!this.startDate || !this.endDate) return 1;
  return Math.round((this.endDate - this.startDate) / 86400000) + 1;
});
TripSchema.virtual("installmentAmount").get(function () {
  const i = this.installments || {};
  if (!i.enabled || !i.count) return 0;
  return Math.ceil((this.pricePerPerson - i.depositAmount) / i.count);
});

const Trip = mongoose.model("Trip", TripSchema);

const base = {
  type: Joi.string().valid("trip", "conference"),
  title: Joi.string().trim().max(200),
  church: Joi.string().trim(),
  diocese: Joi.string().trim().allow(""),
  serviceSector: Joi.string().trim(),
  startDate: Joi.date(),
  endDate: Joi.date().min(Joi.ref("startDate")),
  gatheringTime: Joi.string().trim().allow(""),
  gatheringPoint: Joi.string().trim().allow(""),
  supervisors: Joi.array().items(
    Joi.object({ khadem: Joi.string().hex().length(24).required(), role: Joi.string().allow(""), canCollectPayments: Joi.boolean() })
  ),
  location: Joi.object({
    name: Joi.string().allow(""), address: Joi.string().allow(""),
    distanceKm: Joi.number().min(0), travelTimeMinutes: Joi.number().min(0), mapUrl: Joi.string().allow(""),
  }),
  images: Joi.array().items(Joi.string().uri()).max(5),
  pricePerPerson: Joi.number().min(0),
  currency: Joi.string(),
  capacity: Joi.number().integer().min(1),
  transportNote: Joi.string().allow(""),
  paymentDeadline: Joi.date(),
  installments: Joi.object({ enabled: Joi.boolean(), depositAmount: Joi.number().min(0), count: Joi.number().integer().min(0) }),
  terms: Joi.string().allow(""),
  minAge: Joi.number().integer().min(0),
  maxAge: Joi.number().integer().min(0),
  status: Joi.string().valid("draft", "active", "completed", "cancelled"),
};

function validateCreateTrip(obj) {
  return Joi.object(base)
    .fork(["type", "title", "church", "serviceSector", "startDate", "pricePerPerson", "capacity", "paymentDeadline"], (s) => s.required())
    .validate(obj);
}
function validateUpdateTrip(obj) {
  return Joi.object(base).validate(obj);
}

module.exports = { Trip, validateCreateTrip, validateUpdateTrip };
