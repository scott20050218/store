// pages/inbound/inbound.js
const storage = require("../../utils/storage");
const api = require("../../utils/api");

// 到期日期选项：从后端 config.expiry 解析，逗号分隔，单位为月（如 "1,3,6" 或 [1,3,6]）
function parseExpiryMonths(expiry) {
  if (Array.isArray(expiry)) {
    return expiry
      .map((n) => Number(n))
      .filter((n) => !Number.isNaN(n) && n > 0);
  }
  if (typeof expiry === "string") {
    return expiry
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n) && n > 0);
  }
  return [1, 3, 6];
}

function buildExpiryFromConfig(config) {
  const months = parseExpiryMonths(config && config.expiry);
  const arr = months.length ? months : [1, 3, 6];
  return {
    expiryOptions: arr.map((m) => `${m}个月`),
    expiryMonths: arr,
  };
}

// 到期提醒选项：从后端 config.expiryWarningDays 解析，逗号分隔，单位为天（如 "3,7" 或 [3,7]）
function parseReminderDays(expiryWarningDays) {
  if (Array.isArray(expiryWarningDays)) {
    return expiryWarningDays
      .map((n) => Number(n))
      .filter((n) => !Number.isNaN(n) && n > 0);
  }
  if (typeof expiryWarningDays === "string") {
    return expiryWarningDays
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n) && n > 0);
  }
  if (typeof expiryWarningDays === "number" && expiryWarningDays > 0) {
    return [expiryWarningDays];
  }
  return [3, 7];
}

function buildReminderFromConfig(config) {
  const days = parseReminderDays(config && config.expiryWarningDays);
  const arr = days.length ? days : [3, 7];
  return {
    reminderOptions: arr.map((d) => `${d}天`),
    reminderDays: arr,
  };
}

// 位置选项
const LOCATION_OPTIONS = [
  "请选择",
  "1号架",
  "2号架",
  "3号架",
  "4号架",
  "5号架",
  "6号架",
  "7号架",
];

// 标签颜色
const TAG_COLORS = ["#5ce9db", "#148838", "#DE0012", "#6462cc", "#CCA317"];

