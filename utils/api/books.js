/**
 * 书籍管理相关API接口
 * 基础路径: /api/books
 */

const { request } = require('../request.js')

/**
 * 获取书籍列表（分页查询）
 * @param {Object} params - 查询参数
 * @param {Number} params.page - 页码，默认1
 * @param {Number} params.size - 每页数量，默认10
 * @param {String} params.bookName - 书籍名称（模糊查询）
 * @param {Number} params.minPrice - 最低价格（元）
 * @param {Number} params.maxPrice - 最高价格（元）
 * @param {String} params.stockStatus - 库存状态：inStock-有库存，lowStock-低库存，outOfStock-无库存
 * @param {Number} params.categoryId - 分类ID
 */
const getBookList = (params = {}) => {
  return request({
    url: 'api/books/list',
    method: 'GET',
    data: params
  })
}

/**
 * 根据ID获取书籍详情
 * @param {Number} id - 书籍ID
 */
const getBookDetail = (id) => {
  return request({
    url: `api/books/${id}`,
    method: 'GET'
  })
}

/**
 * 添加书籍
 * @param {Object} data - 书籍数据
 * @param {String} data.bookName - 书籍名称（必填）
 * @param {Number} data.categoryId - 分类ID（必填）
 * @param {String} data.author - 作者
 * @param {String} data.publisher - 出版社
 * @param {String} data.publishDate - 出版日期
 * @param {String} data.imageurl - 图片URL
 * @param {Number} data.price - 价格（分）（必填）
 * @param {String} data.description - 描述
 * @param {Number} data.stock - 库存（必填）
 */
const addBook = (data) => {
  return request({
    url: 'api/books/add',
    method: 'POST',
    data: data
  })
}

/**
 * 更新书籍信息
 * @param {Object} data - 书籍数据
 * @param {Number} data.id - 书籍ID（必填）
 * @param {String} data.bookName - 书籍名称（必填）
 * @param {Number} data.categoryId - 分类ID（必填）
 * @param {Number} data.price - 价格（分）（必填）
 * @param {Number} data.stock - 库存（必填）
 */
const updateBook = (data) => {
  return request({
    url: 'api/books/update',
    method: 'POST',
    data: data
  })
}

/**
 * 删除书籍
 * @param {Number} id - 书籍ID
 */
const deleteBook = (id) => {
  return request({
    url: `api/books/delete/${id}`,
    method: 'POST'
  })
}

/**
 * 批量删除书籍
 * @param {Array} ids - 书籍ID列表
 */
const batchDeleteBooks = (ids) => {
  return request({
    url: 'api/books/batchDelete',
    method: 'POST',
    data: ids
  })
}

/**
 * 更新书籍价格
 * @param {Number} bookId - 书籍ID
 * @param {Number} newPrice - 新价格（分）
 */
const updateBookPrice = (bookId, newPrice) => {
  return request({
    url: 'api/books/updatePrice',
    method: 'POST',
    data: {
      bookId,
      newPrice
    }
  })
}

/**
 * 批量调整价格
 * @param {Object} data - 调价数据
 * @param {Array} data.bookIds - 书籍ID列表
 * @param {String} data.adjustType - 调整类型：percentage-按百分比，fixed-按固定金额
 * @param {Number} data.adjustValue - 调整值
 */
const batchUpdatePrice = (data) => {
  return request({
    url: 'api/books/batchUpdatePrice',
    method: 'POST',
    data: data
  })
}

/**
 * 调整库存
 * @param {Number} bookId - 书籍ID
 * @param {Number} adjustment - 调整数量（正数增加，负数减少）
 */
const adjustStock = (bookId, adjustment) => {
  return request({
    url: 'api/books/adjustStock',
    method: 'POST',
    data: {
      bookId,
      adjustment
    }
  })
}

/**
 * 获取库存预警书籍
 * @param {Number} threshold - 库存阈值，默认10
 */
const getLowStockBooks = (threshold = 10) => {
  return request({
    url: 'api/books/lowStock',
    method: 'GET',
    data: { threshold }
  })
}

/**
 * 搜索书籍
 * @param {String} keyword - 搜索关键词
 */
const searchBooks = (keyword) => {
  return request({
    url: 'api/books/search',
    method: 'GET',
    data: { keyword }
  })
}

/**
 * 根据分类获取书籍列表
 * @param {Number} categoryId - 分类ID
 */
const getBooksByCategory = (categoryId) => {
  return request({
    url: `api/books/category/${categoryId}`,
    method: 'GET'
  })
}

/**
 * 获取书籍统计信息
 */
const getBookStatistics = () => {
  return request({
    url: 'api/books/statistics',
    method: 'GET'
  })
}

/**
 * 价格转换工具函数
 */
const priceUtils = {
  // 分转元
  fenToYuan: (fen) => {
    return (fen / 100).toFixed(2)
  },
  // 元转分
  yuanToFen: (yuan) => {
    return Math.round(yuan * 100)
  }
}

module.exports = {
  getBookList,
  getBookDetail,
  addBook,
  updateBook,
  deleteBook,
  batchDeleteBooks,
  updateBookPrice,
  batchUpdatePrice,
  adjustStock,
  getLowStockBooks,
  searchBooks,
  getBooksByCategory,
  getBookStatistics,
  priceUtils
}

