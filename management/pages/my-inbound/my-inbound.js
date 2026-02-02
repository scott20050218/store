// pages/my-inbound/my-inbound.js
const api = require("../../utils/api");

Page({
  data: {
    list: [],
    page: 1,
    limit: 5,
    hasMore: true,
    loading: false,
  },

  onLoad() {
    this.loadMore();
  },

  loadMore() {
    if (this.data.loading || !this.data.hasMore) return;
    this.setData({ loading: true });
    api
      .getMyInbound(this.data.page, this.data.limit)
      .then(({ items, hasMore }) => {
        const mapped = (items || []).map((it) => ({
          ...it,
          displayUnit: it.unit || "个",
        }));
        const list = this.data.page === 1 ? mapped : [...this.data.list, ...mapped];
        this.setData({
          list,
          page: this.data.page + 1,
          hasMore,
          loading: false,
        });
      })
      .catch((e) => {
        this.setData({ loading: false });
        if (e.message === "未登录或登录已过期") wx.reLaunch({ url: "/pages/login/login" });
        else wx.showToast({ title: e.message || "加载失败", icon: "none" });
      });
  },

  onLoadMore() {
    this.loadMore();
  },
});
