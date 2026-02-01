// pages/statistics/statistics.js
const storage = require("../../utils/storage");

Page({
  data: {
    stats: [],
    list: [],
    hasWarnings: false,
    lowStockCount: 0,
    expiryWarningCount: 0,
  },

  onLoad() {
    this.loadStats();
  },

  onShow() {
    this.loadStats();
  },

  // 加载库存统计
  loadStats() {
    const stats = storage.getInventoryStats();
    const list = storage.getStatisticsItemList();

    let lowStockCount = 0;
    let expiryWarningCount = 0;
    stats.forEach((item) => {
      if (item.isLowStock) lowStockCount++;
      if (item.hasExpiryWarning) expiryWarningCount++;
    });

    this.setData({
      stats,
      list,
      hasWarnings: lowStockCount > 0 || expiryWarningCount > 0,
      lowStockCount,
      expiryWarningCount,
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadStats();
    wx.stopPullDownRefresh();
  },

  // 计算剩余天数的显示文本
  getDaysText(days) {
    if (days < 0) {
      return `已过期${Math.abs(days)}天`;
    } else if (days === 0) {
      return "今天过期";
    } else {
      return `${days}天后过期`;
    }
  },
});
