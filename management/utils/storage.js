// storage.js - 仓库管理存储工具函数

const INVENTORY_KEY = "inventory";
const USER_INFO_KEY = "userInfo";
const LOW_STOCK_THRESHOLD = 10; // 低库存阈值
const EXPIRY_WARNING_DAYS = 7; // 过期预警天数

// 物品类型列表
const ITEM_TYPES = ["大米", "油", "肉", "鸡蛋"];

/**
 * 获取库存数据
 * @returns {Object} 库存数据对象
 */
function getInventory() {
  try {
    const inventory = wx.getStorageSync(INVENTORY_KEY);
    if (!inventory) {
      return {};
    }
    return inventory;
  } catch (e) {
    console.error("获取库存数据失败:", e);
    return {};
  }
}

/**
 * 保存库存数据
 * @param {Object} inventory 库存数据
 */
function saveInventory(inventory) {
  try {
    wx.setStorageSync(INVENTORY_KEY, inventory);
    return true;
  } catch (e) {
    console.error("保存库存数据失败:", e);
    return false;
  }
}

/**
 * 入库操作
 * @param {Object} params 入库参数
 * @param {String} params.itemType 物品类型
 * @param {Number} params.quantity 数量
 * @param {String} params.expiryDate 过期日期 (YYYY-MM-DD)
 * @param {String} params.inboundDate 入库日期 (YYYY-MM-DD)
 * @param {Number} [params.reminderDays] 到期提醒天数（还有几天过期时提醒，如 3 或 7）
 * @param {String} [params.productionDate] 生产日期 (选填)
 * @param {String} [params.tag] 标签颜色
 * @param {String} [params.location] 位置
 * @param {String} [params.photo] 拍照图片路径
 * @returns {Boolean} 是否成功
 */
function addInbound(params) {
  try {
    const {
      itemType,
      quantity,
      expiryDate,
      inboundDate,
      reminderDays,
      productionDate,
      tag,
      location,
      photo,
    } = params;
    const inventory = getInventory();
    if (!inventory[itemType]) {
      inventory[itemType] = [];
    }

    const record = {
      id: Date.now().toString(),
      quantity: Number(quantity),
      expiryDate: expiryDate,
      inboundDate: inboundDate,
      reminderDays: reminderDays != null ? Number(reminderDays) : undefined,
      productionDate: productionDate || "",
      tag: tag || "",
      location: location || "",
      photo: photo || "",
      createTime: new Date().toISOString(),
    };

    inventory[itemType].push(record);
    return saveInventory(inventory);
  } catch (e) {
    console.error("入库操作失败:", e);
    return false;
  }
}

/**
 * 出库操作 (FIFO - 先进先出)
 * @param {String} itemType 物品类型
 * @param {Number} quantity 数量
 * @param {String} outboundDate 出库日期
 * @returns {Object} { success: Boolean, message: String }
 */
function addOutbound(itemType, quantity, outboundDate) {
  try {
    const inventory = getInventory();
    if (!inventory[itemType] || inventory[itemType].length === 0) {
      return { success: false, message: "该物品库存为空" };
    }

    // 计算当前库存总量
    const totalStock = inventory[itemType].reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    if (totalStock < quantity) {
      return { success: false, message: `库存不足，当前库存: ${totalStock}` };
    }

    // FIFO 出库
    let remaining = Number(quantity);
    while (remaining > 0 && inventory[itemType].length > 0) {
      const firstItem = inventory[itemType][0];
      if (firstItem.quantity <= remaining) {
        remaining -= firstItem.quantity;
        inventory[itemType].shift();
      } else {
        firstItem.quantity -= remaining;
        remaining = 0;
      }
    }

    saveInventory(inventory);
    return { success: true, message: "出库成功" };
  } catch (e) {
    console.error("出库操作失败:", e);
    return { success: false, message: "出库操作失败" };
  }
}

/**
 * 获取库存统计信息
 * @returns {Array} 库存统计列表
 */
function getInventoryStats() {
  const inventory = getInventory();
  const today = new Date();
  const stats = [];
  const allTypes = [...new Set([...ITEM_TYPES, ...Object.keys(inventory)])];

  allTypes.forEach((type) => {
    const items = inventory[type] || [];
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    // 检查是否有即将过期的物品
    let hasExpiryWarning = false;
    let nearestExpiryDate = null;
    let expiryItems = [];

    items.forEach((item) => {
      if (item.expiryDate) {
        const expiryDate = new Date(item.expiryDate);
        const daysUntilExpiry = Math.ceil(
          (expiryDate - today) / (1000 * 60 * 60 * 24)
        );
        const reminderDays =
          item.reminderDays != null ? item.reminderDays : EXPIRY_WARNING_DAYS;

        if (daysUntilExpiry <= reminderDays) {
          hasExpiryWarning = true;
          expiryItems.push({
            ...item,
            daysUntilExpiry,
          });
        }

        if (!nearestExpiryDate || expiryDate < new Date(nearestExpiryDate)) {
          nearestExpiryDate = item.expiryDate;
        }
      }
    });

    stats.push({
      type: type,
      totalQuantity: totalQuantity,
      isLowStock: totalQuantity > 0 && totalQuantity < LOW_STOCK_THRESHOLD,
      isEmpty: totalQuantity === 0,
      hasExpiryWarning: hasExpiryWarning,
      expiryItems: expiryItems,
      nearestExpiryDate: nearestExpiryDate,
      itemCount: items.length,
    });
  });

  return stats;
}

/**
 * 获取所有物品类型（预设+库存中已有的）
 */
