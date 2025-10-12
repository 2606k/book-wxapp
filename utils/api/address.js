/**
 * 地址管理相关API接口
 * 基础路径: /address
 */

const { request } = require('../request.js')

/**
 * 获取地址列表
 * @param {String} openid - 用户openid
 */
const getAddressList = (openid) => {
  return request({
    url: 'address/list',
    method: 'POST',
    data: { openid }
  })
}

/**
 * 添加地址
 * @param {Object} data - 地址数据
 * @param {String} data.openid - 用户openid
 * @param {String} data.name - 收件人姓名
 * @param {String} data.phone - 手机号
 * @param {String} data.address - 详细地址
 * @param {Boolean} data.isDefault - 是否默认地址
 */
const addAddress = (data) => {
  return request({
    url: 'address/add',
    method: 'POST',
    data: data
  })
}

/**
 * 更新地址
 * @param {Object} data - 地址数据
 * @param {Number} data.id - 地址ID
 * @param {String} data.openid - 用户openid
 * @param {String} data.name - 收件人姓名
 * @param {String} data.phone - 手机号
 * @param {String} data.address - 详细地址
 * @param {Boolean} data.isDefault - 是否默认地址
 */
const updateAddress = (data) => {
  return request({
    url: 'address/update',
    method: 'POST',
    data: data
  })
}

/**
 * 删除地址
 * @param {Number} id - 地址ID
 */
const deleteAddress = (id) => {
  return request({
    url: 'address/delete',
    method: 'POST',
    data: { id }
  })
}

/**
 * 设置默认地址
 * @param {Number} id - 地址ID
 * @param {String} openid - 用户openid
 */
const setDefaultAddress = (id, openid) => {
  return request({
    url: 'address/setDefault',
    method: 'POST',
    data: { id, openid }
  })
}

/**
 * 获取默认地址
 * @param {String} openid - 用户openid
 */
const getDefaultAddress = (openid) => {
  return request({
    url: 'address/default',
    method: 'GET',
    data: { openid }
  })
}

/**
 * 根据ID获取地址详情
 * @param {Number} id - 地址ID
 */
const getAddressById = (id) => {
  return request({
    url: `address/${id}`,
    method: 'GET'
  })
}

/**
 * 地址工具函数
 */
const addressUtils = {
  /**
   * 验证手机号格式
   * @param {String} phone - 手机号
   */
  validatePhone: (phone) => {
    const phoneReg = /^1[3-9]\d{9}$/
    return phoneReg.test(phone)
  },

  /**
   * 验证姓名
   * @param {String} name - 姓名
   */
  validateName: (name) => {
    return name && name.trim().length >= 2 && name.trim().length <= 20
  },

  /**
   * 验证地址
   * @param {String} address - 地址
   */
  validateAddress: (address) => {
    return address && address.trim().length >= 5
  },

  /**
   * 格式化地址显示
   * @param {Object} addressData - 地址对象
   */
  formatAddress: (addressData) => {
    if (!addressData) return ''
    return `${addressData.name} ${addressData.phone} ${addressData.address}`
  },

  /**
   * 脱敏手机号
   * @param {String} phone - 手机号
   */
  maskPhone: (phone) => {
    if (!phone || phone.length !== 11) return phone
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  }
}

module.exports = {
  getAddressList,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getDefaultAddress,
  getAddressById,
  addressUtils
}

