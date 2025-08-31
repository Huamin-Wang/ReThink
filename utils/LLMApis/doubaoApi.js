// 微信小程序中调用火山引擎豆包大模型的通用API，参考Python get_answer实现

const BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const API_KEY = 'e864c037-480f-4533-bb04-df290365997f';
const MODEL = 'doubao-lite-4k-character-240828';

/**
 * 获取大模型回答
 * @param {string} question - 用户问题
 * @returns {Promise<string>} - 返回大模型的答案
 */
function getAnswer(question) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}/chat/completions`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      data: {
        model: MODEL,
        messages: [
          { role: 'system', content: '你是消费分类助手' },
          { role: 'user', content: question+'注意：直接回复，不要说多余的话！' }
        ]
      },
      success: (res) => {
        // 输出完整返回内容，便于排查格式问题
        console.log('大模型接口返回内容:', res.data);
        if (res.statusCode !== 200) {
          reject(new Error(`请求失败，状态码: ${res.statusCode}`));
          return;
        }
        // 兼容返回结构
        try {
          if (
            res.data &&
            res.data.choices &&
            Array.isArray(res.data.choices) &&
            res.data.choices[0] &&
            res.data.choices[0].message &&
            typeof res.data.choices[0].message.content === 'string'
          ) {
            resolve(res.data.choices[0].message.content);
          } else {
            reject(new Error('接口返回格式异常: ' + JSON.stringify(res.data)));
          }
        } catch (e) {
          reject(new Error('解析返回内容出错: ' + e.message));
        }
      },
      fail: (err) => {
        reject(new Error(`网络请求失败: ${err.errMsg}`));
      }
    });
  }).catch(e => {
    console.error('大模型调用出错:', e);
    return '抱歉，大模型调用出错，请稍后再试。';
  });
}

module.exports = {
  getAnswer
};
