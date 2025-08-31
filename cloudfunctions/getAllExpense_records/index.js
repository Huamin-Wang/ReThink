
// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  const _ = db.command

  // 分页参数
  const pageSize = event.pageSize || 20
  const pageNum = event.pageNum || 1

  try {
      // 获取总数
      const countRes = await db.collection('expense_records')
        .where({ userId: wxContext.OPENID })
        .count()
      const total = countRes.total

      // 获取数据，按时间倒序
      const dataRes = await db.collection('expense_records')
        .where({ userId: wxContext.OPENID })
        .orderBy('date', 'desc')
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize)
        .get()
const $ = db.command.aggregate

   // 分类汇总，聚合操作符写法修正
   const sumRes = await db.collection('expense_records')
     .aggregate()
     .match({ userId: wxContext.OPENID })
     .group({
       _id: '$category',
       sum: $.sum('$amount') // 注意这里用 $ 而不是 _
     })
     .end()

      return {
        success: true,
        data: dataRes.data,
        total,
        pageNum,
        pageSize,
        categorySums: sumRes.list
      }
    }
   catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}