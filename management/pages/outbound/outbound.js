// pages/outbound/outbound.js
const storage = require("../../utils/storage");
const api = require("../../utils/api");

Page({
  data: {
    list: [],
    outboundItem: null,
    outboundQuantity: "",
    showQuantityModal: false,
  },

  onLoad() {
    this.loadList();
  },

  onShow() {
    this.loadList();
  },

  loadList() {
    api
      .getOutboundList()
      .then((list) => {
        const items = (list || []).map((it) => ({
          ...it,
          displayUnit: it.unit || "个",
        }));
        this.setData({ list: items });
      })
      .catch((e) => {
        if (e.message === "未登录或登录已过期")
          wx.reLaunch({ url: "/pages/login/login" });
        else wx.showToast({ title: e.message || "加载失败", icon: "none" });
      });
  },

  // 点击出库按钮（左滑后露出的按钮）
  onOutboundTap(e) {
    const index = e.currentTarget.dataset.index;
    const list = this.data.list;
    const item =
      list != null && typeof index !== "undefined" ? list[index] : null;
    if (!item) return;
    const outboundItem = {
      id: item.id,
      itemType: item.itemType,
      tag: item.tag,
      quantity: item.quantity,
      unit: item.unit || "",
      displayUnit: item.displayUnit || item.unit || "个",
      location: item.location || "",
    };
    this.setData({
      outboundItem,
      outboundQuantity: "",
      showQuantityModal: true,
    });
  },

  // 关闭数量弹窗
  onCloseQuantityModal() {
    this.setData({
      showQuantityModal: false,
      outboundItem: null,
      outboundQuantity: "",
    });
  },

  // 出库数量输入
  onQuantityInput(e) {
    let val = e.detail.value.replace(/[^\d]/g, "");
    this.setData({ outboundQuantity: val });
  },

  // 确认出库
  onConfirmOutbound() {
    const { outboundItem, outboundQuantity } = this.data;
    if (!outboundItem) return;
    const qty = Number(outboundQuantity);
    if (!outboundQuantity || isNaN(qty) || qty <= 0) {
      wx.showToast({ title: "请输入有效数量", icon: "none" });
      return;
    }
    if (qty > outboundItem.quantity) {
      wx.showToast({
        title: `最多可出库 ${outboundItem.quantity}`,
        icon: "none",
      });
      return;
    }
    const outboundDate = storage.formatDate(new Date());
    api
      .postOutbound({
        id: outboundItem.id,
        itemType: outboundItem.itemType,
        quantity: qty,
        outboundDate,
      })
      .then((res) => {
        if (res.success) {
          wx.showToast({
            title: "出库成功",
            icon: "success",
            duration: 2000,
          });
          this.setData({
            showQuantityModal: false,
            outboundItem: null,
            outboundQuantity: "",
          });
          this.loadList();
          // 等待5秒后跳转到首页
          setTimeout(() => {
            wx.switchTab({ url: "/pages/index/index" });
          }, 1500);
        } else {
          wx.showToast({ title: res.message || "出库失败", icon: "none" });
        }
      })
      .catch((e) => {
        if (e.message === "未登录或登录已过期")
          wx.reLaunch({ url: "/pages/login/login" });
        else wx.showToast({ title: e.message || "出库失败", icon: "none" });
      });
  },
});
