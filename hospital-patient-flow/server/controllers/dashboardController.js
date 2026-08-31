import Admission from '../models/Admission.js';
import Bed from '../models/Bed.js';
import Discharge from '../models/Discharge.js';
import { getDashboardCharts, getDashboardStats, getRecentActivity } from '../services/dashboardService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getRange = (query) => {
  const now = new Date();
  let start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (query.range === '7d') start.setDate(start.getDate() - 6);
  if (query.range === '30d') start.setDate(start.getDate() - 29);
  if (query.startDate) start = new Date(query.startDate);
  const end = query.endDate ? new Date(query.endDate) : now;
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const stats = asyncHandler(async (req, res) => {
  res.json(await getDashboardStats(req.query.range));
});

export const charts = asyncHandler(async (req, res) => {
  res.json(await getDashboardCharts(req.query.range));
});

export const activity = asyncHandler(async (req, res) => {
  res.json(await getRecentActivity());
});

export const reports = asyncHandler(async (req, res) => {
  const { start, end } = getRange(req.query);
  const [totalAdmissions, totalDischarges, availableBeds, totalBeds, occupiedBeds, wardWise, admissions, discharges, dischargedAdmissions] =
    await Promise.all([
      Admission.countDocuments({ admissionDate: { $gte: start, $lte: end } }),
      Discharge.countDocuments({ dischargeDate: { $gte: start, $lte: end } }),
      Bed.countDocuments({ status: 'Available' }),
      Bed.countDocuments(),
      Bed.countDocuments({ status: 'Occupied' }),
      Bed.aggregate([
        { $lookup: { from: 'wards', localField: 'ward', foreignField: '_id', as: 'ward' } },
        { $unwind: '$ward' },
        {
          $group: {
            _id: '$ward.name',
            total: { $sum: 1 },
            occupied: { $sum: { $cond: [{ $eq: ['$status', 'Occupied'] }, 1, 0] } },
            available: { $sum: { $cond: [{ $eq: ['$status', 'Available'] }, 1, 0] } }
          }
        }
      ]),
      Admission.find({ admissionDate: { $gte: start, $lte: end } }),
      Discharge.find({ dischargeDate: { $gte: start, $lte: end } }),
      Admission.find({ status: 'Discharged', dischargeDate: { $exists: true } })
    ]);

  const avgStay =
    dischargedAdmissions.length === 0
      ? 0
      : Math.round(
          dischargedAdmissions.reduce((sum, item) => sum + (item.dischargeDate - item.admissionDate) / 86400000, 0) /
            dischargedAdmissions.length
        );

  res.json({
    totalAdmissions,
    totalDischarges,
    averageOccupancy: totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
    availableBeds,
    wardWiseOccupancy: wardWise.map((item) => ({ ...item, ward: item._id, occupancyRate: item.total ? Math.round((item.occupied / item.total) * 100) : 0 })),
    dailyAdmissionTrend: admissions,
    dailyDischargeTrend: discharges,
    averagePatientStay: avgStay,
    bedUtilizationRate: totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0
  });
});
