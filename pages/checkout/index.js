// pages/checkout/index.js
const API = require('../../utils/api/index.js')

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
    submitting: false,
    // 配送方式：0=自提，1=送货
    deliveryType: 1,
    // 当前订单号（用于支付回调上报）
    currentOutTradeNo: null,
    // 自提时的收货人信息
    pickupName: '',
    pickupPhone: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('结算页面参数:', options)
    
    // 处理从购物车来的商品
    if (options.items) {
      try {
        const selectedItems = JSON.parse(decodeURIComponent(options.items))
        console.log('购物车商品:', selectedItems)
        this.setData({ selectedItems })
        this.calculateTotal()
      } catch (error) {
        console.error('解析商品数据失败:', error)
      }
    }
    
    // 处理从详情页直接购买的商品
    if (options.from === 'detail' && options.book) {
      try {
        const bookData = JSON.parse(decodeURIComponent(options.book))
        console.log('详情页商品:', bookData)
        
        // 转换为订单商品格式
        const selectedItems = [{
          id: bookData.id,
          bookId: bookData.id,
          bookName: bookData.name,
          imageUrl: bookData.imageUrl,
          price: bookData.price,
          quantity: bookData.quantity
        }]
        
        this.setData({ selectedItems })
        this.calculateTotal()
      } catch (error) {
        console.error('解析书籍数据失败:', error)
      }
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
      // 优先使用折扣价，否则使用原价
      const price = item.discountPrice || item.price
      totalAmount += price * item.quantity
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
   * 自提收货人输入
   */
  onPickupNameInput(e) {
    this.setData({
      pickupName: e.detail.value
    })
  },

  /**
   * 自提手机号输入
   */
  onPickupPhoneInput(e) {
    this.setData({
      pickupPhone: e.detail.value
    })
  },

  /**
   * 切换配送方式
   */
  changeDeliveryType(e) {
    const type = parseInt(e.currentTarget.dataset.type)
    this.setData({
      deliveryType: type
    })
    
    // 如果是自提，清空地址选择
    if (type === 0) {
      wx.showToast({
        title: '已切换为自提',
        icon: 'success'
      })
    } else {
      // 如果是送货，加载默认地址
      if (!this.data.selectedAddress) {
        this.loadDefaultAddress()
      }
    }
  },

  /**
   * 提交订单
   */
  async submitOrder() {
    const { selectedItems, selectedAddress, totalAmount, remark, submitting, deliveryType, pickupName, pickupPhone } = this.data
    
    if (submitting) return
    
    // 送货方式需要地址
    if (deliveryType === 1 && !selectedAddress) {
      this.showToast('请选择收货地址')
      return
    }
    
    // 自提方式需要收货人和手机号
    if (deliveryType === 0) {
      if (!pickupName || !pickupName.trim()) {
        this.showToast('请输入收货人姓名')
        return
      }
      if (!pickupPhone || !pickupPhone.trim()) {
        this.showToast('请输入手机号')
        return
      }
      // 验证手机号格式
      if (!API.order.orderUtils.validatePhone(pickupPhone)) {
        this.showToast('请输入正确的手机号')
        return
      }
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
        deliveryType: deliveryType, // 0=自提，1=送货
        remark: remark,
        bookItems: selectedItems.map(item => ({
          bookId: item.bookId || item.id,
          quantity: item.quantity
        }))
      }
      
      // 如果是送货，添加地址信息
      if (deliveryType === 1 && selectedAddress) {
        orderData.name = selectedAddress.name
        orderData.phone = selectedAddress.phone
        orderData.address = selectedAddress.address
      }
      
      // 如果是自提，添加收货人信息
      if (deliveryType === 0) {
        orderData.name = pickupName
        orderData.phone = pickupPhone
        orderData.address = '自提' // 自提时地址填写"自提"
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
        
        // 从返回的 package 中提取订单号
        // package 格式：prepay_id=xxx
        // 实际订单号需要从订单创建返回或后端返回中获取
        // 这里假设后端会在 payData 中返回 outTradeNo
        const outTradeNo = payData.outTradeNo || this.extractOutTradeNo(payData)
        
        // 保存订单号
        this.setData({ currentOutTradeNo: outTradeNo })
        
        // 调起微信支付
        wx.requestPayment({
          appId: payData.appId,
          timeStamp: payData.timeStamp,
          nonceStr: payData.nonceStr,
          package: payData.package,
          signType: payData.signType,
          paySign: payData.paySign,
          success: async () => {
            console.log('支付成功，订单号:', outTradeNo)
            
            // 上报支付成功
            try {
              await API.order.reportPaySuccess(outTradeNo)
              console.log('支付成功已上报')
            } catch (error) {
              console.error('上报支付成功失败:', error)
            }
            
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
          fail: async (err) => {
            console.log('支付失败或取消', err)
            
            // 上报支付失败
            try {
              await API.order.reportPayFail(outTradeNo)
              console.log('支付失败已上报，订单已删除')
            } catch (error) {
              console.error('上报支付失败失败:', error)
            }
            
            this.showToast('支付已取消')
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
   * 从支付数据中提取订单号（备用方法）
   * 注意：最好让后端直接返回 outTradeNo
   */
  extractOutTradeNo(payData) {
    // 如果后端没有直接返回，这里返回null
    // 实际使用时需要后端在 payData 中添加 outTradeNo 字段
    console.warn('未找到订单号，请确保后端返回 outTradeNo')
    return null
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
