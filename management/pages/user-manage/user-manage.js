// pages/user-manage/user-manage.js
const api = require("../../utils/api");

const STATUS_OPTIONS = [
  { value: "正常", label: "正常" },
  { value: "冻结", label: "冻结" },
  { value: "删除", label: "删除" },
  { value: "已注册", label: "已注册" },
];

Page({
  data: {
    list: [],
    loading: false,
    showForm: false,
    editingId: null,
    formName: "",
    formPhone: "",
    statusIndex: 0,
    statusList: STATUS_OPTIONS,
  },

  onLoad() {
    this.loadList();
  },

  onShow() {
    this.loadList();
  },

  loadList() {
    this.setData({ loading: true });
    api
      .getAdminUserList()
      .then((items) => {
        const list = (items || []).map((u) => ({
          ...u,
          statusClass: { 正常: "normal", 已注册: "registered", 冻结: "frozen", 删除: "deleted" }[u.status] || "normal",
        }));
        this.setData({ list, loading: false });
      })
      .catch((e) => {
        this.setData({ loading: false });
        if (e.message === "未登录或登录已过期") wx.reLaunch({ url: "/pages/login/login" });
        else if (String(e.message).includes("403")) wx.showToast({ title: "无权限", icon: "none" });
        else wx.showToast({ title: e.message || "加载失败", icon: "none" });
      });
  },

  onAddTap() {
    this.setData({
      showForm: true,
      editingId: null,
      formName: "",
      formPhone: "",
      statusIndex: 0,
    });
  },

  onEditTap(e) {
    const item = e.currentTarget.dataset.item;
    const statusIndex = STATUS_OPTIONS.findIndex((s) => s.value === item.status);
    this.setData({
      showForm: true,
      editingId: item.id,
      formName: item.name || "",
      formPhone: item.phone || "",
      statusIndex: statusIndex >= 0 ? statusIndex : 0,
    });
  },

  onFormNameInput(e) {
    this.setData({ formName: e.detail.value });
  },

  onFormPhoneInput(e) {
    this.setData({ formPhone: e.detail.value });
  },

  onStatusChange(e) {
    this.setData({ statusIndex: parseInt(e.detail.value, 10) });
  },

  onFormCancel() {
    this.setData({ showForm: false });
  },

  onFormSubmit() {
    const { formName, formPhone, statusIndex, editingId } = this.data;
    const status = STATUS_OPTIONS[statusIndex].value;
    if (!formName || !formPhone) {
      wx.showToast({ title: "请输入姓名和手机号", icon: "none" });
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(formPhone)) {
      wx.showToast({ title: "手机号格式错误", icon: "none" });
      return;
    }
    if (editingId) {
      api
        .putAdminUser(editingId, { name: formName, phone: formPhone, status })
        .then((res) => {
          if (res.success) {
            wx.showToast({ title: "保存成功", icon: "success" });
            this.setData({ showForm: false });
            this.loadList();
          } else {
            wx.showToast({ title: res.message || "保存失败", icon: "none" });
          }
        })
        .catch((e) => {
          wx.showToast({ title: e.message || "保存失败", icon: "none" });
        });
    } else {
      api
        .postAdminUser({ name: formName, phone: formPhone, status })
        .then((res) => {
          if (res.success) {
            wx.showToast({ title: "新增成功", icon: "success" });
            this.setData({ showForm: false });
            this.loadList();
          } else {
            wx.showToast({ title: res.message || "新增失败", icon: "none" });
          }
        })
        .catch((e) => {
          wx.showToast({ title: e.message || "新增失败", icon: "none" });
        });
    }
  },
});
