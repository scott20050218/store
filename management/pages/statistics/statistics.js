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
    ioStats: [],
    startDate: getMonthStart(),
    endDate: getToday(),
    detailMode: "",
    detailItemType: "",
    detailList: [],
    detailTitle: "",
    scrollIntoView: "",
  },

  onLoad() {
    this.loadIOStats();
  },

  onShow() {
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

  onPullDownRefresh() {
    this.loadIOStats();
    wx.stopPullDownRefresh();
  },
});
