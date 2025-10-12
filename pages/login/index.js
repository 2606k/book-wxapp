// pages/login/index.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    avatarUrl: '', // 用户头像
    nickName: '', // 用户昵称
    isLoading: false // 加载状态
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('登录页面加载')
    // 检查是否已有用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo.nickName && userInfo.avatarUrl) {
      this.setData({
        avatarUrl: userInfo.avatarUrl,
        nickName: userInfo.nickName
      })
    }
  },

  /**
   * 选择头像回调
   */
  onChooseAvatar(e) {
    console.log('选择头像:', e.detail.avatarUrl)
    const { avatarUrl } = e.detail
    
    this.setData({
      avatarUrl: avatarUrl
    })
    
    wx.showToast({
      title: '头像已选择',
      icon: 'success',
      duration: 1500
    })
  },

  /**
   * 昵称输入
   */
  onNicknameInput(e) {
    this.setData({
      nickName: e.detail.value
    })
  },

  /**
   * 昵称失焦（微信会异步检测内容安全）
   */
  onNicknameBlur(e) {
    console.log('昵称失焦:', e.detail.value)
    // 微信会自动进行内容安全检测
    // 如果检测不通过，微信会自动清空内容
  },

  /**
   * 表单提交 - 点击登录按钮
   */
  async handleLogin(e) {
    console.log('表单提交:', e.detail.value)
    
    // 从表单获取昵称（更安全）
    const formNickname = e.detail.value.nickname
    
    // 验证信息完整性
    if (!this.data.avatarUrl) {
      wx.showToast({
        title: '请选择头像',
        icon: 'none',
        duration: 2000
      })
      return
    }

    if (!formNickname || formNickname.trim() === '') {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none',
        duration: 2000
      })
      return
    }

    this.setData({ isLoading: true })

    try {
      const app = getApp()
      
      // 1. 上传头像到服务器（如果需要）
      console.log('准备上传头像...')
      let uploadedAvatarUrl = this.data.avatarUrl
      
      // 如果头像是本地临时路径，需要上传到服务器
      if (this.data.avatarUrl.indexOf('tmp') !== -1) {
        uploadedAvatarUrl = await this.uploadAvatar(this.data.avatarUrl)
      }
      
      // 2. 获取微信登录 code
      console.log('开始获取微信登录code...')
      const code = await app.getWxLoginCode()
      console.log('获取code成功:', code)
      
      // 3. 调用后端获取 openid
      console.log('开始获取openid...')
      const openid = await app.getOpenIdFromBackend(code)
      console.log('获取openid成功:', openid)
      
      // 4. 组合完整的用户信息
      const completeUserInfo = {
        nickName: formNickname.trim(),
        avatarUrl: uploadedAvatarUrl,
        openid: openid
      }
      console.log('组合完整用户信息:', completeUserInfo)
      
      // 5. 调用后端注册接口保存用户信息
      console.log('开始保存用户信息到后端...')
      const savedUserInfo = await app.saveUserToBackend(completeUserInfo)
      console.log('保存用户信息成功:', savedUserInfo)
      
      // 6. 显示成功提示
      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      })
      
      // 7. 执行成功回调
      if (app.globalData.loginSuccessCallback && typeof app.globalData.loginSuccessCallback === 'function') {
        app.globalData.loginSuccessCallback(savedUserInfo)
      }
      
      // 8. 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack({
          delta: 1
        })
      }, 1500)
      
    } catch (error) {
      console.error('登录失败:', error)
      
      this.setData({ isLoading: false })
      
      wx.showModal({
        title: '登录失败',
        content: error.message || '登录过程中出现错误，请重试',
        showCancel: false,
        confirmText: '我知道了'
      })
    }
  },

  /**
   * 上传头像到服务器
   */
  uploadAvatar(tempFilePath) {
    return new Promise((resolve, reject) => {
      const app = getApp()
      
      wx.uploadFile({
        url: app.globalData.baseUrl + 'admin/upload/avatar',
        filePath: tempFilePath,
        name: 'file',
        header: {
          'Content-Type': 'multipart/form-data'
        },
        success: (res) => {
          console.log('头像上传成功:', res)
          const data = JSON.parse(res.data)
          if (data.code === 200) {
            resolve(data.data) // 返回服务器上的头像URL
          } else {
            // 上传失败，使用临时路径
            console.warn('头像上传失败，使用临时路径')
            resolve(tempFilePath)
          }
        },
        fail: (err) => {
          console.error('头像上传失败:', err)
          // 上传失败，使用临时路径
          resolve(tempFilePath)
        }
      })
    })
  },

  /**
   * 取消登录
   */
  handleCancel() {
    const app = getApp()
    
    // 执行取消回调
    if (app.globalData.loginCancelCallback && typeof app.globalData.loginCancelCallback === 'function') {
      app.globalData.loginCancelCallback()
    }
    
    // 返回上一页
    wx.navigateBack({
      delta: 1
    })
  }
})
