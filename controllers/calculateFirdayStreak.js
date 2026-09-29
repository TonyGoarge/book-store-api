// const mongoose = require("mongoose");
// const { Attendance } = require("../models/Attendance");
// const { Khadem } = require("../models/Khadem");

// const calculateFridayStreak = async (khademId) => {

//   // 1. Validate ObjectId
//   if (!mongoose.Types.ObjectId.isValid(khademId)) {
//     const error = new Error("Invalid Khadem ID");
//     error.statusCode = 400;
//     throw error;
//   }

//   // 2. Check if Khadem exists
//   const khadem = await Khadem.findById(khademId).select("_id");

//   if (!khadem) {
//     const error = new Error("Khadem not found");
//     error.statusCode = 404;
//     throw error;
//   }

//   // 3. Get attendance records
//   const attendances = await Attendance.find({
//     khadem: khademId,
//     attendedService: true,
//   })
//     .sort({ date: -1 })
//     .select("date")
//     .lean();

//   // 4. Keep Fridays only
//   const fridayDates = attendances
//     .map((attendance) => {
//       const date = new Date(attendance.date);
//       date.setHours(0, 0, 0, 0);
//       return date;
//     })
//     .filter((date) => date.getDay() === 5);

//   if (fridayDates.length === 0) {
//     return {
//       currentStreak: 0,
//       longestStreak: 0,
//       totalFridaysAttended: 0,
//     };
//   }

//   // --------------------------------
//   // Longest streak
//   // --------------------------------

//   let longestStreak = 1;
//   let streak = 1;

//   for (let i = 1; i < fridayDates.length; i++) {
//     const previousDate = fridayDates[i - 1];
//     const currentDate = fridayDates[i];

//     const diffInDays =
//       (previousDate - currentDate) /
//       (1000 * 60 * 60 * 24);

//     if (diffInDays === 7) {
//       streak++;
//       longestStreak = Math.max(longestStreak, streak);
//     } else {
//       streak = 1;
//     }
//   }

//   // --------------------------------
//   // Current streak
//   // --------------------------------

//   let currentStreak = 1;

//   for (let i = 1; i < fridayDates.length; i++) {
//     const previousDate = fridayDates[i - 1];
//     const currentDate = fridayDates[i];

//     const diffInDays =
//       (previousDate - currentDate) /
//       (1000 * 60 * 60 * 24);

//     if (diffInDays === 7) {
//       currentStreak++;
//     } else {
//       break;
//     }
//   }

//   return {
//     currentStreak,
//     longestStreak,
//     totalFridaysAttended: fridayDates.length,
//   };
// };


// controllers/calculateFridayStreak.js

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

  // 3. Get ALL attendance records
  // مهم: لا نضع attendedService: true هنا
  // لأننا نحتاج معرفة الجمع التي غاب فيها الخادم أيضًا.
  const attendances = await Attendance.find({
    khadem: khademId,
  })
    .select("date attendedService")
    .sort({ date: 1 })
    .lean();

  // 4. Keep Fridays only
  const fridayAttendances = attendances
    .map((attendance) => {
      const date = new Date(attendance.date);

      // التاريخ عندك محفوظ كـ UTC
      date.setUTCHours(0, 0, 0, 0);

      return {
        date,
        attendedService: attendance.attendedService === true,
      };
    })
    .filter(({ date }) => date.getUTCDay() === 5);

  // No Friday attendance records
  if (fridayAttendances.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalFridaysAttended: 0,
    };
  }

  // ------------------------------------------------
  // Total Fridays attended
  // ------------------------------------------------

  const totalFridaysAttended = fridayAttendances.filter(
    (friday) => friday.attendedService
  ).length;

  // ------------------------------------------------
  // Longest streak
  // ------------------------------------------------

  let longestStreak = 0;
  let currentLongestStreak = 0;

  for (const friday of fridayAttendances) {
    if (friday.attendedService) {
      currentLongestStreak++;

      longestStreak = Math.max(
        longestStreak,
        currentLongestStreak
      );
    } else {
      // Missed Friday → break the streak
      currentLongestStreak = 0;
    }
  }

  // ------------------------------------------------
  // Current streak
  // ------------------------------------------------

  let currentStreak = 0;

  // نبدأ من آخر جمعة ونرجع للخلف
  for (let i = fridayAttendances.length - 1; i >= 0; i--) {
    const friday = fridayAttendances[i];

    if (friday.attendedService) {
      currentStreak++;
    } else {
      // آخر جمعة missed → current streak = 0
      currentStreak = 0;
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
