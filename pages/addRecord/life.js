// pages/addRecord/life.js
Page({
  data: {
    desc: '',
    records: [],
    categorySums: {}
  },

  onLoad() {
    this.fetchRecords()
  },

  // 获取消费记录
  fetchRecords() {
    wx.showLoading({ title: '加载中...', mask: true })
    wx.cloud.callFunction({
      name: 'getAllExpense_records',
      data: { pageNum: 1, pageSize: 50 }
    }).then(res => {
      wx.hideLoading()
      if (res.result && res.result.success) {
        this.setData({
          records: res.result.data || [],
          categorySums: res.result.categorySums || {}
        })
      } else {
        wx.showToast({ title: '数据获取失败', icon: 'none' })
      }
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '数据获取失败', icon: 'none' })
    })
  },

  // 输入监听
  onDescInput(e) {
    this.setData({ desc: e.detail.value.trim() })
  },

  // 提交生活记录
  submitLifeRecord() {
    const { desc } = this.data
    if (!desc) {
      wx.showToast({ title: '请输入生活记录内容', icon: 'none' })
      return
    }

    wx.showLoading({ title: '提交中...', mask: true })
    wx.cloud.callFunction({
      name: 'classifyAndSave',
      data: { description: desc }
    }).then(() => {
      wx.hideLoading()
      wx.showToast({ title: '提交成功', icon: 'success' })
      this.setData({ desc: '' })
      this.fetchRecords() // 提交成功后刷新数据
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '提交失败', icon: 'none' })
    })
  }
})
