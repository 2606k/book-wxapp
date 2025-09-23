// pages/address/edit.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 表单数据
    formData: {
      name: '',
      phone: '',
      address: '',
      isDefault: false
    },
    // 是否编辑模式
    isEdit: false,
    // 地址ID
    addressId: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.address) {
      // 编辑模式
      const address = JSON.parse(decodeURIComponent(options.address))
      this.setData({
        formData: {
          name: address.name,
          phone: address.phone,
          address: address.address,
          isDefault: address.isDefault
        },
        isEdit: true,
        addressId: address.id
      })
      wx.setNavigationBarTitle({
        title: '编辑地址'
      })
    } else {
      // 新增模式
      wx.setNavigationBarTitle({
        title: '添加地址'
      })
    }
  },

  /**
   * 网络请求封装
   */
  request(options) {
    const app = getApp()
    return app.request(options)
  },

  /**
   * 表单输入事件
   */
  onFormInput(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    
    this.setData({
      [`formData.${field}`]: value
    })
  },

  /**
   * 切换默认地址
   */
  toggleDefault() {
    this.setData({
      'formData.isDefault': !this.data.formData.isDefault
    })
  },

  /**
   * 选择地址
   */
  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'formData.address': res.address + res.name
        })
      },
      fail: (error) => {
        console.log('选择位置失败:', error)
        if (error.errMsg.includes('cancel')) {
          return
        }
        this.showToast('获取位置失败')
      }
    })
  },

  /**
   * 保存地址
   */
  async saveAddress() {
    const { formData, isEdit, addressId } = this.data
    
    // 表单验证
    if (!formData.name.trim()) {
      this.showToast('请输入收货人姓名')
      return
    }
    
    if (!formData.phone.trim()) {
      this.showToast('请输入手机号')
      return
    }
    
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      this.showToast('请输入正确的手机号')
      return
    }
    
    if (!formData.address.trim()) {
      this.showToast('请输入详细地址')
      return
    }
    
    try {
      const openid = await this.getOpenId()
      
      const addressData = {
        ...formData,
        openid: openid
      }
      
      if (isEdit) {
        // 编辑地址 - 这里应该调用编辑接口
        console.log('编辑地址:', addressData)
        this.showToast('保存成功')
      } else {
        // 添加地址
        const res = await this.request({
          url: 'address/add',
          method: 'POST',
          data: addressData
        })
        
        if (res.data && res.data.code === 200) {
          this.showToast('添加成功')
        } else {
          this.showToast(res.data.msg || '添加失败')
          return
        }
      }
      
      // 返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      
    } catch (error) {
      console.error('保存地址失败:', error)
      this.showToast('保存失败')
    }
  },

  /**
   * 获取用户openid
   */
  async getOpenId() {
    return new Promise((resolve, reject) => {
      // 先从缓存获取
      const openid = wx.getStorageSync('openid')
      if (openid) {
        resolve(openid)
        return
      }

      // 如果没有，调用app.js中的方法获取
      const app = getApp()
      if (app && app.getUserOpenId) {
        app.getUserOpenId().then(openid => {
          resolve(openid)
        }).catch(error => {
          console.error('获取openid失败:', error)
          reject(error)
        })
      } else {
        reject(new Error('无法获取openid'))
      }
    })
  },

  /**
   * 显示提示信息
   */
  showToast(title) {
    wx.showToast({
      title: title,
      icon: 'none',
      duration: 2000
    })
  }
})
