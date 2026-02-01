// pages/statistics/statistics.js
const api = require("../../utils/api");

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getMonthStart() {
  const d = new Date();
  return formatDate(new Date(d.getFullYear(), d.getMonth(), 1));
}

function getToday() {
  return formatDate(new Date());
}

Page({
  data: {
    stats: [],
    list: [],
    ioStats: [],
    startDate: getMonthStart(),
    endDate: getToday(),
    hasWarnings: false,
    lowStockCount: 0,
    expiryWarningCount: 0,
    detailMode: "",
    detailItemType: "",
    detailList: [],
    detailTitle: "",
    scrollIntoView: "",
  },

  onLoad() {
    // this.loadStats();
    this.loadIOStats();
  },

  onShow() {
    // this.loadStats();
    this.loadIOStats();
  },

  onStartDateChange(e) {
    const startDate = e.detail.value;
    const endDate = this.data.endDate;
    const newEndDate = startDate > endDate ? startDate : endDate;
    this.setData({ startDate, endDate: newEndDate }, () => this.loadIOStats());
  },

  onEndDateChange(e) {
    const endDate = e.detail.value;
    const startDate = this.data.startDate;
    const newStartDate = endDate < startDate ? endDate : startDate;
    this.setData({ endDate, startDate: newStartDate }, () =>
      this.loadIOStats()
    );
  },

  onIODetailTap(e) {
    const { itemType, mode } = e.currentTarget.dataset;
    const { startDate, endDate } = this.data;
    const detailType = mode || "both";
    const modeMap = { inbound: "入库", outbound: "出库", both: "出入库" };
    const detailTitle = `${itemType} - ${modeMap[detailType]}明细`;
    this.setData({
      detailMode: detailType,
      detailItemType: itemType,
      detailTitle,
    });
    api
      .getInventoryIODetails(itemType, startDate, endDate, detailType)
      .then((detailList) => {
        this.setData({ detailList, scrollIntoView: "detailSection" });
        setTimeout(() => this.setData({ scrollIntoView: "" }), 300);
      })
      .catch((err) => {
        wx.showToast({ title: err.message || "加载失败", icon: "none" });
        this.setData({
          detailMode: "",
          detailItemType: "",
          detailList: [],
          detailTitle: "",
        });
      });
  },

  onClearDetail() {
    this.setData({
      detailMode: "",
      detailItemType: "",
      detailList: [],
      detailTitle: "",
    });
  },

  loadIOStats() {
    const { startDate, endDate } = this.data;
    this.setData({
      detailMode: "",
      detailItemType: "",
      detailList: [],
      detailTitle: "",
    });
    api
      .getInventoryIOStats(startDate, endDate)
      .then((ioStats) => this.setData({ ioStats }))
      .catch((e) => {
        if (e.message === "未登录或登录已过期")
          wx.reLaunch({ url: "/pages/login/login" });
        else wx.showToast({ title: e.message || "加载失败", icon: "none" });
      });
  },

  // loadStats() {
  //   Promise.all([api.getInventoryStats(), api.getStatisticsList()])
  //     .then(([stats, list]) => {
  //       let lowStockCount = 0;
  //       let expiryWarningCount = 0;
  //       (stats || []).forEach((item) => {
  //         if (item.isLowStock) lowStockCount++;
  //         if (item.hasExpiryWarning) expiryWarningCount++;
  //       });
  //       this.setData({
  //         stats: stats || [],
  //         list: list || [],
  //         hasWarnings: lowStockCount > 0 || expiryWarningCount > 0,
  //         lowStockCount,
  //         expiryWarningCount,
  //       });
  //     })
  //     .catch((e) => {
  //       if (e.message === "未登录或登录已过期")
  //         wx.reLaunch({ url: "/pages/login/login" });
  //       else wx.showToast({ title: e.message || "加载失败", icon: "none" });
  //     });
  // },

  // 下拉刷新
  onPullDownRefresh() {
    // this.loadStats();
    this.loadIOStats();
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
