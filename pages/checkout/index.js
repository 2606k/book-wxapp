// pages/checkout/index.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 选中的商品
    selectedItems: [],
    // 收货地址
    selectedAddress: null,
    // 订单总金额
    totalAmount: 0,
    // 商品总数量
    totalCount: 0,
    // 备注
    remark: '',
    // 提交中状态
    submitting: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.items) {
      const selectedItems = JSON.parse(decodeURIComponent(options.items))
      this.setData({ selectedItems })
      this.calculateTotal()
    }
    
    this.loadDefaultAddress()
  },

  /**
   * 网络请求封装
   */
  request(options) {
    const app = getApp()
    return app.request(options)
  },

  /**
   * 计算总金额
   */
  calculateTotal() {
    const { selectedItems } = this.data
    let totalAmount = 0
    let totalCount = 0
    
    selectedItems.forEach(item => {
      totalAmount += item.price * item.quantity
      totalCount += item.quantity
    })
    
    this.setData({
      totalAmount,
      totalCount
    })
  },

  /**
   * 加载默认地址
   */
  async loadDefaultAddress() {
    try {
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
        const defaultAddress = addressList.find(addr => addr.isDefault)
        
        if (defaultAddress) {
          this.setData({ selectedAddress: defaultAddress })
        }
      } else {
        // 使用测试数据
        const testAddress = {
          id: 1,
          name: '张三',
          phone: '13800138000',
          address: '北京市朝阳区建国路88号SOHO现代城',
          isDefault: true
        }
        this.setData({ selectedAddress: testAddress })
      }
      
    } catch (error) {
      console.error('加载默认地址失败:', error)
    }
  },

  /**
   * 选择地址
   */
  selectAddress() {
    wx.navigateTo({
      url: '/pages/address/index?select=true'
    })
  },

  /**
   * 设置选中的地址 (从地址页面返回时调用)
   */
  setSelectedAddress(address) {
    this.setData({
      selectedAddress: address
    })
  },

  /**
   * 备注输入
   */
  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    })
  },

  /**
   * 提交订单
   */
  async submitOrder() {
    const { selectedItems, selectedAddress, totalAmount, remark, submitting } = this.data
    
    if (submitting) return
    
    if (!selectedAddress) {
      this.showToast('请选择收货地址')
      return
    }
    
    if (selectedItems.length === 0) {
      this.showToast('没有选中的商品')
      return
    }
    
    try {
      this.setData({ submitting: true })
      
      const openid = await this.getOpenId()
      
      // 构建订单数据
      const orderData = {
        openid: openid,
        name: selectedAddress.name,
        phone: selectedAddress.phone,
        address: selectedAddress.address,
        remark: remark,
        bookItems: selectedItems.map(item => ({
          bookId: item.bookId,
          quantity: item.quantity
        }))
      }
      
      console.log('提交订单数据:', orderData)
      
      // 调用创建订单接口
      const res = await this.request({
        url: 'appoint/create',
        method: 'POST',
        data: orderData
      })
      
      if (res.data && res.data.code === 200) {
        const payData = res.data.data
        
        // 调起微信支付
        wx.requestPayment({
          appId: payData.appId,
          timeStamp: payData.timeStamp,
          nonceStr: payData.nonceStr,
          package: payData.package,
          signType: payData.signType,
          paySign: payData.paySign,
          success: () => {
            console.log('支付成功')
            this.showToast('支付成功')
            
            // 清除购物车中的已购买商品
            this.clearPurchasedCartItems()
            
            // 跳转到订单详情或我的订单页面
            setTimeout(() => {
              wx.switchTab({
                url: '/pages/order/index'
              })
            }, 1500)
          },
          fail: (err) => {
            console.log('支付失败', err)
            this.showToast('支付失败')
          }
        })
      } else {
        this.showToast(res.data.msg || '创建订单失败')
      }
      
    } catch (error) {
      console.error('提交订单失败:', error)
      this.showToast('提交失败')
    } finally {
      this.setData({ submitting: false })
    }
  },

  /**
   * 清除购物车中的已购买商品
   */
  async clearPurchasedCartItems() {
    try {
      const { selectedItems } = this.data
      
      // 删除购物车中的商品
      for (const item of selectedItems) {
        await this.request({
          url: `cart/remove/${item.id}`,
          method: 'DELETE'
        })
      }
      
    } catch (error) {
      console.error('清除购物车商品失败:', error)
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
