function formatDate(date, format = 'yyyy-MM-dd') {
  const d = new Date(date);
  const pad = n => n < 10 ? '0' + n : n;
  return format
    .replace('yyyy', d.getFullYear())
    .replace('MM', pad(d.getMonth() + 1))
    .replace('dd', pad(d.getDate()))
    .replace('HH', pad(d.getHours()))
    .replace('mm', pad(d.getMinutes()))
    .replace('ss', pad(d.getSeconds()));
}




module.exports = { formatDate };