function getAllItemTypes() {
  const inventory = getInventory();
  const types = [
    ...new Set([
      ...ITEM_TYPES,
      ...Object.keys(inventory).filter((k) => inventory[k]?.length > 0),
    ]),
  ];
  return types;
}

/**
 * 获取某种物品的当前库存量
 * @param {String} itemType 物品类型
 * @returns {Number} 库存数量
 */
function getStockByType(itemType) {
  const inventory = getInventory();
  const items = inventory[itemType] || [];
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * 获取物品总览列表（每条记录含剩余天数、进度条比例）
 * @returns {Array<{id, itemType, quantity, expiryDate, daysRemaining, progressPercent}>}
 */
function getItemOverviewList() {
  const inventory = getInventory();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const list = [];
  Object.keys(inventory).forEach((itemType) => {
    const items = inventory[itemType] || [];
    items.forEach((record) => {
      const expiryDate = record.expiryDate
        ? new Date(record.expiryDate.replace(/-/g, "/"))
        : null;
      const inboundDate = record.inboundDate
        ? new Date(record.inboundDate.replace(/-/g, "/"))
        : null;
      if (!expiryDate) return;
      expiryDate.setHours(0, 0, 0, 0);
      const daysRemaining = Math.ceil(
        (expiryDate - today) / (1000 * 60 * 60 * 24)
      );
      const totalShelfDays = inboundDate
        ? Math.max(
            1,
            Math.ceil((expiryDate - inboundDate) / (1000 * 60 * 60 * 24))
          )
        : 365;
      const progressPercent = Math.max(
        0,
        Math.min(100, (daysRemaining / totalShelfDays) * 100)
      );
      list.push({
        id: record.id,
        itemType,
        quantity: record.quantity,
        expiryDate: record.expiryDate,
        daysRemaining,
        progressPercent,
      });
    });
  });
  list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  return list;
}

/**
 * 获取库存统计列表（名称+货架+标签+入库时间+到期时间+数量，按物品名称排序）
 * 若剩余天数小于该条记录的到期提醒天数则标记 expiryWarning
 * @returns {Array<{id, itemType, location, tag, inboundDate, expiryDate, quantity, expiryWarning}>}
 */
function getStatisticsItemList() {
  const inventory = getInventory();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const list = [];
  Object.keys(inventory).forEach((itemType) => {
    const items = inventory[itemType] || [];
    items.forEach((record) => {
      const expiryDate = record.expiryDate
        ? new Date(record.expiryDate.replace(/-/g, "/"))
        : null;
      let expiryWarning = false;
      if (expiryDate) {
        expiryDate.setHours(0, 0, 0, 0);
        const daysUntilExpiry = Math.ceil(
          (expiryDate - today) / (1000 * 60 * 60 * 24)
        );
        const reminderDays =
          record.reminderDays != null
            ? record.reminderDays
            : EXPIRY_WARNING_DAYS;
        expiryWarning = daysUntilExpiry <= reminderDays;
      }
      list.push({
        id: record.id,
        itemType,
        location: record.location || "",
        tag: record.tag || "",
        inboundDate: record.inboundDate || "",
        expiryDate: record.expiryDate || "",
        quantity: record.quantity,
        expiryWarning,
      });
    });
  });
  list.sort((a, b) => (a.itemType || "").localeCompare(b.itemType || ""));
  return list;
}

/**
 * 获取出库物品列表（物品名称+标签+数量，每条记录一行）
 * @returns {Array<{id, itemType, tag, quantity}>}
 */
function getOutboundItemList() {
  const inventory = getInventory();
  const list = [];
  Object.keys(inventory).forEach((itemType) => {
    const items = inventory[itemType] || [];
    items.forEach((record) => {
      list.push({
        id: record.id,
        itemType,
        tag: record.tag || "",
        quantity: record.quantity,
      });
    });
  });
  return list;
}

/**
 * 获取用户信息
 * @returns {Object} 用户信息
 */
function getUserInfo() {
  try {
    const userInfo = wx.getStorageSync(USER_INFO_KEY);
    return userInfo || { name: "", phone: "" };
  } catch (e) {
    console.error("获取用户信息失败:", e);
    return { name: "", phone: "" };
  }
}

/**
 * 保存用户信息
 * @param {Object} userInfo 用户信息
 * @returns {Boolean} 是否成功
 */
function saveUserInfo(userInfo) {
  try {
    wx.setStorageSync(USER_INFO_KEY, userInfo);
    return true;
  } catch (e) {
    console.error("保存用户信息失败:", e);
    return false;
  }
}

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date} date 日期对象
 * @returns {String} 格式化后的日期字符串
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 格式化时间为 HH:mm
 * @param {Date} date 日期对象
 * @returns {String} 格式化后的时间字符串
 */
function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm:ss
 * @param {Date} date 日期对象
 * @returns {String} 格式化后的日期时间字符串
 */
function formatDateTime(date) {
  const dateStr = formatDate(date);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${dateStr} ${hours}:${minutes}:${seconds}`;
}

module.exports = {
  ITEM_TYPES,
  getAllItemTypes,
  LOW_STOCK_THRESHOLD,
  EXPIRY_WARNING_DAYS,
  getInventory,
  saveInventory,
  addInbound,
  addOutbound,
  getInventoryStats,
  getStockByType,
  getItemOverviewList,
  getStatisticsItemList,
  getOutboundItemList,
  getUserInfo,
  saveUserInfo,
  formatDate,
  formatTime,
  formatDateTime,
};
