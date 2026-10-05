
// Current Month
// ├── totalDays
// ├── massCount
// ├── serviceCount
// ├── openingCount
// ├── kashkolCount
// └── performanceScore

// All History
// ├── currentStreak
// ├── longestStreak
// └── totalFridaysAttended

// currentStreak: Consecutive Fridays attended up to the latest Friday.
// longestStreak: The highest consecutive-Friday streak ever achieved.
// totalFridaysAttended: Total number of Fridays attended across all history.


const mongoose = require("mongoose");
const { Attendance } = require("../models/Attendance");

const calculatePerformance = async (khademId) => {
  const khademObjectId = new mongoose.Types.ObjectId(khademId);

  const now = new Date();

  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const stats = await Attendance.aggregate([
    {
      $match: {
        khadem: khademObjectId,
        date: { $gte: startOfMonth },
      },
    },
    {
      $group: {
        _id: "$khadem",

        totalDays: {
          $sum: 1,
        },

        massCount: {
          $sum: {
            $cond: ["$attendedMass", 1, 0],
          },
        },

        serviceCount: {
          $sum: {
            $cond: ["$attendedService", 1, 0],
          },
        },

        openingCount: {
          $sum: {
            $cond: ["$attendedOpening", 1, 0],
          },
        },

        kashkolCount: {
          $sum: {
            $cond: ["$preparedKashkol", 1, 0],
          },
        },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      totalDays: 0,
      massCount: 0,
      serviceCount: 0,
      openingCount: 0,
      kashkolCount: 0,
      performanceScore: 0,
    };
  }

  const data = stats[0];

  const performanceScore =
    (
      (
        data.massCount +
        data.serviceCount +
        data.openingCount +
        data.kashkolCount
      ) /
      (data.totalDays * 4)
    ) * 100;

  return {
    totalDays: data.totalDays,
    massCount: data.massCount,
    serviceCount: data.serviceCount,
    openingCount: data.openingCount,
    kashkolCount: data.kashkolCount,
    performanceScore: Math.round(performanceScore),
  };
};

module.exports = {
  calculatePerformance,
};