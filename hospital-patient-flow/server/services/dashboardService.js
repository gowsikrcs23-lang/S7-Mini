import Admission from '../models/Admission.js';
import Bed from '../models/Bed.js';
import Discharge from '../models/Discharge.js';
import Ward from '../models/Ward.js';

const startOfDay = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const rangeDays = (days) => {
  const today = startOfDay();
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - index - 1));
    return date;
  });
};

const getDashboardRange = (range = '7d') => {
  const end = new Date();
  const start = startOfDay(end);
  const days = range === '30d' ? 30 : range === 'today' ? 1 : 7;
  start.setDate(start.getDate() - (days - 1));
  return { start, end };
};

export const getDashboardStats = async (range = '7d') => {
  const { start, end } = getDashboardRange(range);

  const [totalBeds, availableBeds, occupiedBeds, icuWard, emergencyWard, admittedToday, dischargedToday] =
    await Promise.all([
      Bed.countDocuments(),
      Bed.countDocuments({ status: 'Available' }),
      Bed.countDocuments({ status: 'Occupied' }),
      Ward.findOne({ name: 'ICU' }),
      Ward.findOne({ name: 'Emergency' }),
      Admission.countDocuments({ admissionDate: { $gte: start, $lte: end } }),
      Discharge.countDocuments({ dischargeDate: { $gte: start, $lte: end } })
    ]);

  const [icuAvailable, emergencyAvailable] = await Promise.all([
    icuWard ? Bed.countDocuments({ ward: icuWard._id, status: 'Available' }) : 0,
    emergencyWard ? Bed.countDocuments({ ward: emergencyWard._id, status: 'Available' }) : 0
  ]);

  return {
    totalBeds,
    availableBeds,
    occupiedBeds,
    icuBedsAvailable: icuAvailable,
    emergencyBedsAvailable: emergencyAvailable,
    patientsAdmittedToday: admittedToday,
    patientsDischargedToday: dischargedToday,
    range,
    occupancyRate: totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0
  };
};

export const getDashboardCharts = async (range = '7d') => {
  const wardBeds = await Bed.aggregate([
    { $lookup: { from: 'wards', localField: 'ward', foreignField: '_id', as: 'ward' } },
    { $unwind: '$ward' },
    {
      $group: {
        _id: '$ward.name',
        available: { $sum: { $cond: [{ $eq: ['$status', 'Available'] }, 1, 0] } },
        occupied: { $sum: { $cond: [{ $eq: ['$status', 'Occupied'] }, 1, 0] } },
        reserved: { $sum: { $cond: [{ $eq: ['$status', 'Reserved'] }, 1, 0] } },
        cleaning: { $sum: { $cond: [{ $eq: ['$status', 'Cleaning'] }, 1, 0] } },
        maintenance: { $sum: { $cond: [{ $eq: ['$status', 'Maintenance'] }, 1, 0] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const statuses = await Bed.aggregate([{ $group: { _id: '$status', value: { $sum: 1 } } }]);
  const days = range === '30d' ? rangeDays(30) : range === 'today' ? rangeDays(1) : rangeDays(7);
  const admissionTrend = [];
  const dischargeTrend = [];

  for (const day of days) {
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    const [admissions, discharges] = await Promise.all([
      Admission.countDocuments({ admissionDate: { $gte: day, $lt: next } }),
      Discharge.countDocuments({ dischargeDate: { $gte: day, $lt: next } })
    ]);
    const label = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    admissionTrend.push({ date: label, admissions });
    dischargeTrend.push({ date: label, discharges });
  }

  return {
    bedAvailabilityByWard: wardBeds.map((item) => ({ ward: item._id, ...item })),
    occupancyPie: statuses.map((item) => ({ name: item._id, value: item.value })),
    admissionTrend,
    dischargeTrend,
    weeklyFlow: admissionTrend.map((item, index) => ({
      date: item.date,
      admissions: item.admissions,
      discharges: dischargeTrend[index].discharges,
      netFlow: item.admissions - dischargeTrend[index].discharges
    }))
  };
};

export const getRecentActivity = async () => {
  const [admissions, discharges] = await Promise.all([
    Admission.find().sort({ admissionDate: -1 }).limit(8).populate('patient', 'name patientId').populate('bed', 'bedNumber roomNumber').populate('ward', 'name'),
    Discharge.find().sort({ dischargeDate: -1 }).limit(8).populate('patient', 'name patientId')
  ]);

  return [
    ...admissions.map((item) => ({
      id: `admission-${item._id}`,
      type: 'Admission',
      patient: item.patient?.name || 'Unknown patient',
      details: `${item.ward?.name || 'Ward'} / ${item.bed?.bedNumber || 'Bed'}`,
      date: item.admissionDate
    })),
    ...discharges.map((item) => ({
      id: `discharge-${item._id}`,
      type: 'Discharge',
      patient: item.patient?.name || 'Unknown patient',
      details: item.doctor ? `Doctor: ${item.doctor}` : 'Patient discharged',
      date: item.dischargeDate
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
};
