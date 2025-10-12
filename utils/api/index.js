/**
 * API接口统一导出文件
 * 使用方式：
 * const API = require('../../utils/api/index.js')
 * API.books.getBookList()
 * API.cart.getCartList(openid)
 * API.categories.getCategoryList()
 * API.order.createOrder(data)
 * API.address.getAddressList(openid)
 */

const books = require('./books.js')
const cart = require('./cart.js')
const categories = require('./categories.js')
const order = require('./order.js')
const address = require('./address.js')

module.exports = {
  books,
  cart,
  categories,
  order,
  address
}

