/**
 * 分类管理相关API接口
 * 基础路径: /category
 */

const { request } = require('../request.js')

/**
 * 添加分类
 * @param {Object} data - 分类数据
 * @param {String} data.categoryName - 分类名称（必填）
 * @param {String} data.description - 分类描述
 * @param {Number} data.sortOrder - 排序顺序
 * @param {Number} data.status - 分类状态（1-启用，0-禁用），默认启用
 */
const addCategory = (data) => {
  return request({
    url: 'category/add',
    method: 'POST',
    data: data
  })
}

/**
 * 获取分类列表
 * 返回所有书籍分类列表
 */
const getCategoryList = () => {
  return request({
    url: 'category/list',
    method: 'GET'
  })
}

/**
 * 删除分类
 * @param {Number} id - 分类ID
 */
const deleteCategory = (id) => {
  return request({
    url: 'category/delete',
    method: 'POST',
    data: { id }
  })
}

/**
 * 更新分类信息
 * @param {Object} data - 分类数据
 * @param {Number} data.id - 分类ID（必填）
 * @param {String} data.categoryName - 分类名称
 * @param {String} data.description - 分类描述
 * @param {Number} data.sortOrder - 排序顺序
 * @param {Number} data.status - 分类状态
 */
const updateCategory = (data) => {
  return request({
    url: 'category/update',
    method: 'POST',
    data: data
  })
}

/**
 * 获取启用的分类列表
 * 用于前端选择器，只返回启用状态的分类
 */
const getEnabledCategories = async () => {
  try {
    const result = await getCategoryList()
    if (result.data && result.data.code === 200) {
      // 获取分类数据（支持分页格式和数组格式）
      let categoriesData = []
      
      if (result.data.data.records) {
        // 分页格式
        categoriesData = result.data.data.records
      } else if (Array.isArray(result.data.data)) {
        // 数组格式
        categoriesData = result.data.data
      }
      
      // 映射字段名并排序
      return categoriesData
        .map(cat => ({
          id: cat.servicetypeid || cat.id,
          categoryName: cat.name || cat.categoryName,
          imageUrl: cat.imageurl || cat.imageUrl,
          status: cat.status,
          sortOrder: cat.sortOrder || 0,
          createdat: cat.createdat
        }))
        .sort((a, b) => {
          // 按sortOrder升序排序，sortOrder相同则按创建时间排序
          if (a.sortOrder !== b.sortOrder) {
            return a.sortOrder - b.sortOrder
          }
          return new Date(a.createdat) - new Date(b.createdat)
        })
    }
    return []
  } catch (error) {
    console.error('获取启用分类列表失败:', error)
    return []
  }
}

/**
 * 根据ID获取分类详情
 * @param {Number} id - 分类ID
 */
const getCategoryById = async (id) => {
  try {
    const result = await getCategoryList()
    if (result.data && result.data.code === 200) {
      // 获取分类数据（支持分页格式和数组格式）
      let categoriesData = []
      
      if (result.data.data.records) {
        // 分页格式
        categoriesData = result.data.data.records
      } else if (Array.isArray(result.data.data)) {
        // 数组格式
        categoriesData = result.data.data
      }
      
      // 查找指定ID的分类（兼容 servicetypeid 和 id）
      const category = categoriesData.find(cat => 
        (cat.servicetypeid && cat.servicetypeid === id) || 
        (cat.id && cat.id === id)
      )
      
      if (category) {
        return {
          id: category.servicetypeid || category.id,
          categoryName: category.name || category.categoryName,
          imageUrl: category.imageurl || category.imageUrl,
          createdat: category.createdat
        }
      }
    }
    return null
  } catch (error) {
    console.error('获取分类详情失败:', error)
    return null
  }
}

/**
 * 分类工具函数
 */
const categoryUtils = {
  /**
   * 格式化分类状态
   * @param {Number|String} status - 分类状态
   */
  formatStatus: (status) => {
    if (status === 1 || status === '启用') {
      return '启用'
    } else if (status === 0 || status === '禁用') {
      return '禁用'
    }
    return '未知'
  },

  /**
   * 检查分类是否启用
   * @param {Number|String} status - 分类状态
   */
  isEnabled: (status) => {
    return status === 1 || status === '启用'
  },

  /**
   * 分类数组转选择器数据格式
   * @param {Array} categories - 分类列表
   */
  toPickerData: (categories) => {
    if (!categories || categories.length === 0) {
      return []
    }
    return categories.map(category => ({
      value: category.id,
      label: category.categoryName
    }))
  }
}

module.exports = {
  addCategory,
  getCategoryList,
  deleteCategory,
  updateCategory,
  getEnabledCategories,
  getCategoryById,
  categoryUtils
}

