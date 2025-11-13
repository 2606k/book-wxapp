/**
 * 订单管理相关API接口
 * 基础路径: /appoint
 */

const { request } = require('../request.js')

/**
 * 创建订单并发起支付
 * @param {Object} data - 订单数据
 * @param {String} data.openid - 用户openid（必填）
 * @param {String} data.name - 收件人姓名（必填）
 * @param {String} data.phone - 手机号码（11位）（必填）
 * @param {String} data.address - 收货地址（必填）
 * @param {String} data.remark - 订单备注
 * @param {Array} data.bookItems - 书籍列表（必填）
 * @param {Number} data.bookItems[].bookId - 书籍ID
 * @param {Number} data.bookItems[].quantity - 购买数量
 */
const createOrder = (data) => {
  return request({
    url: 'appoint/create',
    method: 'POST',
    data: data
  })
}

/**
 * 查询订单
 * @param {String} outTradeNo - 商户订单号
 */
const queryOrder = (outTradeNo) => {
  return request({
    url: 'appoint/queryOrder',
    method: 'GET',
    data: { outTradeNo }
  })
}

/**
 * 关闭订单
 * @param {String} outTradeNo - 商户订单号
 */
const closeOrder = (outTradeNo) => {
  return request({
    url: `appoint/closeOrder/${outTradeNo}`,
    method: 'GET'
  })
}

/**
 * 申请退款（用户端）
 * @param {Number} orderId - 订单ID
 * @param {String} reason - 退款原因
 */
const applyRefund = (orderId, reason = '') => {
  return request({
    url: `appoint/refund/apply?orderId=${orderId}${reason ? '&reason=' + encodeURIComponent(reason) : ''}`,
    method: 'POST'
  })
}

/**
 * 执行退款（管理员端）
 * @param {Number} orderId - 订单ID
 * @param {String} reason - 退款原因
 */
const executeRefund = (orderId, reason = '') => {
  return request({
    url: 'appoint/refund/execute',
    method: 'POST',
    data: {
      orderId,
      reason
    }
  })
}

/**
 * 订单列表查询
 * @param {Object} params - 查询参数
 * @param {String} params.openid - 用户openid（为空时查询全部订单）
 * @param {String} params.address - 地址关键词（模糊查询）
 * @param {String} params.phone - 手机号（精确查询）
 * @param {String} params.name - 姓名关键词（模糊查询）
 * @param {String} params.status - 订单状态
 * @param {Number} params.page - 当前页码，默认1
 * @param {Number} params.size - 每页大小，默认10
 */
const getOrderList = (params = {}) => {
  return request({
    url: 'appoint/list',
    method: 'GET',
    data: params
  })
}

/**
 * 获取用户订单列表
 * @param {String} openid - 用户openid
 * @param {Number} page - 页码
 * @param {Number} size - 每页大小
 */
const getUserOrders = (openid, page = 1, size = 10) => {
  return getOrderList({
    openid,
    page,
    size
  })
}

/**
 * 根据订单状态获取订单列表
 * @param {String} openid - 用户openid
 * @param {String} status - 订单状态
 * @param {Number} page - 页码
 * @param {Number} size - 每页大小
 */
const getOrdersByStatus = (openid, status, page = 1, size = 10) => {
  return getOrderList({
    openid,
    status,
    page,
    size
  })
}

/**
 * 订单状态枚举
 */
const ORDER_STATUS = {
  UNPAID: '待支付',      // 订单已创建，等待支付
  PAID: '0',            // 已支付
  REFUND_APPLY: '1',    // 申请退款
  REFUNDED: '2',        // 已退款
  COMPLETED: '3'        // 已完成
}

/**
 * 前端上报支付成功（幂等）
 * @param {String} outTradeNo - 商户订单号
 */
const reportPaySuccess = (outTradeNo) => {
  return request({
    url: `appoint/client/pay/success?outTradeNo=${outTradeNo}`,
    method: 'POST'
  })
}

/**
 * 前端上报支付失败/取消（幂等）
 * @param {String} outTradeNo - 商户订单号
 */
const reportPayFail = (outTradeNo) => {
  return request({
    url: `appoint/client/pay/fail?outTradeNo=${outTradeNo}`,
    method: 'POST'
  })
}

/**
 * 订单工具函数
 */
const orderUtils = {
  /**
   * 格式化订单状态
   * @param {String} status - 订单状态
   */
  formatStatus: (status) => {
    const statusMap = {
      '待支付': '待支付',
      '0': '已支付',
      '1': '申请退款',
      '2': '已退款',
      '3': '已完成'
    }
    return statusMap[status] || '未知状态'
  },

  /**
   * 获取订单状态文字颜色
   * @param {String} status - 订单状态
   */
  getStatusColor: (status) => {
    const colorMap = {
      '待支付': '#ff9500',
      '0': '#07c160',
      '1': '#10aeff',
      '2': '#999999',
      '3': '#52c41a'
    }
    return colorMap[status] || '#000000'
  },

  /**
   * 计算订单总金额
   * @param {Array} orderItems - 订单商品列表
   */
  calculateOrderTotal: (orderItems) => {
    if (!orderItems || orderItems.length === 0) {
      return 0
    }
    return orderItems.reduce((total, item) => {
      return total + (item.price * item.quantity)
    }, 0)
  },

  /**
   * 计算订单商品总数
   * @param {Array} orderItems - 订单商品列表
   */
  calculateTotalQuantity: (orderItems) => {
    if (!orderItems || orderItems.length === 0) {
      return 0
    }
    return orderItems.reduce((total, item) => {
      return total + item.quantity
    }, 0)
  },

  /**
   * 格式化价格显示（分转元）
   * @param {Number} price - 价格（分）
   */
  formatPrice: (price) => {
    return (price / 100).toFixed(2)
  },

  /**
   * 验证手机号格式
   * @param {String} phone - 手机号
   */
  validatePhone: (phone) => {
    const phoneReg = /^1[3-9]\d{9}$/
    return phoneReg.test(phone)
  },

  /**
   * 生成订单号（本地临时使用，实际订单号由后端生成）
   */
  generateOrderNo: () => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `ORDER${timestamp}${random}`
  },

  /**
   * 判断订单是否可以申请退款
   * @param {String} status - 订单状态
   */
  canRefund: (status) => {
    // 只有已支付(0)的订单可以申请退款
    return status === '0' || status === ORDER_STATUS.PAID
  },

  /**
   * 判断订单是否正在退款中
   * @param {String} status - 订单状态
   */
  isRefunding: (status) => {
    return status === '1' || status === ORDER_STATUS.REFUND_APPLY
  },

  /**
   * 判断订单是否已退款
   * @param {String} status - 订单状态
   */
  isRefunded: (status) => {
    return status === '2' || status === ORDER_STATUS.REFUNDED
  },

  /**
   * 判断订单是否已完成
   * @param {String} status - 订单状态
   */
  isCompleted: (status) => {
    return status === '3' || status === ORDER_STATUS.COMPLETED
  },

  /**
   * 判断订单是否可以关闭
   * @param {String} status - 订单状态
   */
  canClose: (status) => {
    // 只有待支付的订单可以关闭
    return status === '待支付' || status === ORDER_STATUS.UNPAID
  }
}

module.exports = {
  createOrder,
  queryOrder,
  closeOrder,
  applyRefund,
  executeRefund,
  getOrderList,
  getUserOrders,
  getOrdersByStatus,
  reportPaySuccess,
  reportPayFail,
  ORDER_STATUS,
  orderUtils
}

