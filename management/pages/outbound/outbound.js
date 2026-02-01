// pages/outbound/outbound.js
const storage = require("../../utils/storage");

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
    const list = storage.getOutboundItemList();
    this.setData({ list });
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
    const date = storage.formatDate(new Date());
    const result = storage.addOutbound(outboundItem.itemType, qty, date);
    if (result.success) {
      wx.showToast({ title: "出库成功", icon: "success" });
      // 关闭弹窗并刷新出库列表
      this.setData({
        showQuantityModal: false,
        outboundItem: null,
        outboundQuantity: "",
        list: storage.getOutboundItemList(),
      });
    } else {
      wx.showToast({ title: result.message, icon: "none" });
    }
  },
});
