// storage.js - 仅保留格式化与默认物品类型；业务数据通过 api 获取，不保存在本地

const ITEM_TYPES = ['大米', '油', '肉', '鸡蛋']
const UNIT = ['袋', '瓶', '箱', '斤', '个']

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function formatDateTime(date) {
  const dateStr = formatDate(date)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${dateStr} ${hours}:${minutes}:${seconds}`
}

module.exports = {
  ITEM_TYPES,
  UNIT,
  formatDate,
  formatTime,
  formatDateTime,
}
