const mongoose = require("mongoose");
const Joi = require("joi");

const PAYMENT_METHODS = ["cash", "instapay", "vodafone_cash", "bank_transfer", "other"];

const PaymentSchema = new mongoose.Schema(
  {
    txnId: { type: String, required: true }, // TXN-0102
    amount: { type: Number, required: true, min: 1 },
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    reference: { type: String, trim: true }, // Ref #99214
    receiptNumber: { type: String, trim: true },
    paidAt: { type: Date, default: Date.now },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Khadem" },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

const TripParticipantSchema = new mongoose.Schema(
  {
    trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    accommodation: { type: String, trim: true }, // Family Room / Bus Seat #18
    totalDue: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    paymentStatus: { type: String, enum: ["unpaid", "partial", "full"], default: "unpaid" },
    payments: [PaymentSchema],
    notes: { type: String, trim: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

TripParticipantSchema.index({ trip: 1, phone: 1 }, { unique: true });
TripParticipantSchema.virtual("remaining").get(function () {
  return Math.max(this.totalDue - this.amountPaid, 0);
});

// Keep amountPaid and paymentStatus in sync with the payments array
TripParticipantSchema.methods.recalculate = function () {
  this.amountPaid = this.payments.reduce((s, p) => s + p.amount, 0);
  this.paymentStatus = this.amountPaid <= 0 ? "unpaid" : this.amountPaid >= this.totalDue ? "full" : "partial";
};
TripParticipantSchema.pre("save", function () {
  this.recalculate();
});

const TripParticipant = mongoose.model("TripParticipant", TripParticipantSchema);

function validateCreateParticipant(obj) {
  return Joi.object({
    name: Joi.string().trim().required(),
    phone: Joi.string().trim().min(8).max(20).required(),
    accommodation: Joi.string().allow(""),
    totalDue: Joi.number().min(0), // defaults to trip.pricePerPerson
    notes: Joi.string().allow(""),
  }).validate(obj);
}
function validateUpdateParticipant(obj) {
  return Joi.object({
    name: Joi.string().trim(), phone: Joi.string().trim().min(8).max(20),
    accommodation: Joi.string().allow(""), totalDue: Joi.number().min(0), notes: Joi.string().allow(""),
  }).validate(obj);
}
function validatePayment(obj) {
  return Joi.object({
    amount: Joi.number().min(1).required(),
    method: Joi.string().valid(...PAYMENT_METHODS).required(),
    reference: Joi.string().allow(""),
    receiptNumber: Joi.string().allow(""),
    paidAt: Joi.date(),
    notes: Joi.string().allow(""),
  }).validate(obj);
}

module.exports = { TripParticipant, PAYMENT_METHODS, validateCreateParticipant, validateUpdateParticipant, validatePayment };
