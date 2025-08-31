// app.js
const config = require('./utils/config.js');
App({
  onLaunch() {
    // 初始化云环境，使用开发者工具中选择的默认环境（不硬编码 env）
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-4gl2o7n9de64fdec',
        traceUser: true
      })
    } else {
      console.error('请使用基础库 2.2.3 或以上，并在项目配置中启用云开发')
    }
  },
  gloabalData: {
    categories: config.categories,

  }
})
