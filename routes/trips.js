const express = require("express");
const router = express.Router();
const { verifyToken, verifyTokenAndAdmin } = require("../middleewares/verifyToken");
const upload = require("../middleewares/multer");
const {
  getAllTrips, getTripsByMyService, getTripById, createTrip, updateTrip, deleteTrip,
  uploadTripImages, removeTripImage, getTripSummary,
} = require("../controllers/tripController");
const {
  getParticipants, addParticipant, updateParticipant, deleteParticipant,
  recordPayment, deletePayment, getReceipt, getWhatsappReminder,
} = require("../controllers/tripParticipantController");

// /api/trips
router.route("/").get(verifyToken, getAllTrips).post(verifyTokenAndAdmin, createTrip);

// /api/trips/my-service  — trips filtered by the logged-in khadem's service sector
// MUST be registered before /:id to avoid param collision
router.get("/my-service", verifyToken, getTripsByMyService);

// /api/trips/:id
router.route("/:id").get(verifyToken, getTripById).put(verifyTokenAndAdmin, updateTrip).delete(verifyTokenAndAdmin, deleteTrip);

router.get("/:id/summary", verifyToken, getTripSummary);
router.route("/:id/images")
  .post(verifyTokenAndAdmin, upload.array("images", 5), uploadTripImages)
  .delete(verifyTokenAndAdmin, removeTripImage);

// Participants
router.route("/:id/participants").get(verifyToken, getParticipants).post(verifyTokenAndAdmin, addParticipant);
router.route("/:id/participants/:participantId")
  .put(verifyTokenAndAdmin, updateParticipant)
  .delete(verifyTokenAndAdmin, deleteParticipant);

// Payments (supervisor-collector check happens inside controller)
router.post("/:id/participants/:participantId/payments", verifyToken, recordPayment);
router.delete("/:id/participants/:participantId/payments/:paymentId", verifyTokenAndAdmin, deletePayment);
router.get("/:id/participants/:participantId/receipt", verifyToken, getReceipt);
router.get("/:id/participants/:participantId/reminder", verifyToken, getWhatsappReminder);

module.exports = router;
