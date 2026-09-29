// routes/statistics.js
const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const {Khadem,validateCreateKhadem,validateUpdateKhadem} = require("../models/Khadem");
const {verifyTokenAndAdmin} = require("../middleewares/verifyToken");
const {Attendance} = require("../models/Attendance");
const calculateFridayStreak = require("../controllers/calculateFirdayStreak");



/*
 * @desc Get dashboard statistics for admin
 * @route GET /api/statistics/dashboard
 * @access Private (admin)
 */
router.get("/dashboard", verifyTokenAndAdmin, asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalKhadem,
    totalAttendanceThisMonth,
    nameOfServantsInThisMonth,
    attendanceByKhadem,
    upcomingBirthdays,
  ] = await Promise.all([
    // كل الخدام
    Khadem.countDocuments(),

    // حضور الشهر الحالي
    Attendance.countDocuments({ date: { $gte: startOfMonth } }),

    // أسماء الخدام اللي حضروا الشهر ده
    // Attendance.find({ date: { $gte: startOfMonth } }).distinct("khadem").select("name" ),
     // أسماء الخدام اللي حضروا الشهر ده
    Attendance.find({ date: { $gte: startOfMonth } })
      .distinct("khadem")
      .then(khademIds => Khadem.find({ _id: { $in: khademIds } }).select("name")),
    // أداء كل خادم هذا الشهر
    Attendance.aggregate([
      { $match: { date: { $gte: startOfMonth } } },
      {
        $group: {
          _id: "$khadem",
          totalDays: { $sum: 1 },
          massCount: { $sum: { $cond: ["$attendedMass", 1, 0] } },
          serviceCount: { $sum: { $cond: ["$attendedService", 1, 0] } },
          openingCount: { $sum: { $cond: ["$attendedOpening", 1, 0] } },
          kashkolCount: { $sum: { $cond: ["$preparedKashkol", 1, 0] } },
        },
      },
      {
        $lookup: {
          from: "khadems",
          localField: "_id",
          foreignField: "_id",
          as: "khadem",
        },
      },
      { $unwind: "$khadem" },
      {
        $project: {
          name: "$khadem.name",
          imageUrl: "$khadem.imageUrl",
          totalDays: 1,
          massCount: 1,
          serviceCount: 1,
          openingCount: 1,
          kashkolCount: 1,
          performanceScore: {
            $multiply: [
              {
                $divide: [
                  { $add: ["$massCount", "$serviceCount", "$openingCount", "$kashkolCount"] },
                  { $multiply: ["$totalDays", 4] },
                ],
              },
              100,
            ],
          },
        },
      },
      { $sort: { performanceScore: -1 } },
    ]),

    // أعياد ميلاد الشهر الجاي
    Khadem.aggregate([
      {
        $addFields: {
          birthMonth: { $month: "$birthDate" },
          birthDay: { $dayOfMonth: "$birthDate" },
        },
      },
      {
        $match: {
          birthMonth: {
            $in: [now.getMonth() + 1, now.getMonth() + 2],
          },
        },
      },
      {
        $project: {
          name: 1,
          imageUrl: 1,
          birthDate: 1,
          birthMonth: 1,
          birthDay: 1,
        },
      },
      { $sort: { birthMonth: 1, birthDay: 1 } },
    ]),
  ]);
  // Add Friday streak to each khadem

  const attendanceWithStreak = await Promise.all(
  attendanceByKhadem.map(async (khadem) => {
    const streak = await calculateFridayStreak(khadem._id);
    return {
      ...khadem,
      ...streak,
    };
  })
);
  res.status(200).json({
    totalKhadem,
    totalAttendanceThisMonth,
    nameOfServantsInThisMonth,
    attendanceByKhadem: attendanceWithStreak,
    upcomingBirthdays,
  });
}));


module.exports = router;