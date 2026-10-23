const asyncHandler = require("express-async-handler");
const { Trip, validateCreateTrip, validateUpdateTrip } = require("../models/Trip");
const { TripParticipant } = require("../models/TripParticipant");
const { Khadem } = require("../models/Khadem");

/**
 * @desc   Get all trips & conferences (filters: type, status, upcoming) + pagination
 * @route  /api/trips
 * @method GET
 * @access private (any servant)
 */
const getAllTrips = asyncHandler(async (req, res) => {
  const { type, status, upcoming, pageNumber = 1, limit = 10 } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (upcoming === "true") filter.endDate = { $gte: new Date() };

  const [trips, total, activeCount] = await Promise.all([
    Trip.find(filter).sort({ startDate: 1 }).skip((pageNumber - 1) * limit).limit(Number(limit))
      .populate("supervisors.khadem", "name imageUrl phone"),
    Trip.countDocuments(filter),
    Trip.countDocuments({ status: "active" }), // "6 فعاليات نشطة" on home card
  ]);
  res.status(200).json({ trips, total, activeCount });
});

/**
 * @desc   Get trips whose serviceSector matches the logged-in khadem's service
 * @route  GET /api/trips/my-service
 * @method GET
 * @access private (any servant)
 * @query  type, status, upcoming, pageNumber, limit
 */
const getTripsByMyService = asyncHandler(async (req, res) => {
  // Fetch the khadem to read their service field
  const khadem = await Khadem.findById(req.user.id).select("service");
  if (!khadem) return res.status(404).json({ message: "khadem not found" });
  if (!khadem.service) return res.status(400).json({ message: "no service assigned to your account" });

  const { type, status, upcoming, pageNumber = 1, limit = 10 } = req.query;

  // Base filter: serviceSector must match khadem's service
  const filter = { serviceSector: khadem.service };
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (upcoming === "true") filter.endDate = { $gte: new Date() };

  const [trips, total, activeCount] = await Promise.all([
    Trip.find(filter)
      .sort({ startDate: 1 })
      .skip((pageNumber - 1) * limit)
      .limit(Number(limit))
      .populate("supervisors.khadem", "name imageUrl phone"),
    Trip.countDocuments(filter),
    Trip.countDocuments({ serviceSector: khadem.service, status: "active" }),
  ]);

  res.status(200).json({
    serviceSector: khadem.service,
    trips,
    total,
    activeCount,
    page: Number(pageNumber),
    pages: Math.ceil(total / limit),
  });
});

/**
 * @desc   Get trip by id with financial summary
 * @route  /api/trips/:id
 * @method GET
 * @access private
 */
const getTripById = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id).populate("supervisors.khadem", "name imageUrl phone service");
  if (!trip) return res.status(404).json({ message: "trip not found" });
  const summary = await buildSummary(trip);
  res.status(200).json({ trip, summary });
});

/**
 * @desc   Create trip / conference
 * @route  /api/trips
 * @method POST
 * @access private (admin only)
 */
const createTrip = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.type === "trip" && !body.endDate) body.endDate = body.startDate; // day trip ends same day
  const { error } = validateCreateTrip(body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  if (body.type === "trip" && new Date(body.endDate).toDateString() !== new Date(body.startDate).toDateString())
    return res.status(400).json({ message: "day trip must start and end on the same day" });

  const trip = await Trip.create({ ...body, createdBy: req.user.id });
  res.status(201).json(trip);
});

/**
 * @desc   Update trip
 * @route  /api/trips/:id
 * @method PUT
 * @access private (admin only)
 */
const updateTrip = asyncHandler(async (req, res) => {
  const { error } = validateUpdateTrip(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  const trip = await Trip.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!trip) return res.status(404).json({ message: "trip not found" });
  res.status(200).json(trip);
});

/**
 * @desc   Delete trip (and its participants)
 * @route  /api/trips/:id
 * @method DELETE
 * @access private (admin only)
 */
const deleteTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findByIdAndDelete(req.params.id);
  if (!trip) return res.status(404).json({ message: "trip not found" });
  await TripParticipant.deleteMany({ trip: trip._id });
  res.status(200).json({ message: "trip has been deleted" });
});

/**
 * @desc   Upload trip gallery images (max 5) via Cloudinary multer
 * @route  /api/trips/:id/images
 * @method POST
 * @access private (admin only)
 */
const uploadTripImages = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: "trip not found" });
  const urls = (req.files || []).map((f) => f.path);
  if (!urls.length) return res.status(400).json({ message: "no images provided" });
  if (trip.images.length + urls.length > 5) return res.status(400).json({ message: "maximum 5 images per trip" });
  trip.images.push(...urls);
  await trip.save();
  res.status(200).json(trip);
});

/**
 * @desc   Remove one image from trip gallery
 * @route  /api/trips/:id/images
 * @method DELETE  body: { url }
 * @access private (admin only)
 */
const removeTripImage = asyncHandler(async (req, res) => {
  const trip = await Trip.findByIdAndUpdate(req.params.id, { $pull: { images: req.body.url } }, { new: true });
  if (!trip) return res.status(404).json({ message: "trip not found" });
  res.status(200).json(trip);
});

/**
 * @desc   Financial summary for the participants screen header
 * @route  /api/trips/:id/summary
 * @method GET
 * @access private
 */
const getTripSummary = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: "trip not found" });
  res.status(200).json(await buildSummary(trip));
});

async function buildSummary(trip) {
  const [agg] = await TripParticipant.aggregate([
    { $match: { trip: trip._id } },
    {
      $group: {
        _id: null,
        participants: { $sum: 1 },
        target: { $sum: "$totalDue" },
        collected: { $sum: "$amountPaid" },
        full: { $sum: { $cond: [{ $eq: ["$paymentStatus", "full"] }, 1, 0] } },
        partial: { $sum: { $cond: [{ $eq: ["$paymentStatus", "partial"] }, 1, 0] } },
        unpaid: { $sum: { $cond: [{ $eq: ["$paymentStatus", "unpaid"] }, 1, 0] } },
      },
    },
  ]);
  const s = agg || { participants: 0, target: 0, collected: 0, full: 0, partial: 0, unpaid: 0 };
  return {
    participants: s.participants,
    capacity: trip.capacity,
    seatsLeft: Math.max(trip.capacity - s.participants, 0),
    target: s.target,
    collected: s.collected,
    remaining: Math.max(s.target - s.collected, 0),
    percentComplete: s.target ? Math.round((s.collected / s.target) * 100) : 0,
    counts: { full: s.full, partial: s.partial, unpaid: s.unpaid },
    currency: trip.currency,
  };
}

module.exports = {
  getAllTrips, getTripsByMyService, getTripById, createTrip, updateTrip, deleteTrip,
  uploadTripImages, removeTripImage, getTripSummary, buildSummary,
};
