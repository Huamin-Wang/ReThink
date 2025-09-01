// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  const { _id } = event

  if (!_id) {
    return {
      success: false,
      message: '缺少参数 _id'
    }
  }

  try {
    const res = await db.collection('expense_records').doc(_id).remove()
    return {
      success: true,
      data: res,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    }
  } catch (err) {
    return {
      success: false,
      message: '删除失败',
      error: err
    }
  }
}