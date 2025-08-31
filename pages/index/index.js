Page({
  data: {
    mainGoal: {
      title: "考研成功",
      deadline: "2027-12-31",
      remainingDays: 857
    },
    milestones: [
      { title: "完成数学基础", progress: 40 },
      { title: "英语六级550分", progress: 20 },
      { title: "政治核心知识梳理", progress: 10 }
    ],
    tasks: [
      { title: "数学真题训练 2 小时", estimateMin: 120, status: "todo" },
      { title: "英语单词 50 个", estimateMin: 30, status: "done" },
      { title: "跑步 5 公里", estimateMin: 40, status: "todo" }
    ]
  },
onLoad(query) {
      //直接跳转到life页面
      wx.navigateTo({
        url: '/pages/addRecord/life'
      });
},
    // 切换任务状态
  toggleTask(e) {
    const index = e.currentTarget.dataset.index
    let tasks = this.data.tasks
    tasks[index].status = tasks[index].status === "done" ? "todo" : "done"
    this.setData({ tasks })
  },

  // 添加记录
  addRecord() {

    //跳转到 addRecord 页面
    wx.navigateTo({ url: '/pages/addRecord/index' })
  },

})
