// pages/order/index.js
const API = require('../../utils/api/index.js')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    appointmentList: [], // 订单列表数据
    currentTab: 0, // 当前标签页：0-全部 1-待支付 2-已支付 3-申请退款 4-已退款
  },

  /**
   * 获取订单列表数据
   */
  async getAppointmentList(status = null) {
    console.log('开始获取订单列表...', status);
    
    // 检查登录状态
    const app = getApp()
    const openid = app.globalData.openid || wx.getStorageSync('openid')
    
    console.log('当前openid:', openid);
    
    if (!openid) {
      console.log('openid为空，显示登录提示');
      this.showLoginTip()
      return
    }

    try {
      wx.showLoading({
        title: '加载中...',
      })

      console.log('准备调用订单列表API，参数:', { openid, status })

      // 使用封装的订单API
      let res
      if (status) {
        // 按状态查询
        res = await API.order.getOrdersByStatus(openid, status, 1, 50)
      } else {
        // 查询全部订单
        res = await API.order.getUserOrders(openid, 1, 50)
      }

      console.log('订单列表接口返回:', res)
      
      if (res.data && res.data.code === 200) {
        const orders = res.data.data.records || []
        
        // 处理订单数据
        const processedList = orders.map(item => ({
          ...item,
          // 格式化时间
          time: this.formatTime(item.time),
          createdat: this.formatTime(item.createdat),
          // 格式化状态
          statusText: API.order.orderUtils.formatStatus(item.status),
          statusColor: API.order.orderUtils.getStatusColor(item.status),
          // 格式化价格
          moneyYuan: API.order.orderUtils.formatPrice(item.money),
          // 是否可以退款
          canRefund: API.order.orderUtils.canRefund(item.status),
          // 是否可以关闭
          canClose: API.order.orderUtils.canClose(item.status)
        }))
        
        console.log('处理后的数据:', processedList)
        
        this.setData({
          appointmentList: processedList
        })
        
        console.log('数据已设置到页面，当前appointmentList:', this.data.appointmentList)
      } else {
        console.log('接口无数据或返回错误')
        this.setData({
          appointmentList: []
        })
      }
      
    } catch (err) {
      console.error('获取订单列表失败:', err)
      wx.showToast({
        title: '获取数据失败',
        icon: 'none'
      })
    } finally {
      console.log('请求完成，隐藏loading')
      wx.hideLoading()
    }
  },

  /**
   * 显示登录提示
   */
  showLoginTip() {
    wx.showModal({
      title: '提示',
      content: '请先登录后再查看订单记录',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 跳转到登录页面
          wx.navigateTo({
            url: '/pages/login/index',
          });
        }
      }
    });
  },

  /**
   * 格式化时间
   */
  formatTime(timeStr) {
    if (!timeStr) return '';
    
    try {
      const date = new Date(timeStr);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hour = date.getHours().toString().padStart(2, '0');
      const minute = date.getMinutes().toString().padStart(2, '0');
      
      return `${year}-${month}-${day} ${hour}:${minute}`;
    } catch (e) {
      return timeStr;
    }
  },

  /**
   * 登录成功回调
   */
  onLoginSuccess(openid) {
    console.log('登录成功，openid:', openid);
    // 登录成功后自动刷新数据
    this.getAppointmentList();
  },

  /**
   * 切换标签页
   */
  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })

    // 根据tab加载对应订单
    const statusMap = {
      0: null,              // 全部
      1: '待支付',          // 待支付
      2: '0',               // 已支付
      3: '1',               // 申请退款
      4: '2'                // 已退款
    }

    const status = statusMap[tab]
    this.getAppointmentList(status)
  },

  /**
   * 申请退款
   */
  async applyRefund(e) {
    const { orderId } = e.currentTarget.dataset

    wx.showModal({
      title: '申请退款',
      content: '确定要申请退款吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await API.order.applyRefund(orderId, '用户申请退款')
            if (result.data && result.data.code === 200) {
              wx.showToast({
                title: '申请成功',
                icon: 'success'
              })
              // 刷新列表
              this.getAppointmentList()
            }
          } catch (error) {
            console.error('申请退款失败:', error)
          }
        }
      }
    })
  },

  /**
   * 关闭订单
   */
  async closeOrder(e) {
    const { outTradeNo } = e.currentTarget.dataset

    wx.showModal({
      title: '关闭订单',
      content: '确定要关闭这个订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await API.order.closeOrder(outTradeNo)
            if (result.data && result.data.code === 200) {
              wx.showToast({
                title: '订单已关闭',
                icon: 'success'
              })
              // 刷新列表
              this.getAppointmentList()
            }
          } catch (error) {
            console.error('关闭订单失败:', error)
          }
        }
      }
    })
  },

  /**
   * 查看订单详情
   */
  viewOrderDetail(e) {
    const { outTradeNo } = e.currentTarget.dataset
    const order = e.currentTarget.dataset.order
    
    // 如果 dataset 中没有 outTradeNo，尝试从 order 对象中获取
    const orderNo = outTradeNo || (order && order.outTradeNo)
    
    if (!orderNo) {
      wx.showToast({
        title: '订单号不存在',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: `/pages/orderDetail/detail?id=${orderNo}`,
      success: function (res) {
        // 通过事件通道将完整订单对象传递到详情页，避免二次请求
        res.eventChannel.emit('acceptOrder', { order })
      }
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 添加登录状态监听器
    const app = getApp()
    app.addLoginListener(this.onLoginSuccess.bind(this))
    
    this.getAppointmentList()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 每次显示页面时检查登录状态并刷新数据
    const app = getApp()
    const openid = app.globalData.openid || wx.getStorageSync('openid')
    
    if (openid) {
      // 如果已登录，刷新数据
      this.getAppointmentList();
    } else {
      // 如果未登录，清空数据
      this.setData({
        appointmentList: []
      });
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    // 移除登录状态监听器
    const app = getApp()
    app.removeLoginListener(this.onLoginSuccess.bind(this))
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.getAppointmentList();
    wx.stopPullDownRefresh();
  },
})
