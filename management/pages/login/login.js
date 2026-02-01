// pages/login/login.js - 使用前必须注册；每次登录/注册均通过 wx.login 获得 code
const api = require("../../utils/api");

Page({
  data: {
    mode: "login", // 'login' | 'register'
    phone: "",
    passcode: "",
    loading: false,
  },

  onLoad() {
    if (api.getToken()) {
      wx.switchTab({ url: "/pages/index/index" });
    }
  },

  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    if (mode) this.setData({ mode, phone: "", passcode: "" });
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value.trim() });
  },

  // 微信授权获取手机号，成功后填入注册框
  onGetPhoneNumber(e) {
    if (e.detail.errMsg && e.detail.errMsg.indexOf("ok") !== -1 && e.detail.code) {
      api
        .getPhoneNumber(e.detail.code)
        .then((phone) => {
          this.setData({ phone: phone || "" });
          if (phone) wx.showToast({ title: "手机号已填入", icon: "success" });
        })
        .catch((err) => wx.showToast({ title: err.message || "获取失败", icon: "none" }));
    } else if (e.detail.errMsg) {
      wx.showToast({ title: "需要授权才能获取手机号", icon: "none" });
    }
  },

  onPasscodeInput(e) {
    this.setData({ passcode: e.detail.value });
  },

  // 登录：每次使用 wx.login 获得 code
  onLogin() {
    const { passcode } = this.data;
    if (!passcode) {
      wx.showToast({ title: "请输入密码", icon: "none" });
      return;
    }
    this.setData({ loading: true });
    wx.login({
      success: (res) => {
        const code = res.code;
        if (!code) {
          this.setData({ loading: false });
          wx.showToast({ title: "微信登录失败，请重试", icon: "none", duration: 5000 });
          return;
        }
        api
          .loginWithCode(code, passcode)
          .then(() => {
            wx.showToast({ title: "登录成功", icon: "success" });
            wx.switchTab({ url: "/pages/index/index" });
          })
          .catch((e) => {
            wx.showToast({ title: e.message || "登录失败", icon: "none", duration: 5000 });
          })
          .finally(() => this.setData({ loading: false }));
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({ title: "微信登录失败，请重试", icon: "none", duration: 5000 });
      },
    });
  },

  // 注册：wx.login 获得 code + 手机号 + 密码
  onRegister() {
    const { phone, passcode } = this.data;
    if (!phone) {
      wx.showToast({ title: "请输入手机号", icon: "none" });
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: "请输入正确手机号", icon: "none" });
      return;
    }
    if (!passcode) {
      wx.showToast({ title: "请设置密码", icon: "none" });
      return;
    }
    this.setData({ loading: true });
    wx.login({
      success: (res) => {
        const code = res.code;
        if (!code) {
          this.setData({ loading: false });
          wx.showToast({ title: "微信登录失败，请重试", icon: "none", duration: 5000 });
          return;
        }
        api
          .registerWithCode(phone, code, passcode)
          .then(() => {
            wx.showToast({ title: "注册成功", icon: "success" });
            wx.switchTab({ url: "/pages/index/index" });
          })
          .catch((e) => {
            wx.showToast({ title: e.message || "注册失败", icon: "none", duration: 5000 });
          })
          .finally(() => this.setData({ loading: false }));
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({ title: "微信登录失败，请重试", icon: "none", duration: 5000 });
      },
    });
  },
});
