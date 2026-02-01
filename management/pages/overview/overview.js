// pages/overview/overview.js - 物品总览：物品+标签+位置+数量+入库时间+到期日期，临近到期告警，有照片可点击查看
const api = require("../../utils/api");

function toPhotoUrl(photo) {
  if (!photo) return "";
  if (photo.startsWith("http")) return photo;
  const base = api.BASE_URL || "";
  return base + (photo.startsWith("/") ? photo : "/" + photo);
}

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
    api.getInventoryOverview()
      .then((rawList) => {
        const list = (rawList || []).map((item) => ({
          ...item,
          photoUrl: toPhotoUrl(item.photo),
        }));
        this.setData({ list });
      })
      .catch((e) => {
        if (e.message === "未登录或登录已过期") wx.reLaunch({ url: "/pages/login/login" });
        else wx.showToast({ title: e.message || "加载失败", icon: "none" });
      });
  },

  onPullDownRefresh() {
    this.loadList();
    wx.stopPullDownRefresh();
  },

  /** 点击照片链接，预览图片 */
  onPreviewPhoto(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    wx.previewImage({ current: url, urls: [url] });
  },
});
