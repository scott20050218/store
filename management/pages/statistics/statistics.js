// pages/statistics/statistics.js
const api = require("../../utils/api");

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 检查是否即将过期（7天内）
function isExpiringSoon(expiryDate) {
  if (!expiryDate) return false;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 7 && diffDays >= 0;
}

// 检查是否已过期
function isExpired(expiryDate) {
  if (!expiryDate) return false;
  const today = new Date();
  const expiry = new Date(expiryDate);
  return expiry < today;
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
    loading: false,
    detailLoading: false,
    refreshing: false,
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
      this.loadIOStats(),
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
      detailLoading: true,
      detailList: [],
    });
    api
      .getInventoryIODetails(itemType, startDate, endDate, detailType)
      .then((res) => {
        const raw = Array.isArray(res) ? res : [];
        const list = raw.map((item, i) => ({
          ...item,
          displayUnit: item.unit || "个",
          isExpiring: isExpiringSoon(item.expiryDate),
          isExpired: isExpired(item.expiryDate),
          _key: `${item.date || ""}-${item.type || ""}-${i}`,
        }));
        this.setData(
          {
            detailList: list,
            detailLoading: false,
            scrollIntoView: "detailSection",
          },
          () => {
            setTimeout(() => this.setData({ scrollIntoView: "" }), 300);
          },
        );
      })
      .catch((err) => {
        this.setData({ detailLoading: false });
        wx.showToast({
          title: err.message || "加载失败，设备较慢请重试",
          icon: "none",
          duration: 3000,
        });
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
      loading: true,
      detailMode: "",
      detailItemType: "",
      detailList: [],
      detailTitle: "",
    });
    return api
      .getInventoryIOStats(startDate, endDate)
      .then((res) => {
        const raw = Array.isArray(res) ? res : [];
        const ioStats = raw.map((item, i) => ({
          ...item,
          _key: item.itemType ? `${item.itemType}-${i}` : `row-${i}`,
        }));
        this.setData({ ioStats, loading: false });
        console.log("this.data:", this.data);
      })
      .catch((e) => {
        this.setData({ loading: false });
        if (e.message === "未登录或登录已过期")
          wx.reLaunch({ url: "/pages/login/login" });
        else
          wx.showToast({
            title: (e.message || "加载失败") + "，设备较慢可下拉重试",
            icon: "none",
            duration: 3000,
          });
      });
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true });
    const done = () => {
      this.setData({ refreshing: false });
      wx.stopPullDownRefresh();
    };
    this.loadIOStats().then(done).catch(done);
  },
});
