const Case = require('../models/Case');
const Batch = require('../models/Batch');

exports.getKPIs = async (req, res) => {
  try {
    const batches = await Batch.find({});
    
    let totalRevenueAtRisk = 0;
    let totalRevenueRecovered = 0;
    let totalCases = 0;
    let recoveredCases = 0;

    batches.forEach(b => {
      totalRevenueAtRisk += b.total_amount;
      totalRevenueRecovered += b.recovered_amount;
      totalCases += b.total_cases;
      recoveredCases += b.recovered_cases;
    });

    const recoveryRateAmount = totalRevenueAtRisk > 0 ? (totalRevenueRecovered / totalRevenueAtRisk) * 100 : 0;
    const recoveryRateCount = totalCases > 0 ? (recoveredCases / totalCases) * 100 : 0;

    // Get case count by status
    const statusCounts = await Case.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    // Format status counts
    const statusStats = { pending: 0, in_recovery: 0, recovered: 0, failed: 0, paused: 0 };
    statusCounts.forEach(item => {
      if (statusStats[item._id] !== undefined) {
        statusStats[item._id] = item.count;
      }
    });

    // Get case count by type
    const typeCounts = await Case.aggregate([
      { $group: { _id: "$case_type", count: { $sum: 1 }, amount: { $sum: "$amount" } } }
    ]);

    const typeStats = typeCounts.map(item => ({
      type: item._id,
      count: item.count,
      amount: item.amount
    }));

    res.status(200).json({
      success: true,
      data: {
        totalRevenueAtRisk,
        totalRevenueRecovered,
        recoveryRateAmount: parseFloat(recoveryRateAmount.toFixed(2)),
        recoveryRateCount: parseFloat(recoveryRateCount.toFixed(2)),
        totalCases,
        recoveredCases,
        statusStats,
        typeStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRecoveryTimeline = async (req, res) => {
  try {
    // Return aggregated recovered vs risk over last 7 days or mock dashboard data for charts
    const timelineData = await Case.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$amount" },
          recovered: {
            $sum: {
              $cond: [{ $eq: ["$status", "recovered"] }, "$amount", 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: timelineData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
