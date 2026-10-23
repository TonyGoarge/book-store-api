const asyncHandler = require("express-async-handler");
const { Trip } = require("../models/Trip");
const {
  TripParticipant, validateCreateParticipant, validateUpdateParticipant, validatePayment,
} = require("../models/TripParticipant");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * @desc   List participants (filters: status=all|partial|unpaid|full, search by name/phone)
 * @route  /api/trips/:id/participants
 * @method GET
 * @access private
 */
const getParticipants = asyncHandler(async (req, res) => {
  const { status, search, pageNumber = 1, limit = 50 } = req.query;
  const filter = { trip: req.params.id };
  if (status && status !== "all") filter.paymentStatus = status;
  if (search) {
    const rx = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ name: rx }, { phone: new RegExp(escapeRegex(search.replace(/\s/g, ""))) }];
  }
  const [participants, total] = await Promise.all([
    TripParticipant.find(filter).sort({ name: 1 }).skip((pageNumber - 1) * limit).limit(Number(limit))
      .populate("payments.receivedBy", "name"),
    TripParticipant.countDocuments(filter),
  ]);
  res.status(200).json({ participants, total });
});

/**
 * @desc   Add participant to a trip
 * @route  /api/trips/:id/participants
 * @method POST
 * @access private (admin only)
 */
const addParticipant = asyncHandler(async (req, res) => {
  const { error } = validateCreateParticipant(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: "trip not found" });
  const count = await TripParticipant.countDocuments({ trip: trip._id });
  if (count >= trip.capacity) return res.status(400).json({ message: "trip is full" });

  const exists = await TripParticipant.findOne({ trip: trip._id, phone: req.body.phone });
  if (exists) return res.status(400).json({ message: "participant with this phone already registered" });

  const participant = await TripParticipant.create({
    ...req.body,
    trip: trip._id,
    totalDue: req.body.totalDue ?? trip.pricePerPerson,
  });
  res.status(201).json(participant);
});

/**
 * @desc   Update participant
 * @route  /api/trips/:id/participants/:participantId
 * @method PUT
 * @access private (admin only)
 */
const updateParticipant = asyncHandler(async (req, res) => {
  const { error } = validateUpdateParticipant(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  const p = await TripParticipant.findOne({ _id: req.params.participantId, trip: req.params.id });
  if (!p) return res.status(404).json({ message: "participant not found" });
  Object.assign(p, req.body);
  await p.save(); // recalculates status if totalDue changed
  res.status(200).json(p);
});

/**
 * @desc   Remove participant
 * @route  /api/trips/:id/participants/:participantId
 * @method DELETE
 * @access private (admin only)
 */
const deleteParticipant = asyncHandler(async (req, res) => {
  const p = await TripParticipant.findOneAndDelete({ _id: req.params.participantId, trip: req.params.id });
  if (!p) return res.status(404).json({ message: "participant not found" });
  res.status(200).json({ message: "participant has been removed" });
});

/**
 * @desc   Record payment / installment (Record Fast Payment sheet)
 * @route  /api/trips/:id/participants/:participantId/payments
 * @method POST
 * @access private (admin or supervisor with canCollectPayments)
 */
const recordPayment = asyncHandler(async (req, res) => {
  const { error } = validatePayment(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: "trip not found" });
  const canCollect = req.user.isAdmin ||
    trip.supervisors.some((s) => s.khadem.toString() === req.user.id && s.canCollectPayments);
  if (!canCollect) return res.status(403).json({ message: "not allowed to collect payments for this trip" });

  const p = await TripParticipant.findOne({ _id: req.params.participantId, trip: trip._id });
  if (!p) return res.status(404).json({ message: "participant not found" });
  if (req.body.amount > p.remaining)
    return res.status(400).json({ message: `amount exceeds remaining balance (${p.remaining})` });

  const seq = (await TripParticipant.aggregate([
    { $match: { trip: trip._id } },
    { $project: { n: { $size: "$payments" } } },
    { $group: { _id: null, total: { $sum: "$n" } } },
  ]))[0]?.total || 0;

  p.payments.push({
    ...req.body,
    txnId: `TXN-${String(seq + 1).padStart(4, "0")}`,
    receiptNumber: req.body.receiptNumber || `${Date.now()}`.slice(-6),
    receivedBy: req.user.id,
  });
  await p.save();
  res.status(201).json(p);
});

/**
 * @desc   Delete a payment (correct a mistake)
 * @route  /api/trips/:id/participants/:participantId/payments/:paymentId
 * @method DELETE
 * @access private (admin only)
 */
const deletePayment = asyncHandler(async (req, res) => {
  const p = await TripParticipant.findOne({ _id: req.params.participantId, trip: req.params.id });
  if (!p) return res.status(404).json({ message: "participant not found" });
  const payment = p.payments.id(req.params.paymentId);
  if (!payment) return res.status(404).json({ message: "payment not found" });
  payment.deleteOne();
  await p.save();
  res.status(200).json(p);
});

/**
 * @desc   Receipt data for a participant (View Receipt)
 * @route  /api/trips/:id/participants/:participantId/receipt
 * @method GET
 * @access private
 */
const getReceipt = asyncHandler(async (req, res) => {
  const p = await TripParticipant.findOne({ _id: req.params.participantId, trip: req.params.id })
    .populate("trip", "title startDate endDate currency location")
    .populate("payments.receivedBy", "name");
  if (!p) return res.status(404).json({ message: "participant not found" });
  res.status(200).json({
    participant: { name: p.name, phone: p.phone, accommodation: p.accommodation },
    trip: p.trip, totalDue: p.totalDue, amountPaid: p.amountPaid, remaining: p.remaining,
    status: p.paymentStatus, payments: p.payments,
  });
});

/**
 * @desc   WhatsApp reminder link for unpaid / partial participant
 * @route  /api/trips/:id/participants/:participantId/reminder
 * @method GET
 * @access private
 */
const getWhatsappReminder = asyncHandler(async (req, res) => {
  const p = await TripParticipant.findOne({ _id: req.params.participantId, trip: req.params.id }).populate("trip");
  if (!p) return res.status(404).json({ message: "participant not found" });
  const deadline = p.trip.paymentDeadline.toLocaleDateString("ar-EG");
  const msg = `سلام ونعمة ${p.name}، نذكرك بسداد المتبقي (${p.remaining} ${p.trip.currency}) لـ ${p.trip.title} قبل ${deadline}.`;
  const phone = p.phone.replace(/\D/g, "").replace(/^0/, "20");
  res.status(200).json({ message: msg, url: `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` });
});

module.exports = {
  getParticipants, addParticipant, updateParticipant, deleteParticipant,
  recordPayment, deletePayment, getReceipt, getWhatsappReminder,
};
