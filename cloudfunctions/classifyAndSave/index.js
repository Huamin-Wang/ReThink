// 云函数入口文件
const cloud = require('wx-server-sdk')
const https = require('https')
const { URL } = require('url')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 火山引擎豆包大模型配置
const BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3'
const API_KEY = 'e864c037-480f-4533-bb04-df290365997f'
const MODEL = 'doubao-lite-4k-character-240828'

// Helper: 使用内置 https 发起 POST JSON 请求，返回解析后的 JSON 或原始文本
function postJson(url, payload, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const body = JSON.stringify(payload)
    const headers = Object.assign({
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }, extraHeaders)

    const options = {
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: 'POST',
      headers
    }

    const req = https.request(options, (res) => {
      let raw = ''
      res.on('data', (chunk) => { raw += chunk })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw)
          resolve(parsed)
        } catch (e) {
          resolve(raw)
        }
      })
    })

    req.on('error', (err) => reject(err))
    req.write(body)
    req.end()
  })
}

// 云函数入口
exports.main = async (event) => {
  const { description, categories } = event || {}
  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()

  // 如果前端没传分类，就给个默认的
  const categoryList = categories && categories.length > 0
    ? categories
    : ['餐饮', '交通', '购物', '娱乐', '其他', '住房', '医疗', '教育', '旅行', '人情']

  try {
    // 构造提示词
    const prompt = `你是消费分类助手。请根据用户的消费描述，从以下类别中选择最合适的一类：${categoryList.join('，')}，并且提取金额。严格返回 JSON 格式，例如：{"category":"餐饮","amount":35}。描述：${description}。注意：只返回 JSON，不要多余的话！`

    // 调用豆包大模型（使用内置 https）
    const resp = await postJson(
      `${BASE_URL}/chat/completions`,
      {
        model: MODEL,
        messages: [
          { role: 'system', content: '你是消费分类助手' },
          { role: 'user', content: prompt }
        ]
      },
      {
        'Authorization': `Bearer ${API_KEY}`
      }
    )

    console.log('豆包返回内容:', resp)

    let modelOutput
    try {
      const data = typeof resp === 'string' ? JSON.parse(resp) : resp
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        return { success: false, error: '模型返回格式不正确' }
      }
      // 解析模型返回的文本内容为 JSON
      modelOutput = JSON.parse(data.choices[0].message.content)
    } catch (e) {
      return { success: false, error: '解析模型输出失败: ' + e.message }
    }

    // 写入数据库
    const record = {
      userId: OPENID,
      description: description || '',
      category: modelOutput.category || '未分类',
      amount: modelOutput.amount || 0,
      date: new Date()
    }

    const addRes = await db.collection('expense_records').add({ data: record })

    return {
      success: true,
      recordId: addRes._id,
      record
    }
  } catch (err) {
    console.error('云函数出错:', err)
    return { success: false, error: err.message }
  }
}
