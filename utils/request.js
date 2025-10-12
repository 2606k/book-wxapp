/**
 * 网络请求封装
 * 统一处理请求和响应
 */

// 获取全局配置
const app = getApp()

/**
 * 使用 Promise 封装 wx.request 请求
 * @param {Object} params - 请求参数
 * @param {String} params.url - 请求路径（相对路径，会自动拼接baseUrl）
 * @param {String} params.method - 请求方法，默认GET
 * @param {Object} params.data - 请求参数
 * @param {Object} params.header - 请求头
 * @param {Boolean} params.showLoading - 是否显示加载提示，默认true
 * @param {String} params.loadingText - 加载提示文字，默认"加载中..."
 */
const request = (params) => {
  // 定义公共的 url
  const baseUrl = app ? app.globalData.baseUrl : 'http://localhost:8082/'
  
  // 默认参数
  const defaultParams = {
    method: 'GET',
    showLoading: true,
    loadingText: '加载中...'
  }
  
  // 合并参数
  const options = Object.assign({}, defaultParams, params)
  
  // 显示加载提示
  if (options.showLoading) {
    wx.showLoading({
      title: options.loadingText,
      mask: true
    })
  }
  
  return new Promise((resolve, reject) => {
    // 发送网络请求
    wx.request({
      // 请求路径拼接
      url: baseUrl + options.url,
      // 请求方法
      method: options.method,
      // 请求参数
      data: options.data || {},
      // 请求头
      header: {
        'Content-Type': 'application/json',
        ...options.header
      },
      // 成功回调
      success: (result) => {
        // 隐藏加载提示
        if (options.showLoading) {
          wx.hideLoading()
        }
        
        // 打印请求日志
        console.log('API请求成功:', options.url, result)
        
        // 判断业务状态码
        if (result.data && result.data.code === 200) {
          resolve(result)
        } else {
          // 业务错误处理
          const errorMsg = result.data?.msg || '请求失败'
          wx.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 2000
          })
          reject(result)
        }
      },
      // 失败回调
      fail: (err) => {
        // 隐藏加载提示
        if (options.showLoading) {
          wx.hideLoading()
        }
        
        // 打印错误日志
        console.error('API请求失败:', options.url, err)
        
        // 网络错误提示
        wx.showToast({
          title: '网络请求失败，请检查网络连接',
          icon: 'none',
          duration: 2000
        })
        
        reject(err)
      }
    })
  })
}

/**
 * 不显示加载提示的请求
 */
const silentRequest = (params) => {
  return request({
    ...params,
    showLoading: false
  })
}

/**
 * 文件上传
 * @param {Object} params - 上传参数
 * @param {String} params.url - 上传路径
 * @param {String} params.filePath - 文件路径
 * @param {String} params.name - 文件对应的key，默认为file
 * @param {Object} params.formData - 额外的表单数据
 */
const uploadFile = (params) => {
  const app = getApp()
  const baseUrl = app ? app.globalData.baseUrl : 'http://localhost:8082/'
  
  wx.showLoading({
    title: '上传中...',
    mask: true
  })
  
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: baseUrl + params.url,
      filePath: params.filePath,
      name: params.name || 'file',
      formData: params.formData || {},
      success: (result) => {
        wx.hideLoading()
        
        // 解析返回数据
        let data = {}
        try {
          data = JSON.parse(result.data)
        } catch (e) {
          data = result.data
        }
        
        if (data.code === 200) {
          resolve(data)
        } else {
          wx.showToast({
            title: data.msg || '上传失败',
            icon: 'none'
          })
          reject(data)
        }
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

module.exports = {
  request,
  silentRequest,
  uploadFile
}

