// pages/mine/index.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    nickName: '立即登录',
    avatarUrl: '/assets/imgs/mine/morentouxiang.png',
    isLogin: false, // 登录状态
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadUserInfo()
    
    // 添加登录监听
    const app = getApp()
    app.addLoginListener(this.onLoginSuccess.bind(this))
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 每次显示页面时刷新用户信息
    this.loadUserInfo()
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    // 移除登录监听
    const app = getApp()
    app.removeLoginListener(this.onLoginSuccess.bind(this))
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const app = getApp()
    const isLogin = app.checkUserAuth()
    
    if (isLogin) {
      const userInfo = wx.getStorageSync('userInfo')
      this.setData({
        nickName: userInfo.nickName || userInfo.userName || '微信用户',
        avatarUrl: userInfo.avatarUrl || '/assets/imgs/mine/morentouxiang.png',
        isLogin: true
      })
    } else {
      this.setData({
        nickName: '立即登录',
        avatarUrl: '/assets/imgs/mine/morentouxiang.png',
        isLogin: false
      })
    }
  },

  /**
   * 点击头像/昵称登录
   */
  handleLogin() {
    if (this.data.isLogin) {
      // 已登录，不做操作
      return
    }

    const app = getApp()
    app.showLoginDialog(() => {
      // 登录成功，刷新用户信息
      this.loadUserInfo()
    })
  },

  /**
   * 登录成功回调
   */
  onLoginSuccess(userInfo) {
    console.log('个人中心收到登录成功通知:', userInfo)
    this.loadUserInfo()
  },

  /**
   * 跳转到地址管理
   */
  goToAddressManage() {
    const app = getApp()
    app.checkLoginAndShow(() => {
      wx.navigateTo({
        url: '/pages/address/index'
      })
    })
  },

  /**
   * 跳转到帮助中心
   */
  goToHelp() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  /**
   * 跳转到用户协议
   */
  goToProtocol() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  /**
   * 退出登录
   */
  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          this.loginOut()
        }
      }
    })
  },

  /**
   * 退出小程序账号信息
   */
  loginOut() {
    // 清除本地缓存
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('openid')
    
    // 清除全局数据
    const app = getApp()
    app.globalData.userInfo = null
    app.globalData.openid = null
    
    // 重新设置默认状态
    this.setData({
      nickName: '立即登录',
      avatarUrl: '/assets/imgs/mine/morentouxiang.png',
      isLogin: false
    })
    
    wx.showToast({
      title: '已退出登录',
      icon: 'success'
    })
  },
  getcode() {
    // 使用 wx.login 获取 code码
    wx.login({
      success(res) {
        if (res.code) {
          console.log(res.code)
          //发起网络请求
          wx.request({
            // 请求的 api
            url: 'http://v2xtest.gz2vip.idcfengye.com/api/we/getCode',
            // 携带code码传给后台
            data: { code:res.code },
            success: (result) => {
              console.log(result)
            },
          })
          // console.log(res.code)
          // const code = res.code
          // console.log(code)
          //  wx.setStorageSync('code',res.data)
        } else {
          console.log('登录失败！' + res.errMsg)
        }
      },
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {},
})
