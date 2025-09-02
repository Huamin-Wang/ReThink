// components/life/life.js
const tool = require('../../utils/tools.js')
const config = require('../../utils/config.js')

Component({
    data: {
        desc: '',
        records: [],
        categorySums: {},
        showDeleteId: null,

    },

    lifetimes: {
        attached() {
            // 组件挂载到页面时获取数据
            this.fetchRecords()
        }
    },

    methods: {
        showDeleteBtn(e) {
            const id = e.currentTarget.dataset.id;
            this.setData({
                showDeleteId: id
            });
        },

      // 点击删除
      onDelete(e) {
          const id = e.currentTarget.dataset.id;
          wx.showModal({
              title: '确认删除',
              content: '确定要删除该记录吗？',
              confirmText: '删除',
              cancelText: '取消',
              success: (res) => {
                  if (res.confirm) {
                      if (this.data.autoCloseTimer) {
                          clearTimeout(this.data.autoCloseTimer)
                          this.setData({autoCloseTimer: null})
                      }
                      const records = this.data.records.filter(item => item._id !== id)
                      this.setData({records})

                      wx.showLoading({title: '删除中...', mask: true})
                      wx.cloud.callFunction({
                          name: 'deleteExpenseRecordById',
                          data: {_id: id}
                      }).then(res => {
                          wx.hideLoading()
                          if (res.result && res.result.success) {
                              wx.showToast({title: '删除成功', icon: 'success'})
                              this.fetchRecords()
                          } else {
                              wx.showToast({title: '删除失败', icon: 'none'})
                              this.fetchRecords()
                          }
                      }).catch(() => {
                          wx.hideLoading()
                          wx.showToast({title: '删除失败', icon: 'none'})
                          this.fetchRecords()
                      })
                  }
              }
          })
      },


        // 获取消费记录
        fetchRecords() {
            wx.showLoading({title: '加载中...', mask: true})
            wx.cloud.callFunction({
                name: 'getAllExpense_records',
                data: {pageNum: 1, pageSize: 50}
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
                    wx.showToast({title: '数据获取失败', icon: 'none'})
                }
            }).catch(() => {
                wx.hideLoading()
                wx.showToast({title: '数据获取失败', icon: 'none'})
            })
        },

        // 输入监听
        onDescInput(e) {
            this.setData({desc: e.detail.value.trim()})
        },

        // 提交生活记录
        submitLifeRecord() {
            const {desc} = this.data
            if (!desc) {
                wx.showToast({title: '请输入生活记录内容', icon: 'none'})
                return
            }

            wx.showLoading({title: '提交中...', mask: true})
            wx.cloud.callFunction({
                name: 'classifyAndSave',
                data: {
                    description: desc,
                    categories: config.categories
                }
            }).then(() => {
                wx.hideLoading()
                wx.showToast({title: '提交成功', icon: 'success'})
                this.setData({desc: ''})
                this.fetchRecords()
            }).catch(() => {
                wx.hideLoading()
                wx.showToast({title: '提交失败', icon: 'none'})
            })
        }
    }
})
