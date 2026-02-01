// pages/profile/profile.js
const api = require("../../utils/api");

Page({
  data: {
    name: "",
    phone: "",
    newPasscode: "",
    confirmPasscode: "",
    showPasscodeForm: false,
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
  },

  loadUserInfo() {
    api
      .getUserInfo()
      .then((userInfo) => {
        this.setData({
          name: userInfo.name || "",
          phone: userInfo.phone || "",
        });
      })
      .catch((e) => {
        if (e.message === "未登录或登录已过期") wx.reLaunch({ url: "/pages/login/login" });
      });
  },

  togglePasscodeForm() {
    this.setData({ showPasscodeForm: !this.data.showPasscodeForm });
  },

  onNewPasscodeInput(e) {
    this.setData({ newPasscode: e.detail.value });
  },

  onConfirmPasscodeInput(e) {
    this.setData({ confirmPasscode: e.detail.value });
  },

  savePasscode() {
    const { newPasscode, confirmPasscode } = this.data;
    if (!newPasscode || !confirmPasscode) {
      wx.showToast({ title: "请输入新密码并确认", icon: "none" });
      return;
    }
    if (newPasscode !== confirmPasscode) {
      wx.showToast({ title: "两次输入的密码不一致", icon: "none" });
      return;
    }
    api
      .putPasscode(newPasscode)
      .then((res) => {
        if (res.success) {
          wx.showToast({ title: "密码修改成功", icon: "success" });
          this.setData({ newPasscode: "", confirmPasscode: "", showPasscodeForm: false });
        } else {
          wx.showToast({ title: res.message || "修改失败", icon: "none" });
        }
      })
      .catch((e) => {
        if (e.message === "未登录或登录已过期") wx.reLaunch({ url: "/pages/login/login" });
        else wx.showToast({ title: e.message || "修改失败", icon: "none" });
      });
  },

  goToMyInbound() {
    wx.navigateTo({ url: "/pages/my-inbound/my-inbound" });
  },

  goToMyOutbound() {
    wx.navigateTo({ url: "/pages/my-outbound/my-outbound" });
  },

  clearData() {
    wx.showModal({
      title: "确认退出",
      content: "确定要退出登录吗？",
      confirmColor: "#f27d51",
      success: (res) => {
        if (res.confirm) {
          api.clearToken();
          wx.reLaunch({ url: "/pages/login/login" });
        }
      },
    });
  },
});