// 生成日期时间选择器列数据
function buildDateTimeColumns() {
  const years = [];
  const now = new Date();
  for (let y = now.getFullYear() - 1; y <= now.getFullYear() + 2; y++)
    years.push(String(y));
  const months = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const days = Array.from({ length: 31 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const hours = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0")
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0")
  );
  return [years, months, days, hours, minutes];
}

// 根据年月获取当月天数
function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

Page({
  data: {
    inboundDateTime: "", // 入库时间 YYYY-MM-DD HH:mm:ss
    dateTimeColumns: [],
    dateTimeValue: [0, 0, 0, 0, 0],
    itemTypes: [...storage.ITEM_TYPES, "自定义"],
    typeIndex: 0,
    customType: "",
    showCustomInput: false,
    expiryOptions: ["1个月", "3个月"],
    expiryMonths: [1, 3],
    reminderOptions: ["3天", "7天"],
    reminderDays: [3, 7],
    expiryIndex: 0,
    productionDate: "",
    quantity: "",
    tagColors: TAG_COLORS,
    tagIndex: -1,
    locationOptions: LOCATION_OPTIONS,
    locationIndex: 0,
    photoPath: "",
  },

  onLoad() {
    this.setData({
      dateTimeColumns: buildDateTimeColumns(),
    });
    this.setLocalDateTime();
    api
      .getConfig()
      .then((config) => {
        const types = (config && config.itemTypes) || storage.ITEM_TYPES;
        const list = Array.isArray(types)
          ? types
          : typeof types === "string"
          ? types.split(",").map((s) => s.trim())
          : storage.ITEM_TYPES;
        const expiry = buildExpiryFromConfig(config);
        const reminder = buildReminderFromConfig(config);
        this.setData({
          itemTypes: [...list, "自定义"],
          ...expiry,
          ...reminder,
        });
      })
      .catch(() => {
        this.setData({
          itemTypes: [...storage.ITEM_TYPES, "自定义"],
          expiryOptions: ["1个月", "3个月"],
          expiryMonths: [1, 3],
          reminderOptions: ["3天", "7天"],
          reminderDays: [3, 7],
        });
      });
  },

  onShow() {
    this.setLocalDateTime();
  },

  // 根据当前时间获取选择器索引
  getDateTimePickerValue(d) {
    const cols = buildDateTimeColumns();
    const yearIdx = cols[0].indexOf(String(d.getFullYear()));
    const monthIdx = d.getMonth();
    const dayIdx = d.getDate() - 1;
    const hourIdx = d.getHours();
    const minIdx = d.getMinutes();
    return [
      yearIdx >= 0 ? yearIdx : 0,
      monthIdx,
      Math.min(dayIdx, getDaysInMonth(d.getFullYear(), d.getMonth() + 1) - 1),
      hourIdx,
      minIdx,
    ];
  },

  // 设置手机本地日期时间（年-月-日 时:分:秒）
  setLocalDateTime() {
    const now = new Date();
    this.setData({
      inboundDateTime: storage.formatDateTime(now),
      dateTimeValue: this.getDateTimePickerValue(now),
    });
  },

  // 入库时间选择（多列：年-月-日 时:分）
  onDateTimeChange(e) {
    const val = e.detail.value;
    const cols = this.data.dateTimeColumns;
    const year = cols[0][val[0]];
    const month = cols[1][val[1]];
    const dayMax = getDaysInMonth(Number(year), Number(month));
    const day = cols[2][Math.min(val[2], dayMax - 1)];
    const hour = cols[3][val[3]];
    const min = cols[4][val[4]];
    const dateTimeStr = `${year}-${month}-${day} ${hour}:${min}:00`;
    this.setData({
      inboundDateTime: dateTimeStr,
      dateTimeValue: val,
    });
  },

  // 列滚动时更新天数（2月等）
  onDateTimeColumnChange(e) {
    const { column, value } = e.detail;
    const cols = this.data.dateTimeColumns.map((c) => [...c]);
    const val = [...this.data.dateTimeValue];
    val[column] = value;
    if (column === 0 || column === 1) {
      const year = Number(cols[0][val[0]]);
      const month = Number(cols[1][val[1]]);
      const dayMax = getDaysInMonth(year, month);
      cols[2] = Array.from({ length: dayMax }, (_, i) =>
        String(i + 1).padStart(2, "0")
      );
      if (val[2] >= dayMax) val[2] = dayMax - 1;
      this.setData({
        dateTimeColumns: cols,
        dateTimeValue: val,
      });
    } else {
      this.setData({ dateTimeValue: val });
    }
  },

  // 物品类型选择
  onTypeChange(e) {
    const idx = Number(e.detail.value);
    this.setData({
      typeIndex: idx,
      showCustomInput: idx === this.data.itemTypes.length - 1,
    });
  },

  // 自定义类型输入
  onCustomTypeInput(e) {
    this.setData({ customType: e.detail.value.trim() });
  },

  // 到期日期选择（1个月/3个月）
  onExpiryChange(e) {
    this.setData({ expiryIndex: Number(e.detail.value) });
  },

  // 到期提醒选择（还有几天过期时提醒：3天/7天）
  onReminderChange(e) {
    this.setData({ reminderIndex: Number(e.detail.value) });
  },

  // 生产日期选择（选填）
  onProductionDateChange(e) {
    this.setData({ productionDate: e.detail.value });
  },

  // 数量输入：仅数字、仅正数
  onQuantityInput(e) {
    let val = e.detail.value.replace(/[^\d]/g, "");
    if (val && Number(val) < 0) val = "";
    this.setData({ quantity: val });
  },

  // 标签选择
  onTagSelect(e) {
    const idx = e.currentTarget.dataset.index;
    this.setData({
      tagIndex: this.data.tagIndex === idx ? -1 : idx,
    });
  },

  // 位置选择
  onLocationChange(e) {
    this.setData({ locationIndex: Number(e.detail.value) });
  },

  // 拍照
  onTakePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["camera", "album"],
      camera: "back",
      success: (res) => {
        const tempPath = res.tempFiles[0].tempFilePath;
        this.setData({ photoPath: tempPath });
      },
    });
  },

  // 删除照片
  onRemovePhoto() {
    this.setData({ photoPath: "" });
  },

  // 提交入库
  onSubmit() {
    const {
      inboundDateTime,
      itemTypes,
      typeIndex,
      customType,
      showCustomInput,
      expiryIndex,
      reminderIndex,
      productionDate,
      quantity,
      tagIndex,
      tagColors,
      locationIndex,
      locationOptions,
      photoPath,
    } = this.data;

    if (!inboundDateTime) {
      wx.showToast({ title: "请选择入库时间", icon: "none" });
      return;
    }

    let itemType = itemTypes[typeIndex];
    if (showCustomInput) {
      itemType = customType.trim();
      if (!itemType) {
        wx.showToast({ title: "请输入物品类型", icon: "none" });
        return;
      }
    }

    if (!quantity || Number(quantity) <= 0) {
      wx.showToast({ title: "请输入有效的正数数量", icon: "none" });
      return;
    }

    const numQty = Number(quantity);
    if (!Number.isInteger(numQty) || numQty <= 0) {
      wx.showToast({ title: "数量必须为正整数", icon: "none" });
      return;
    }
    console.log(tagIndex);
    if (tagIndex == -1) {
      wx.showToast({ title: "请选择标签颜色", icon: "none" });
      return;
    }

    const inboundDate = new Date(inboundDateTime.replace(/-/g, "/"));
    const inboundDateStr = inboundDateTime.slice(0, 10); // YYYY-MM-DD
    const expiryMonths = this.data.expiryMonths || [1, 3];
    const months =
      expiryMonths[expiryIndex] != null
        ? expiryMonths[expiryIndex]
        : expiryMonths[0];
    const expiryDate = new Date(inboundDate);
    expiryDate.setMonth(expiryDate.getMonth() + months);
    const expiryDateStr = storage.formatDate(expiryDate);

    const body = {
      itemType,
      quantity: numQty,
      expiryDate: expiryDateStr,
      inboundDate: inboundDateStr,
      productionDate: productionDate || "",
      tag: tagIndex >= 0 ? tagColors[tagIndex] : "",
      location: locationIndex > 0 ? locationOptions[locationIndex] : "",
      photo: "",
    };

    const doPost = (photoUrl) => {
      body.photo = photoUrl || "";
      api
        .postInbound(body)
        .then((res) => {
          if (res.success) {
            wx.showToast({
              title: "入库成功",
              icon: "success",
              duration: 1500,
            });
            api
              .getConfig()
              .then((config) => {
                const types =
                  (config && config.itemTypes) || storage.ITEM_TYPES;
                const list = Array.isArray(types)
                  ? types
                  : typeof types === "string"
                  ? types.split(",").map((s) => s.trim())
                  : storage.ITEM_TYPES;
                const expiry = buildExpiryFromConfig(config);
                const reminder = buildReminderFromConfig(config);
                this.setData({
                  itemTypes: [...list, "自定义"],
                  ...expiry,
                  ...reminder,
                });
              })
              .catch(() => {});
            setTimeout(() => this.resetForm(), 1500);
            wx.switchTab({ url: "/pages/index/index" });
          } else {
            wx.showToast({ title: res.message || "入库失败", icon: "none" });
          }
        })
        .catch((e) => {
          if (e.message === "未登录或登录已过期")
            wx.reLaunch({ url: "/pages/login/login" });
          else wx.showToast({ title: e.message || "入库失败", icon: "none" });
        });
    };

    if (photoPath) {
      wx.showLoading({ title: "上传中..." });
      api
        .uploadImage(photoPath)
        .then((url) => {
          wx.hideLoading();
          doPost(url);
        })
        .catch((e) => {
          wx.hideLoading();
          wx.showToast({ title: e.message || "图片上传失败", icon: "none" });
        });
    } else {
      doPost("");
    }
  },

  resetForm() {
    this.setLocalDateTime();
    const now = new Date();
    this.setData({
      dateTimeValue: this.getDateTimePickerValue(now),
      typeIndex: 0,
      showCustomInput: false,
      customType: "",
      expiryIndex: 0,
      reminderIndex: 1,
      productionDate: "",
      quantity: "",
      tagIndex: -1,
      locationIndex: 0,
      photoPath: "",
    });
  },
});
