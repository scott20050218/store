// index.js
Page({
  data: {},

  // 跳转到物品总览
  goToOverview() {
    wx.navigateTo({
      url: '/pages/overview/overview'
    })
  },

  // 跳转到入库页面
  goToInbound() {
    wx.navigateTo({
      url: '/pages/inbound/inbound'
    })
  },

  // 跳转到出库页面
  goToOutbound() {
    wx.navigateTo({
      url: '/pages/outbound/outbound'
    })
  }
})
