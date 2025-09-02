// 云函数入口文件
const cloud = require('wx-server-sdk')
const https = require('https')
const {URL} = require('url')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

// 火山引擎豆包大模型配置
const BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3'
const API_KEY = 'e864c037-480f-4533-bb04-df290365997f'
const MODEL = 'doubao-lite-4k-character-240828'

// Helper: 使用内置 https 发起 POST JSON 请求
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
            res.on('data', (chunk) => {
                raw += chunk
            })
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
    const {description, categories} = event || {}
    const {OPENID} = cloud.getWXContext()
    const db = cloud.database()

    // 分类列表
    const categoryList = categories && categories.length > 0
        ? categories
        : ['餐饮', '交通', '购物', '娱乐', '其他', '住房', '医疗', '教育', '旅行', '人情', '工资', '理财收益']

    if (!description) {
        return {success: false, error: '缺少 description'}
    }

    try {
        // 构造提示词，要求返回数组
        const prompt = `你是消费分类助手。请根据用户的消费描述，从以下类别中选择最合适的分类，并提取金额，其中支出为负。
严格返回 JSON 数组格式，例如：
[{"category":"餐饮","amount":-200,"description":"昨天吃火锅","type":"支出"},
{"category":"交通","amount":-30,"description":"今天打车","type":"支出"},
{"category":"购物","amount":-300,"description":"买衣服","type":"支出"},
{"category":"工资","amount":5000,"description":"本月工资","type":"收入"},
{"category":"理财收益","amount":200,"description":"基金分红","type":"收入"}]

类别：${categoryList.join('，')}
描述：${description}
注意：只返回 JSON 数组，不要多余的话！`

        // 调用豆包模型
        const resp = await postJson(
            `${BASE_URL}/chat/completions`,
            {
                model: MODEL,
                messages: [
                    {role: 'system', content: '你是消费分类助手'},
                    {role: 'user', content: prompt}
                ]
            },
            {'Authorization': `Bearer ${API_KEY}`}
        )

        console.log('豆包返回内容:', resp)

        let modelOutputs
        try {
            const data = typeof resp === 'string' ? JSON.parse(resp) : resp
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                return {success: false, error: '模型返回格式不正确'}
            }
            modelOutputs = JSON.parse(data.choices[0].message.content)
            if (!Array.isArray(modelOutputs)) {
                throw new Error('模型输出不是数组')
            }
        } catch (e) {
            return {success: false, error: '解析模型输出失败: ' + e.message}
        }

// 批量写入数据库
        const results = []
        for (const item of modelOutputs) {
            const record = {
                userId: OPENID,
                description: item.description || '',
                category: item.category || '未分类',
                amount: item.amount || 0,
                date: new Date(),
                type: item.type
            }


            try {
                const addRes = await db.collection('expense_records').add({data: record})
                results.push({success: true, recordId: addRes._id, record})
            } catch (dbErr) {
                results.push({success: false, error: '数据库写入失败: ' + dbErr.message, record})
            }
        }

        return {success: true, results}
    } catch (err) {
        console.error('云函数出错:', err)
        return {success: false, error: err.message}
    }
}
