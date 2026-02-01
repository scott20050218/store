// pages/overview/overview.js
const storage = require("../../utils/storage");

Page({
  data: {
    list: [],
  },

  onLoad() {
    this.loadList();
  },

  onShow() {
    this.loadList();
  },

  loadList() {
    const list = storage.getItemOverviewList();
    this.setData({ list });
  },

  onPullDownRefresh() {
    this.loadList();
    wx.stopPullDownRefresh();
  },
});
