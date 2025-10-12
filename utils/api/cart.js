/**
 * 购物车管理相关API接口
 * 基础路径: /cart
 */

const { request } = require('../request.js')

/**
 * 添加商品到购物车
 * @param {Object} data - 购物车数据
 * @param {String} data.openid - 用户openid（必填）
 * @param {Number} data.bookId - 书籍ID（必填）
 * @param {Number} data.quantity - 购买数量（必填）
 */
const addToCart = (data) => {
  return request({
    url: 'cart/add',
    method: 'POST',
    data: data
  })
}

/**
 * 更新购物车商品数量
 * @param {Number} cartId - 购物车ID
 * @param {Number} quantity - 新数量
 */
const updateCartItem = (cartId, quantity) => {
  return request({
    url: `cart/update/${cartId}`,
    method: 'PUT',
    data: { quantity }
  })
}

/**
 * 删除购物车商品
 * @param {Number} cartId - 购物车ID
 */
const removeCartItem = (cartId) => {
  return request({
    url: `cart/remove/${cartId}`,
    method: 'DELETE'
  })
}

/**
 * 清空用户购物车
 * @param {String} openid - 用户openid
 */
const clearCart = (openid) => {
  return request({
    url: 'cart/clear',
    method: 'DELETE',
    data: { openid }
  })
}

/**
 * 获取用户购物车列表
 * @param {String} openid - 用户openid
 */
const getCartList = (openid) => {
  return request({
    url: 'cart/list',
    method: 'GET',
    data: { openid }
  })
}

/**
 * 批量选中/取消选中商品
 * @param {Object} data - 选中数据
 * @param {Array} data.cartIds - 购物车ID列表
 * @param {Boolean} data.selected - 是否选中
 */
const batchSelectCartItems = (data) => {
  return request({
    url: 'cart/select',
    method: 'PUT',
    data: data
  })
}

/**
 * 单个商品选中/取消选中
 * @param {Number} cartId - 购物车ID
 * @param {Boolean} selected - 是否选中
 */
const selectCartItem = (cartId, selected) => {
  return request({
    url: `cart/select/${cartId}`,
    method: 'PUT',
    data: { selected }
  })
}

/**
 * 获取选中商品数量
 * @param {String} openid - 用户openid
 */
const getSelectedCount = (openid) => {
  return request({
    url: 'cart/selected/count',
    method: 'GET',
    data: { openid }
  })
}

/**
 * 获取选中的购物车项（用于结算）
 * @param {String} openid - 用户openid
 */
const getSelectedItems = (openid) => {
  return request({
    url: 'cart/selected',
    method: 'GET',
    data: { openid }
  })
}

/**
 * 购物车工具函数
 */
const cartUtils = {
  /**
   * 计算购物车总价
   * @param {Array} cartItems - 购物车商品列表
   * @param {Boolean} selectedOnly - 是否只计算选中的商品
   */
  calculateTotal: (cartItems, selectedOnly = false) => {
    if (!cartItems || cartItems.length === 0) {
      return 0
    }
    
    return cartItems
      .filter(item => !selectedOnly || item.selected)
      .reduce((total, item) => {
        return total + (item.price * item.quantity)
      }, 0)
  },

  /**
   * 计算购物车商品总数
   * @param {Array} cartItems - 购物车商品列表
   * @param {Boolean} selectedOnly - 是否只计算选中的商品
   */
  calculateTotalQuantity: (cartItems, selectedOnly = false) => {
    if (!cartItems || cartItems.length === 0) {
      return 0
    }
    
    return cartItems
      .filter(item => !selectedOnly || item.selected)
      .reduce((total, item) => {
        return total + item.quantity
      }, 0)
  },

  /**
   * 格式化价格显示（分转元）
   * @param {Number} price - 价格（分）
   */
  formatPrice: (price) => {
    return (price / 100).toFixed(2)
  }
}

module.exports = {
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  getCartList,
  batchSelectCartItems,
  selectCartItem,
  getSelectedCount,
  getSelectedItems,
  cartUtils
}

