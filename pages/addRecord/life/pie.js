Page({
  data: {
    categories: ['记账', '收入', '支出'],
    activeIndex: 0,
    statusBarHeight: 20 // 默认值，避免加载时闪烁
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight // 适配不同手机安全区
    })
  },

  onNavTap(e) {
    this.setData({
      activeIndex: e.currentTarget.dataset.index
    })
  }
})
