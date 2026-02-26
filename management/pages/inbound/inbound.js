// pages/inbound/inbound.js
const storage = require("../../utils/storage");
const api = require("../../utils/api");

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
const TAG_COLORS = ["#092D88", "#148838", "#DE0012", "#3A0A75", "#CCA317"];

// 生成日期时间选择器列数据
function buildDateTimeColumns() {
  const years = [];
  const now = new Date();
  for (let y = now.getFullYear() - 1; y <= now.getFullYear() + 2; y++)
    years.push(String(y));
  const months = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );
  const days = Array.from({ length: 31 }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );
  const hours = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0"),
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0"),
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
    units: [...(storage.UNIT || ["袋", "瓶", "箱", "斤", "个"]), "自定义"],
    unitIndex: 0,
    customUnit: "",
    showCustomUnitInput: false,
    reminderOptions: ["3天", "7天"],
    reminderDays: [3, 7],
    productionDate: "",
    expiryDate: "",
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
        const reminder = buildReminderFromConfig(config);
        const unitList = (config && config.unit) ||
          storage.UNIT || ["袋", "瓶", "箱", "斤", "个"];
        const unitArr = Array.isArray(unitList)
          ? unitList
          : typeof unitList === "string"
            ? unitList.split(",").map((s) => s.trim())
            : storage.UNIT || ["袋", "瓶", "箱", "斤", "个"];
        this.setData({
          itemTypes: [...list, "自定义"],
          units: [...unitArr, "自定义"],
          ...reminder,
        });
      })
      .catch(() => {
        this.setData({
          itemTypes: [...storage.ITEM_TYPES, "自定义"],
          units: [
            ...(storage.UNIT || ["袋", "瓶", "箱", "斤", "个"]),
            "自定义",
          ],
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
        String(i + 1).padStart(2, "0"),
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

  // 单位选择
  onUnitChange(e) {
    const idx = Number(e.detail.value);
    this.setData({
      unitIndex: idx,
      showCustomUnitInput: idx === this.data.units.length - 1,
    });
  },

  // 自定义单位输入
  onCustomUnitInput(e) {
    this.setData({ customUnit: e.detail.value.trim() });
  },

  // 到期日期选择（日期选择器）
  onExpiryDateChange(e) {
    this.setData({ expiryDate: e.detail.value });
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

  // 拍照：压缩后仅存 path，提交时再上传
  onTakePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["camera", "album"],
      camera: "back",
      sizeType: ["compressed"],
      success: (res) => {
        const tempPath = res.tempFiles[0].tempFilePath;
        wx.compressImage({
          src: tempPath,
          quality: 20,
          success: (r) => this.setData({ photoPath: r.tempFilePath }),
          fail: () => this.setData({ photoPath: tempPath }),
        });
      },
    });
  },

  // 删除照片
  onRemovePhoto() {
    this.setData({ photoPath: "" });
  },

  /** 获取入库用的图片 URL，失败时弹窗。返回 Promise<string> 成功时为 url，失败且用户选「不带图片」为 ""，用户取消为 null */
  getPhotoUrlForSubmit() {
    const { photoPath } = this.data;
    if (!photoPath) return Promise.resolve("");

    const loadStart = Date.now();
    wx.showLoading({ title: "上传中...", mask: true });

    return api
      .uploadImage(photoPath)
      .then((url) => {
        wx.hideLoading();
        // wx.showToast({ title: "url:" + url, icon: "none" });
        // console.log("getPhotoUrlForSubmit url:", url);
        return url;
      })
      .catch((e) => {
        wx.hideLoading();
        wx.showToast({
          title: "" + e,
          icon: "none",
        });
        if (e.message === "未登录或登录已过期")
          wx.reLaunch({ url: "/pages/login/login" });
        return null;
      });
  },

  // 提交入库
  async onSubmit() {
    // 1. 从 data 取出表单字段
    const {
      inboundDateTime,
      itemTypes,
      typeIndex,
      customType,
      showCustomInput,
      units,
      unitIndex,
      customUnit,
      showCustomUnitInput,
      reminderIndex,
      reminderDays,
      productionDate,
      expiryDate,
      quantity,
      tagIndex,
      tagColors,
      locationIndex,
      locationOptions,
    } = this.data;

    // 2. 校验必填项
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

    let unit = units[unitIndex];
    if (showCustomUnitInput) {
      unit = customUnit.trim();
      if (!unit) {
        wx.showToast({ title: "请输入单位", icon: "none" });
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
    if (tagIndex == -1) {
      wx.showToast({ title: "请选择标签", icon: "none" });
      return;
    }

    if (locationIndex == 0) {
      wx.showToast({ title: "请选择位置", icon: "none" });
      return;
    }

    // 3. 构建请求体
    const inboundDateStr = inboundDateTime.slice(0, 10); // YYYY-MM-DD
    if (!expiryDate) {
      wx.showToast({ title: "请选择到期日期", icon: "none" });
      return;
    }
    const expiryDateStr = expiryDate;

    const expiryWarningDays =
      reminderDays && reminderDays[reminderIndex] != null
        ? reminderDays[reminderIndex]
        : null;
    const body = {
      itemType,
      unit: unit || "",
      quantity: numQty,
      expiryDate: expiryDateStr,
      inboundDate: inboundDateStr,
      productionDate: productionDate || "",
      expiryWarningDays,
      tag: tagIndex >= 0 ? String(tagIndex + 1) : "",
      location: locationIndex > 0 ? locationOptions[locationIndex] : "",
      photo: "",
    };

    const doPost = (photoUrl) => {
      // console.log("doPost photoUrl:", photoUrl);
      body.photo = photoUrl || "";
      api
        .postInbound(body)
        .then((res) => {
          if (res.success) {
            wx.showToast({
              title: "入库成功",
              icon: "success",
              duration: 2000,
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
                const reminder = buildReminderFromConfig(config);
                const unitList = (config && config.unit) ||
                  storage.UNIT || ["袋", "瓶", "箱", "斤", "个"];
                const unitArr = Array.isArray(unitList)
                  ? unitList
                  : typeof unitList === "string"
                    ? unitList.split(",").map((s) => s.trim())
                    : storage.UNIT || ["袋", "瓶", "箱", "斤", "个"];
                this.setData({
                  itemTypes: [...list, "自定义"],
                  units: [...unitArr, "自定义"],
                  ...reminder,
                });
              })
              .catch(() => {});
            setTimeout(() => this.resetForm(), 10000);
            // 等待5秒后跳转到首页
            setTimeout(() => {
              wx.switchTab({ url: "/pages/index/index" });
            }, 1500);
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

    // 5. 获取图片 URL（有图则上传，失败可选不带图入库），用户取消则返回
    const photoUrl = await this.getPhotoUrlForSubmit();
    // wx.showToast("photoUrl:", photoUrl);
    // wx.showToast({
    //   title: `photoUrl: ${photoUrl}`,
    //   icon: "none", // 不显示图标，只显示文字
    //   duration: 10000, // 10秒 = 10000毫秒
    //   mask: true, // 防止触摸穿透（可选）
    // });
    // console.log("photoUrl:", photoUrl);
    // if (photoUrl === null) return;
    doPost(photoUrl);
  },

  resetForm() {
    this.setLocalDateTime();
    const now = new Date();
    this.setData({
      dateTimeValue: this.getDateTimePickerValue(now),
      typeIndex: 0,
      showCustomInput: false,
      customType: "",
      unitIndex: 0,
      showCustomUnitInput: false,
      customUnit: "",
      reminderIndex: 1,
      productionDate: "",
      expiryDate: "",
      quantity: "",
      tagIndex: -1,
      locationIndex: 0,
      photoPath: "",
    });
  },
});
