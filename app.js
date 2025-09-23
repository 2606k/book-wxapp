//app.js
App({
  /**
   * 全局数据
   */
  globalData: {
    // API基础地址
    baseUrl: 'http://localhost:8082/',
    // 用户信息
    userInfo: null,
    // openid
    openid: null,
    // 登录状态监听器
    loginListeners: []
  },

  /**
   * 应用启动
   */
  onLaunch: function () {
    console.log('小程序启动')
    
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    // wx.login({
    //   success: res => {
    //     // 发送 res.code 到后台换取 openId, sessionKey, unionId
    //     console.log('登录成功', res)
    //   }
    // })
    
    // 自动获取用户openid
    this.getUserOpenId()
  },

  /**
   * 获取用户openid - 微信官方方法
   */
  getUserOpenId() {
    return new Promise((resolve, reject) => {
      // 获取code值
      wx.login({
        success: (res) => {
          const code = res.code
          // 通过code换取openId
          wx.request({
            url: `https://api.weixin.qq.com/sns/jscode2session?appid=wx1af9a7ab62196405&secret=112a437a96f4a53a3b9bca32c78fb10f&js_code=${code}&grant_type=authorization_code`,
            success: (res) => {
              if (res.data && res.data.openid) {
                // 将openid存储到globalData中
                this.globalData.openid = res.data.openid
                // 同时保存到本地存储，方便下次使用
                wx.setStorageSync('openid', res.data.openid)
                console.log('获取openid成功:', res.data.openid)
                resolve(res.data.openid)
              } else {
                console.error('获取openid失败:', res.data)
                reject(res.data)
              }
            },
            fail: (err) => {
              console.error('请求失败:', err)
              reject(err)
            }
          })
        },
        fail: (err) => {
          console.error('登录失败:', err)
          reject(err)
        }
      })
    })
  },

  /**
   * 检查登录状态
   */
  checkLogin() {
    const openid = wx.getStorageSync('openid')
    if (openid) {
      this.globalData.openid = openid
    }
  },

  /**
   * 更新openid并通知监听器
   */
  updateOpenid(openid) {
    this.globalData.openid = openid
    wx.setStorageSync('openid', openid)
    
    // 通知所有监听器
    this.globalData.loginListeners.forEach(listener => {
      if (typeof listener === 'function') {
        listener(openid)
      }
    })
  },

  /**
   * 添加登录状态监听器
   */
  addLoginListener(listener) {
    if (typeof listener === 'function') {
      this.globalData.loginListeners.push(listener)
    }
  },

  /**
   * 移除登录状态监听器
   */
  removeLoginListener(listener) {
    const index = this.globalData.loginListeners.indexOf(listener)
    if (index > -1) {
      this.globalData.loginListeners.splice(index, 1)
    }
  },

  /**
   * 检查用户是否已授权
   */
  checkUserAuth() {
    const userInfo = wx.getStorageSync('userInfo')
    const openid = this.globalData.openid || wx.getStorageSync('openid')
    return !!(userInfo && userInfo.userId && openid)
  },
  
  /**
   * 显示未授权提示并跳转到首页
   */
  showAuthRequiredDialog() {
    wx.showModal({
      title: '需要授权',
      content: '请先在首页完成授权后再使用此功能',
      showCancel: false,
      confirmText: '去授权',
      success: () => {
        wx.switchTab({
          url: '/pages/index/index'
        })
      }
    })
  },

  /**
   * 网络请求封装
   */
  request(options) {
    return new Promise((resolve, reject) => {
      wx.request({
        ...options,
        url: this.globalData.baseUrl + options.url,
        header: {
          'Content-Type': 'application/json',
          ...options.header
        },
        success: (result) => {
          console.log('API请求成功:', options.url, result)
          resolve(result)
        },
        fail: (err) => {
          console.error('API请求失败:', options.url, err)
          reject(err)
        }
      })
    })
  }
})