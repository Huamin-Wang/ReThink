// pages/addRecord/life.js
const tool = require('../../utils/tools.js')
Page({
    data: {
        desc: '',
        records: [],
        categorySums: {}
    },

    onLoad() {
        this.fetchRecords()
    },
    // 滑动时记录 x 坐标
    onMoveChange(e) {
        const id = e.currentTarget.dataset.id
        const x = e.detail.x
        const records = this.data.records.map(item => {
            if (item._id === id) item.x = x
            return item
        })
        this.setData({records})
    },

    // 手指离开时，判断是回弹还是展开删除按钮
    onTouchEnd(e) {
        const id = e.currentTarget.dataset.id
        let records = this.data.records
        records = records.map(item => {
            if (item._id === id) {
                item.x = item.x < -50 ? -160 : 0  // 超过50rpx就展开删除
            } else {
                item.x = 0  // 其他的收回
            }
            return item
        })
        this.setData({records})

// 如果展开了删除按钮，2秒后自动回弹
        const currentItem = records.find(item => item._id === id)
        if (currentItem && currentItem.x === -160) {
            setTimeout(() => {
                // 所有项都回弹到初始位置
                const updatedRecords = this.data.records.map(item => ({
                    ...item,
                    x: 0
                }))
                this.setData({records: updatedRecords})
            }, 2000)
        }
    },

    // 点击删除
    onDelete(e) {
        const id = e.currentTarget.dataset.id
        const records = this.data.records.filter(item => item._id !== id)
        this.setData({records})
        wx.showLoading({title: '删除中...', mask: true})
        wx.cloud.callFunction({
            name: 'deleteExpenseRecordById',
            data: {_id:id}
        }).then(res => {
            wx.hideLoading()
            if (res.result && res.result.success) {
                wx.showToast({title: '删除成功', icon: 'success'})
                this.fetchRecords() // 删除成功后刷新数据
            } else {
                wx.showToast({title: '删除失败', icon: 'none'})
                this.fetchRecords() // 删除失败也刷新数据，防止前端和后端数据不一致
            }
        }).catch(() => {
            wx.hideLoading()
            wx.showToast({title: '删除失败', icon: 'none'})
            this.fetchRecords() // 删除失败也刷新数据，防止前端和后端数据不一致
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
                        date: item.date ? tool.formatDate(item.date) : ''
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
            data: {description: desc}
        }).then(() => {
            wx.hideLoading()
            wx.showToast({title: '提交成功', icon: 'success'})
            this.setData({desc: ''})
            this.fetchRecords() // 提交成功后刷新数据
        }).catch(() => {
            wx.hideLoading()
            wx.showToast({title: '提交失败', icon: 'none'})
        })
    }
})
