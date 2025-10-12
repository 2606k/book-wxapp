//app.js
App({
  /**
   * 全局数据
   */
  globalData: {
    // API基础地址
    baseUrl: 'http://localhost:8083/',
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
    // this.getUserOpenId()
  },

  /**
   * 获取用户完整信息（头像+昵称+openid）
   */
  async getUserCompleteInfo() {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('开始获取用户完整信息')
        
        // 1. 先获取用户基本信息
        const userProfile = await this.getUserProfile()
        console.log('获取用户基本信息成功:', userProfile)
        
        // 2. 获取微信登录code
        const code = await this.getWxLoginCode()
        console.log('获取微信登录code成功:', code)
        
        // 3. 调用后端获取openid
        const openid = await this.getOpenIdFromBackend(code)
        console.log('从后端获取openid成功:', openid)
        
        // 4. 组合完整用户信息
        const completeUserInfo = {
          ...userProfile,
          openid: openid
        }
        
        console.log('组合完整用户信息:', completeUserInfo)
        resolve(completeUserInfo)
        
      } catch (error) {
        console.error('获取用户完整信息失败:', error)
        reject(error)
      }
    })
  },

  /**
   * 获取用户基本信息（头像、昵称）
   */
  getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          console.log('getUserProfile成功:', res.userInfo)
          resolve(res.userInfo)
        },
        fail: (error) => {
          console.error('getUserProfile失败:', error)
          // 如果获取失败，使用默认用户信息
          const defaultUserInfo = {
            nickName: '微信用户',
            avatarUrl: '',
            gender: 0,
            country: '',
            province: '',
            city: '',
            language: ''
          }
          console.log('使用默认用户信息:', defaultUserInfo)
          resolve(defaultUserInfo)
        }
      })
    })
  },

  /**
   * 获取微信登录code
   */
  getWxLoginCode() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            console.log('wx.login成功，获取到code:', res.code)
            resolve(res.code)
          } else {
            console.error('wx.login成功但没有code:', res)
            reject(new Error('获取微信登录code失败'))
          }
        },
        fail: (error) => {
          console.error('wx.login失败:', error)
          reject(error)
        }
      })
    })
  },

  /**
   * 调用后端获取openid
   */
  getOpenIdFromBackend(code) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: this.globalData.baseUrl + 'admin/getOpenId',
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: {code: code},
        success: (result) => {
          console.log('后端获取openid响应:', result)
          if (result.data && result.data.code === 200) {
            const openid = result.data.data
            console.log('后端返回openid:', openid)
            
            // 保存openid到本地和全局
            wx.setStorageSync('openid', openid)
            this.globalData.openid = openid
            
            resolve(openid)
          } else {
            console.error('后端获取openid失败:', result.data)
            reject(new Error(result.data ? result.data.message : '获取openid失败'))
          }
        },
        fail: (error) => {
          console.error('调用后端获取openid失败:', error)
          reject(error)
        }
      })
    })
  },

  /**
   * 保存用户信息到后端
   */
  saveUserToBackend(userInfo) {
    return new Promise((resolve, reject) => {
      const userData = {
        userName: userInfo.nickName || userInfo.nickname || '微信用户',
        avatarUrl: userInfo.avatarUrl || userInfo.avatar || '',
        openid: userInfo.openid || ''
      }

      console.log('准备保存用户信息到后端:', userData)

      // 调用 admin/register 接口
      wx.request({
        url: this.globalData.baseUrl + 'admin/register',
        method: 'POST',
        data: userData,
        header: {
          'Content-Type': 'application/json'
        },
        success: (result) => {
          console.log('保存用户信息成功:', result)
          if (result.data && result.data.code === 200) {
            // 保存完整的用户信息到本地
            const completeUserInfo = {
              ...userInfo,
              userId: result.data.data ? result.data.data.userId : Date.now()
            }
            wx.setStorageSync('userInfo', completeUserInfo)
            this.globalData.userInfo = completeUserInfo
            
            // 通知监听器
            this.notifyLoginListeners(completeUserInfo)
            resolve(completeUserInfo)
          } else {
            reject(new Error(result.data ? result.data.msg : '保存用户信息失败'))
          }
        },
        fail: (err) => {
          console.error('保存用户信息失败:', err)
          // 即使后端保存失败，也保存到本地
          const completeUserInfo = {
            ...userInfo,
            userId: Date.now() // 临时ID
          }
          wx.setStorageSync('userInfo', completeUserInfo)
          this.globalData.userInfo = completeUserInfo
          this.notifyLoginListeners(completeUserInfo)
          
          wx.showToast({
            title: '网络错误，数据已本地保存',
            icon: 'none'
          })
          resolve(completeUserInfo)
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
    return !!(userInfo && openid)
  },
  
  /**
   * 通知所有登录监听器
   */
  notifyLoginListeners(userInfo) {
    this.globalData.loginListeners.forEach(listener => {
      if (typeof listener === 'function') {
        listener(userInfo)
      }
    })
  },

  /**
   * 显示登录弹窗
   * @param {Function} successCallback - 登录成功回调
   * @param {Function} cancelCallback - 取消登录回调
   */
  showLoginDialog(successCallback, cancelCallback) {
    // 保存回调函数到全局，供登录页面使用
    this.globalData.loginSuccessCallback = successCallback
    this.globalData.loginCancelCallback = cancelCallback
    
    // 跳转到登录页面
    wx.navigateTo({
      url: '/pages/login/index',
      fail: (err) => {
        console.error('跳转登录页面失败:', err)
        // 如果跳转失败，显示简单提示
        wx.showModal({
          title: '需要登录',
          content: '此功能需要登录',
          showCancel: false
        })
      }
    })
  },

  /**
   * 检查登录状态，未登录则显示登录弹窗
   * @param {Function} successCallback - 登录成功或已登录的回调
   * @param {Function} cancelCallback - 取消登录的回调
   * @returns {Boolean} 是否已登录
   */
  checkLoginAndShow(successCallback, cancelCallback) {
    if (this.checkUserAuth()) {
      // 已登录，直接执行成功回调
      const userInfo = wx.getStorageSync('userInfo')
      if (successCallback && typeof successCallback === 'function') {
        successCallback(userInfo)
      }
      return true
    } else {
      // 未登录，显示登录弹窗
      this.showLoginDialog(successCallback, cancelCallback)
      return false
    }
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