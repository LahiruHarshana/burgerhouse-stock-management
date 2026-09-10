/** PO-000123 වගේ අනුක්‍රමික අංකයක් හදනවා */
export async function nextRef(Model, field, prefix) {
  const last = await Model.findOne({ [field]: new RegExp('^' + prefix) })
    .sort({ createdAt: -1 }).select(field).lean();
  const n = last ? (parseInt(String(last[field]).split('-')[1], 10) || 0) + 1 : 1;
  return `${prefix}-${String(n).padStart(6, '0')}`;
}
