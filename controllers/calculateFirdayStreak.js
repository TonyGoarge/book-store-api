const mongoose = require("mongoose");
const { Attendance } = require("../models/Attendance");
const { Khadem } = require("../models/Khadem");

const calculateFridayStreak = async (khademId) => {
  // 1. Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(khademId)) {
    const error = new Error("Invalid Khadem ID");
    error.statusCode = 400;
    throw error;
  }

  // 2. Check if Khadem exists
  const khadem = await Khadem.findById(khademId).select("_id");

  if (!khadem) {
    const error = new Error("Khadem not found");
    error.statusCode = 404;
    throw error;
  }

  // 3. Get all attendance records
  const attendances = await Attendance.find({
    khadem: khademId,
  })
    .select("date attendedService")
    .sort({ date: 1 })
    .lean();

  // ------------------------------------------------
  // Create a map of attendance by date
  // ------------------------------------------------

  const attendanceByDate = new Map();

  for (const attendance of attendances) {
    const date = new Date(attendance.date);

    date.setUTCHours(0, 0, 0, 0);

    const dateKey = date.toISOString().split("T")[0];

    attendanceByDate.set(dateKey, attendance.attendedService === true);
  }

  // ------------------------------------------------
  // Find the latest completed Friday
  // ------------------------------------------------

  const today = new Date();

  today.setUTCHours(0, 0, 0, 0);

  const latestFriday = new Date(today);

  const dayOfWeek = latestFriday.getUTCDay();

  // Friday = 5
  const daysSinceFriday = (dayOfWeek - 5 + 7) % 7;

  latestFriday.setUTCDate(
    latestFriday.getUTCDate() - daysSinceFriday
  );

  // If today is Friday, we do not consider it missed yet.
  if (dayOfWeek === 5) {
    latestFriday.setUTCDate(
      latestFriday.getUTCDate() - 7
    );
  }

  // ------------------------------------------------
  // Find earliest attendance date
  // ------------------------------------------------

  if (attendances.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalFridaysAttended: 0,
    };
  }

  const firstAttendanceDate = new Date(attendances[0].date);

  firstAttendanceDate.setUTCHours(0, 0, 0, 0);

  // Find the first Friday on/after first attendance
  const firstFriday = new Date(firstAttendanceDate);

  const firstDayOfWeek = firstFriday.getUTCDay();

  const daysUntilFriday = (5 - firstDayOfWeek + 7) % 7;

  firstFriday.setUTCDate(
    firstFriday.getUTCDate() + daysUntilFriday
  );

  // ------------------------------------------------
  // Calculate every Friday
  // ------------------------------------------------

  let currentStreak = 0;
  let longestStreak = 0;
  let totalFridaysAttended = 0;

  let runningStreak = 0;

  for (
    let friday = new Date(firstFriday);
    friday <= latestFriday;
    friday.setUTCDate(friday.getUTCDate() + 7)
  ) {
    const dateKey = friday.toISOString().split("T")[0];

    const attendedService = attendanceByDate.get(dateKey) === true;

    if (attendedService) {
      totalFridaysAttended++;

      runningStreak++;

      longestStreak = Math.max(
        longestStreak,
        runningStreak
      );
    } else {
      // No attendance record OR attendedService === false
      runningStreak = 0;
    }
  }

  // ------------------------------------------------
  // Calculate current streak
  // ------------------------------------------------

  currentStreak = 0;

  for (
    let friday = new Date(latestFriday);
    friday >= firstFriday;
    friday.setUTCDate(friday.getUTCDate() - 7)
  ) {
    const dateKey = friday.toISOString().split("T")[0];

    const attendedService = attendanceByDate.get(dateKey) === true;

    if (attendedService) {
      currentStreak++;
    } else {
      break;
    }
  }

  return {
    currentStreak,
    longestStreak,
    totalFridaysAttended,
  };
};

module.exports = calculateFridayStreak;