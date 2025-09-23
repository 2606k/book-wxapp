// pages/address/index.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 地址列表
    addressList: [],
    // 加载状态
    loading: false,
    // 是否选择模式
    selectMode: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.select === 'true') {
      this.setData({
        selectMode: true
      })
      wx.setNavigationBarTitle({
        title: '选择地址'
      })
    }
    this.loadAddressList()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadAddressList()
  },

  /**
   * 网络请求封装
   */
  request(options) {
    const app = getApp()
    return app.request(options)
  },

  /**
   * 加载地址列表
   */
  async loadAddressList() {
    try {
      this.setData({ loading: true })
      
      const openid = await this.getOpenId()
      
      // 调用地址列表接口
      const res = await this.request({
        url: 'address/list',
        method: 'POST',
        data: {
          openid: openid
        }
      })

      if (res.data && res.data.code === 200) {
        const addressList = res.data.data || []
        this.setData({
          addressList,
          loading: false
        })
      } else {
        // 使用测试数据
        const testAddressList = [
          {
            id: 1,
            openid: 'test_openid',
            name: '张三',
            phone: '13800138000',
            address: '北京市朝阳区建国路88号SOHO现代城',
            isDefault: true
          },
          {
            id: 2,
            openid: 'test_openid', 
            name: '李四',
            phone: '13900139000',
            address: '上海市浦东新区陆家嘴金融贸易区',
            isDefault: false
          }
        ]
        
        this.setData({
          addressList: testAddressList,
          loading: false
        })
      }
      
    } catch (error) {
      console.error('加载地址列表失败:', error)
      this.showToast('加载失败')
      this.setData({ loading: false })
    }
  },

  /**
   * 选择地址
   */
  selectAddress(e) {
    if (!this.data.selectMode) return
    
    const { index } = e.currentTarget.dataset
    const address = this.data.addressList[index]
    
    // 返回上一页并传递选中的地址
    const pages = getCurrentPages()
    const prevPage = pages[pages.length - 2]
    
    if (prevPage) {
      prevPage.setSelectedAddress(address)
    }
    
    wx.navigateBack()
  },

  /**
   * 设置默认地址
   */
  async setDefaultAddress(e) {
    const { index } = e.currentTarget.dataset
    const address = this.data.addressList[index]
    
    if (address.isDefault) {
      this.showToast('已经是默认地址')
      return
    }
    
    try {
      // 这里应该调用设置默认地址的接口
      // 暂时使用本地更新
      const addressList = [...this.data.addressList]
      addressList.forEach((item, i) => {
        item.isDefault = i === index
      })
      
      this.setData({ addressList })
      this.showToast('设置成功')
      
    } catch (error) {
      console.error('设置默认地址失败:', error)
      this.showToast('设置失败')
    }
  },

  /**
   * 编辑地址
   */
  editAddress(e) {
    const { index } = e.currentTarget.dataset
    const address = this.data.addressList[index]
    
    wx.navigateTo({
      url: `/pages/address/edit?address=${encodeURIComponent(JSON.stringify(address))}`
    })
  },

  /**
   * 删除地址
   */
  deleteAddress(e) {
    const { index } = e.currentTarget.dataset
    const address = this.data.addressList[index]
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个地址吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            // 这里应该调用删除地址的接口
            // 暂时使用本地删除
            const addressList = [...this.data.addressList]
            addressList.splice(index, 1)
            
            this.setData({ addressList })
            this.showToast('删除成功')
            
          } catch (error) {
            console.error('删除地址失败:', error)
            this.showToast('删除失败')
          }
        }
      }
    })
  },

  /**
   * 添加新地址
   */
  addNewAddress() {
    wx.navigateTo({
      url: '/pages/address/edit'
    })
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
