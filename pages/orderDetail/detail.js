// pages/orderDetail/detail.js
const API = require('../../utils/api/index.js')

Page({
  data: {
    order: null,
    orderItems: [],
    orderId: null,
    outTradeNo: null,
    transactionId: null,
    merchantId: null,
  },

  async onLoad(options) {
    console.log('订单详情页 onLoad，接收到的参数:', options)
    
    // 设置 eventChannel 监听（作为备用方案）
    const eventChannel = this.getOpenerEventChannel && this.getOpenerEventChannel()
    let orderFromChannel = null
    
    if (eventChannel && eventChannel.on) {
      eventChannel.on('acceptOrder', ({ order }) => {
        console.log('从 eventChannel 接收到订单数据:', order)
        if (order) {
          orderFromChannel = order
          // 如果接口查询失败，使用 eventChannel 的数据
          if (!this.data.order) {
            this.initOrder(order)
          }
        }
      })
    }

    // 优先通过接口查询订单详情
    // 支持多种参数名：
    // 1. merchant_trade_no - 微信支付回调时的参数名
    // 2. id - 普通跳转时的参数名
    // 3. outTradeNo - 备用参数名
    const outTradeNo = options?.merchant_trade_no || options?.id || options?.outTradeNo
    
    // 保存其他参数（transaction_id, merchant_id）以备后用
    if (options?.transaction_id) {
      this.setData({ transactionId: options.transaction_id })
    }
    if (options?.merchant_id) {
      this.setData({ merchantId: options.merchant_id })
    }
    
    if (outTradeNo) {
      console.log('准备查询订单详情，outTradeNo:', outTradeNo)
      
      // 验证 outTradeNo 是否有效（不能是 undefined、null 或空字符串）
      if (outTradeNo === 'undefined' || outTradeNo === 'null' || (typeof outTradeNo === 'string' && outTradeNo.trim() === '')) {
        console.warn('outTradeNo 无效:', outTradeNo)
        // 如果 eventChannel 有数据，使用 eventChannel 的数据，否则提示错误
        if (orderFromChannel) {
          this.initOrder(orderFromChannel)
        } else {
          // 等待一下，看 eventChannel 是否有数据
          setTimeout(() => {
            if (orderFromChannel) {
              this.initOrder(orderFromChannel)
            } else {
              wx.showToast({
                title: '订单号无效',
                icon: 'none'
              })
              setTimeout(() => {
                wx.navigateBack()
              }, 1500)
            }
          }, 300)
        }
        return
      }
      
      this.setData({ outTradeNo })
      
      try {
        wx.showLoading({ title: '加载中...' })
        console.log('调用接口获取订单详情:', outTradeNo)
        const result = await API.order.getOrderDetail(outTradeNo)
        console.log('订单详情接口返回:', result)
        wx.hideLoading()
        
        if (result.data && result.data.code === 200 && result.data.data) {
          console.log('订单详情获取成功，订单数据:', result.data.data)
          this.initOrder(result.data.data)
        } else {
          console.error('订单详情接口返回错误:', result.data)
          // 如果接口失败，尝试使用 eventChannel 的数据
          if (orderFromChannel) {
            console.log('使用 eventChannel 的订单数据')
            this.initOrder(orderFromChannel)
          } else {
            // 等待一下，看 eventChannel 是否有数据
            setTimeout(() => {
              if (orderFromChannel) {
                console.log('延迟后使用 eventChannel 的订单数据')
                this.initOrder(orderFromChannel)
              } else {
                const errorMsg = result.data?.msg || '订单不存在'
                console.error('订单不存在:', errorMsg)
                wx.showToast({
                  title: errorMsg,
                  icon: 'none',
                  duration: 2000
                })
                // 不自动返回，让用户手动返回
              }
            }, 500)
          }
        }
      } catch (error) {
        wx.hideLoading()
        console.error('获取订单详情失败:', error)
        // 如果接口失败，尝试使用 eventChannel 的数据
        if (orderFromChannel) {
          console.log('接口异常，使用 eventChannel 的订单数据')
          this.initOrder(orderFromChannel)
        } else {
          // 等待一下，看 eventChannel 是否有数据
          setTimeout(() => {
            if (orderFromChannel) {
              console.log('延迟后使用 eventChannel 的订单数据')
              this.initOrder(orderFromChannel)
            } else {
              wx.showToast({
                title: '获取订单详情失败，请稍后重试',
                icon: 'none',
                duration: 2000
              })
              // 不自动返回，让用户手动返回
            }
          }, 500)
        }
      }
      return
    }

    // 如果没有参数，等待 eventChannel 的数据
    console.log('没有 outTradeNo 参数，等待 eventChannel 数据')
    if (orderFromChannel) {
      this.initOrder(orderFromChannel)
    } else {
      // 等待一下，看 eventChannel 是否有数据
      setTimeout(() => {
        if (orderFromChannel) {
          console.log('延迟后使用 eventChannel 的订单数据')
          this.initOrder(orderFromChannel)
        } else {
          console.warn('缺少订单信息，既没有参数也没有 eventChannel 数据')
          wx.showToast({
            title: '缺少订单信息',
            icon: 'none',
            duration: 2000
          })
          // 不自动返回，让用户手动返回
        }
      }, 500)
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
      canRefund: API.order.orderUtils.canRefund(order.status),
      confirm: API.order.orderUtils.confirm(order.status),
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
  },

  async handleConfirm() {
    const { order } = this.data;
  
    // 如果订单不存在或者没有确认信息，直接提示失败
    if (!order || !order.confirm) {
      wx.showToast({
        title: '当前订单状态不可确认',
        icon: 'none',
        duration: 2000
      });
      return;
    }
  
    // 拉起微信的确认收货组件
    if (wx.openBusinessView) {
      wx.openBusinessView({
        businessType: 'weappOrderConfirm',
        extraData: {
          // merchant_id: order.mchId,
          merchant_trade_no: order.outTradeNo,
          transaction_id: order.transactionId
        },
        success: async (e) => {
          console.log("e1 - 微信确认收货组件操作成功", e);

          // 判断微信操作是否成功
          if (e.extraData.status === 'success') {
            // 调用自己的接口更新订单状态
            try {
              const result = await API.order.setUserPaySuccess(order.id);
              if (result.data && result.data.code === 200) {
                wx.showToast({
                  title: '确认收货成功',
                  icon: 'success',
                  duration: 2000
                });

                // 成功后刷新页面
                setTimeout(() => {
                  wx.navigateBack();
                }, 1500);
              } else {
                wx.showToast({
                  title: result.data?.msg || '更新订单状态失败',
                  icon: 'none',
                  duration: 2000
                });
              }
            } catch (error) {
              console.error("更新订单状态失败:", error);
              wx.showToast({
                title: '更新订单状态失败',
                icon: 'none',
                duration: 2000
              });
            }
          } else if (e.extraData.status === 'fail') {
            console.log('用户确认收货失败');
            wx.showToast({
              title: '用户确认收货失败',
              icon: 'none',
              duration: 2000
            });
          } else if (e.extraData.status === 'cancel') {
            console.log('用户取消确认收货');
            wx.showToast({
              title: '用户取消确认收货',
              icon: 'none',
              duration: 2000
            });
          }
        },
        fail: (e) => {
          console.error("拉起微信确认收货组件失败:", e);
          wx.showToast({
            title: '拉起微信确认收货组件失败',
            icon: 'none',
            duration: 2000
          });
        },
        complete: (e) => {
          console.log("微信确认收货组件操作完成", e);
          console.log("无论是否成功都会执行");
        }
      });
    } else {
      // 引导用户升级微信版本
      wx.showToast({
        title: "请升级微信版本",
        icon: "none",
        duration: 3000
      });
    }
  }
  
})

