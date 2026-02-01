// pages/profile/profile.js
const storage = require("../../utils/storage");

Page({
  data: {
    name: "",
    phone: "",
    isEditing: false,
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = storage.getUserInfo();
    this.setData({
      name: userInfo.name || "",
      phone: userInfo.phone || "",
    });
  },

  // 切换编辑模式
  toggleEdit() {
    if (this.data.isEditing) {
      // 保存信息
      this.saveUserInfo();
    }
    this.setData({
      isEditing: !this.data.isEditing,
    });
  },

  // 名称输入
  onNameInput(e) {
    this.setData({
      name: e.detail.value,
    });
  },

  // 手机号输入
  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value,
    });
  },

  // 保存用户信息
  saveUserInfo() {
    const { name, phone } = this.data;

    // 验证手机号格式
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({
        title: "请输入正确的手机号",
        icon: "none",
      });
      return false;
    }

    const success = storage.saveUserInfo({ name, phone });
    if (success) {
      wx.showToast({
        title: "保存成功",
        icon: "success",
      });
      return true;
    } else {
      wx.showToast({
        title: "保存失败",
        icon: "error",
      });
      return false;
    }
  },

  // 清除本地数据
  clearData() {
    wx.showModal({
      title: "确认清除",
      content: "确定要清除所有本地数据吗？此操作不可恢复！",
      confirmColor: "#f27d51",
      success: (res) => {
        if (res.confirm) {
          try {
            wx.clearStorageSync();
            wx.showToast({
              title: "数据已清除",
              icon: "success",
            });
            this.setData({
              name: "",
              phone: "",
            });
          } catch (e) {
            wx.showToast({
              title: "清除失败",
              icon: "error",
            });
          }
        }
      },
    });
  },
});
