// components/life/life.js
const tool = require('../../utils/tools.js')
const config = require('../../utils/config.js')

Component({
  data: {
    desc: '',
    records: [],
    categorySums: {}
  },

  lifetimes: {
    attached() {
      // 组件挂载到页面时获取数据
      this.fetchRecords()
    }
  },

  methods: {
    // 滑动时记录 x 坐标
    onMoveChange(e) {
      const id = e.currentTarget.dataset.id
      const x = e.detail.x
      const records = this.data.records.map(item => {
        if (item._id === id) item.x = x
        return item
      })
      this.setData({ records })
    },

    // 手指离开时，判断是回弹还是展开删除按钮
    onTouchEnd(e) {
      const id = e.currentTarget.dataset.id
      let records = this.data.records

      records = records.map(item => {
        if (item._id === id) {
          // 滑动距离超过一半才展开，否则回弹
          item.x = item.x < -80 ? -160 : 0
        } else {
          // 其他的全部收回
          item.x = 0
        }
        return item
      })

      this.setData({ records })
    },

    // 点击空白区域收回所有展开项
    closeAll() {
      const records = this.data.records.map(item => ({
        ...item,
        x: 0
      }))
      this.setData({ records })
    },

    // 点击删除
    onDelete(e) {
      const id = e.currentTarget.dataset.id
      const records = this.data.records.filter(item => item._id !== id)
      this.setData({ records })

      wx.showLoading({ title: '删除中...', mask: true })
      wx.cloud.callFunction({
        name: 'deleteExpenseRecordById',
        data: { _id: id }
      }).then(res => {
        wx.hideLoading()
        if (res.result && res.result.success) {
          wx.showToast({ title: '删除成功', icon: 'success' })
          this.fetchRecords()
        } else {
          wx.showToast({ title: '删除失败', icon: 'none' })
          this.fetchRecords()
        }
      }).catch(() => {
        wx.hideLoading()
        wx.showToast({ title: '删除失败', icon: 'none' })
        this.fetchRecords()
      })

      // 删除后把所有项收回
      this.closeAll()
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
            records: (res.result.data || []).map(item => ({
              ...item,
              date: item.date ? tool.formatDate(item.date) : '',
              x: 0 // 初始化时保证删除按钮隐藏
            })),
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
        data: {
          description: desc,
          categories: config.categories
        }
      }).then(() => {
        wx.hideLoading()
        wx.showToast({ title: '提交成功', icon: 'success' })
        this.setData({ desc: '' })
        this.fetchRecords()
      }).catch(() => {
        wx.hideLoading()
        wx.showToast({ title: '提交失败', icon: 'none' })
      })
    }
  }
})
