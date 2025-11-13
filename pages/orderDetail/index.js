// pages/orderDetail/index.js
const API = require('../../utils/api/index.js')

Page({
  data: {
    order: null,
    orderItems: [],
    orderId: null,
  },

  onLoad(options) {
    const eventChannel = this.getOpenerEventChannel && this.getOpenerEventChannel()
    if (eventChannel && eventChannel.on) {
      eventChannel.on('acceptOrder', ({ order }) => {
        this.initOrder(order)
      })
    }

    if (options && options.id) {
      this.setData({ orderId: options.id })
    }
  },

  initOrder(order) {
    if (!order) return
    const orderItems = Array.isArray(order.orderItems) ? order.orderItems : []
    const normalizedItems = orderItems.map(item => ({
      bookName: item.bookName,
      quantity: item.quantity,
      // 订单文档标注 price 单位为分，显示为元
      priceYuan: API.order.orderUtils.formatPrice(item.price)
    }))

    // 处理订单状态和按钮显示
    const processedOrder = {
      ...order,
      statusText: API.order.orderUtils.formatStatus(order.status),
      statusColor: API.order.orderUtils.getStatusColor(order.status),
      canRefund: API.order.orderUtils.canRefund(order.status)
    }

    this.setData({
      order: processedOrder,
      orderItems: normalizedItems
    })
  },

  /**
   * 申请退款
   */
  handleRefund() {
    const { order } = this.data
    
    if (!order || !order.canRefund) {
      wx.showToast({
        title: '当前订单状态不可退款',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '申请退款',
      // content: '确定要申请退款吗？',
      editable: true,
      placeholderText: '请输入退款原因（可选）',
      success: async (res) => {
        if (res.confirm) {
          const reason = res.content || '用户申请退款'
          
          try {
            wx.showLoading({ title: '提交中...' })
            
            const result = await API.order.applyRefund(order.id, reason)
            
            wx.hideLoading()
            
            if (result.data && result.data.code === 200) {
              wx.showToast({
                title: '退款申请成功，等待审核！',
                icon: 'success'
              })
              
              // 更新订单状态
              setTimeout(() => {
                // 返回上一页并刷新
                wx.navigateBack()
              }, 1500)
            } else {
              wx.showToast({
                title: result.data?.msg || '申请失败',
                icon: 'none'
              })
            }
          } catch (error) {
            wx.hideLoading()
            console.error('申请退款失败:', error)
            wx.showToast({
              title: '申请失败，请重试',
              icon: 'none'
            })
          }
        }
      }
    })
  }
})


