/**
 * API使用示例代码
 * 这个文件展示了如何在页面中使用封装好的API接口
 * 可以直接复制代码到实际页面中使用
 */

const API = require('./index.js')

/**
 * ========================
 * 书籍管理示例
 * ========================
 */

// 示例1：获取书籍列表并展示
const loadBooksExample = {
  data: {
    bookList: [],
    page: 1,
    size: 10,
    total: 0
  },

  // 加载书籍列表
  loadBooks: async function() {
    try {
      const res = await API.books.getBookList({
        page: this.data.page,
        size: this.data.size,
        categoryId: 1  // 可选：按分类筛选
      })

      if (res.data.code === 200) {
        const data = res.data.data
        
        // 处理书籍数据，转换价格
        const books = data.records.map(book => ({
          ...book,
          // 价格从分转换为元显示
          displayPrice: API.books.priceUtils.fenToYuan(book.price),
          // 库存状态
          stockStatus: book.stock > 10 ? '充足' : book.stock > 0 ? '紧张' : '缺货'
        }))

        this.setData({
          bookList: books,
          total: data.total
        })
      }
    } catch (error) {
      console.error('加载书籍列表失败:', error)
    }
  },

  // 搜索书籍
  searchBooks: async function(keyword) {
    try {
      const res = await API.books.searchBooks(keyword)
      if (res.data.code === 200) {
        this.setData({ bookList: res.data.data })
      }
    } catch (error) {
      console.error('搜索失败:', error)
    }
  },

  // 查看书籍详情
  viewBookDetail: async function(bookId) {
    try {
      const res = await API.books.getBookDetail(bookId)
      if (res.data.code === 200) {
        const book = res.data.data
        // 跳转到详情页
        wx.navigateTo({
          url: `/pages/bookDetail/index?id=${bookId}`
        })
      }
    } catch (error) {
      console.error('获取详情失败:', error)
    }
  }
}

/**
 * ========================
 * 购物车管理示例
 * ========================
 */

const cartExample = {
  data: {
    cartList: [],
    totalPrice: '0.00',
    totalQuantity: 0,
    selectedAll: false
  },

  onLoad: function() {
    const app = getApp()
    this.openid = app.globalData.openid
    this.loadCart()
  },

  // 加载购物车
  loadCart: async function() {
    try {
      const res = await API.cart.getCartList(this.openid)
      if (res.data.code === 200) {
        const cartList = res.data.data

        // 计算总价和总数量（只计算选中的）
        const totalPrice = API.cart.cartUtils.calculateTotal(cartList, true)
        const totalQuantity = API.cart.cartUtils.calculateTotalQuantity(cartList, true)
        
        // 检查是否全选
        const selectedAll = cartList.length > 0 && 
                           cartList.every(item => item.selected)

        this.setData({
          cartList,
          totalPrice: API.cart.cartUtils.formatPrice(totalPrice),
          totalQuantity,
          selectedAll
        })
      }
    } catch (error) {
      console.error('加载购物车失败:', error)
    }
  },

  // 添加商品到购物车
  addToCart: async function(bookId, quantity = 1) {
    try {
      const res = await API.cart.addToCart({
        openid: this.openid,
        bookId: bookId,
        quantity: quantity
      })

      if (res.data.code === 200) {
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        })
        // 刷新购物车
        this.loadCart()
      }
    } catch (error) {
      console.error('添加购物车失败:', error)
    }
  },

  // 修改商品数量
  changeQuantity: async function(e) {
    const { cartId, quantity } = e.currentTarget.dataset
    
    if (quantity < 1) {
      wx.showToast({
        title: '数量不能小于1',
        icon: 'none'
      })
      return
    }

    try {
      const res = await API.cart.updateCartItem(cartId, quantity)
      if (res.data.code === 200) {
        this.loadCart()
      }
    } catch (error) {
      console.error('更新数量失败:', error)
    }
  },

  // 选中/取消选中
  toggleSelect: async function(e) {
    const { cartId, selected } = e.currentTarget.dataset
    
    try {
      const res = await API.cart.selectCartItem(cartId, !selected)
      if (res.data.code === 200) {
        this.loadCart()
      }
    } catch (error) {
      console.error('操作失败:', error)
    }
  },

  // 全选/取消全选
  toggleSelectAll: async function() {
    const cartIds = this.data.cartList.map(item => item.id)
    const selected = !this.data.selectedAll

    try {
      const res = await API.cart.batchSelectCartItems({
        cartIds,
        selected
      })
      if (res.data.code === 200) {
        this.loadCart()
      }
    } catch (error) {
      console.error('操作失败:', error)
    }
  },

  // 删除商品
  deleteItem: async function(e) {
    const { cartId } = e.currentTarget.dataset

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个商品吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await API.cart.removeCartItem(cartId)
            if (result.data.code === 200) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
              this.loadCart()
            }
          } catch (error) {
            console.error('删除失败:', error)
          }
        }
      }
    })
  },

  // 去结算
  checkout: function() {
    if (this.data.totalQuantity === 0) {
      wx.showToast({
        title: '请选择商品',
        icon: 'none'
      })
      return
    }

    // 跳转到结算页面
    wx.navigateTo({
      url: '/pages/checkout/index'
    })
  }
}

/**
 * ========================
 * 分类管理示例
 * ========================
 */

const categoryExample = {
  data: {
    categories: [],
    selectedCategoryId: null,
    pickerArray: [],
    pickerIndex: 0
  },

  onLoad: function() {
    this.loadCategories()
  },

  // 加载分类列表
  loadCategories: async function() {
    try {
      const res = await API.categories.getCategoryList()
      if (res.data.code === 200) {
        this.setData({ categories: res.data.data })
      }
    } catch (error) {
      console.error('加载分类失败:', error)
    }
  },

  // 获取启用的分类（用于选择器）
  loadEnabledCategories: async function() {
    try {
      const categories = await API.categories.getEnabledCategories()
      
      // 转换为选择器格式
      const pickerArray = categories.map(cat => cat.categoryName)
      
      this.setData({
        categories,
        pickerArray
      })
    } catch (error) {
      console.error('加载分类失败:', error)
    }
  },

  // 选择分类
  onCategoryChange: function(e) {
    const index = e.detail.value
    const category = this.data.categories[index]
    
    this.setData({
      pickerIndex: index,
      selectedCategoryId: category.id
    })

    // 根据分类加载书籍
    this.loadBooksByCategory(category.id)
  },

  // 根据分类加载书籍
  loadBooksByCategory: async function(categoryId) {
    try {
      const res = await API.books.getBooksByCategory(categoryId)
      if (res.data.code === 200) {
        this.setData({ bookList: res.data.data })
      }
    } catch (error) {
      console.error('加载书籍失败:', error)
    }
  }
}

/**
 * ========================
 * 订单管理示例
 * ========================
 */

const orderExample = {
  data: {
    orderList: [],
    currentTab: 0,  // 0-全部 1-待支付 2-已支付 3-退款
    name: '',
    phone: '',
    address: '',
    remark: ''
  },

  onLoad: function() {
    const app = getApp()
    this.openid = app.globalData.openid
    this.loadOrders()
  },

  // 加载订单列表
  loadOrders: async function() {
    try {
      const res = await API.order.getUserOrders(this.openid, 1, 20)
      if (res.data.code === 200) {
        // 处理订单数据
        const orders = res.data.data.records.map(order => ({
          ...order,
          // 格式化状态文字
          statusText: API.order.orderUtils.formatStatus(order.status),
          // 状态颜色
          statusColor: API.order.orderUtils.getStatusColor(order.status),
          // 格式化价格
          displayPrice: API.order.orderUtils.formatPrice(order.money),
          // 是否可以退款
          canRefund: API.order.orderUtils.canRefund(order.status),
          // 是否可以关闭
          canClose: API.order.orderUtils.canClose(order.status)
        }))

        this.setData({ orderList: orders })
      }
    } catch (error) {
      console.error('加载订单失败:', error)
    }
  },

  // 根据状态加载订单
  loadOrdersByStatus: async function(status) {
    try {
      const res = await API.order.getOrdersByStatus(this.openid, status, 1, 20)
      if (res.data.code === 200) {
        this.setData({ orderList: res.data.data.records })
      }
    } catch (error) {
      console.error('加载订单失败:', error)
    }
  },

  // 切换Tab
  onTabChange: function(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })

    // 根据tab加载对应订单
    const statusMap = {
      0: null,           // 全部
      1: '待支付',
      2: '0',           // 已支付
      3: '1'            // 申请退款
    }

    const status = statusMap[tab]
    if (status) {
      this.loadOrdersByStatus(status)
    } else {
      this.loadOrders()
    }
  },

  // 创建订单并支付
  createOrder: async function() {
    // 验证表单
    if (!this.data.name) {
      wx.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }

    if (!API.order.orderUtils.validatePhone(this.data.phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }

    if (!this.data.address) {
      wx.showToast({ title: '请输入地址', icon: 'none' })
      return
    }

    try {
      // 获取选中的购物车商品
      const cartRes = await API.cart.getSelectedItems(this.openid)
      if (cartRes.data.code !== 200 || cartRes.data.data.length === 0) {
        wx.showToast({ title: '请选择商品', icon: 'none' })
        return
      }

      // 构建订单数据
      const bookItems = cartRes.data.data.map(item => ({
        bookId: item.bookId,
        quantity: item.quantity
      }))

      const orderData = {
        openid: this.openid,
        name: this.data.name,
        phone: this.data.phone,
        address: this.data.address,
        remark: this.data.remark,
        bookItems: bookItems
      }

      // 创建订单
      const res = await API.order.createOrder(orderData)
      if (res.data.code === 200) {
        const payParams = res.data.data

        // 调起微信支付
        wx.requestPayment({
          ...payParams,
          success: (payRes) => {
            wx.showToast({
              title: '支付成功',
              icon: 'success'
            })
            
            // 跳转到订单列表
            setTimeout(() => {
              wx.redirectTo({
                url: '/pages/order/index'
              })
            }, 1500)
          },
          fail: (err) => {
            console.error('支付失败:', err)
            if (err.errMsg !== 'requestPayment:fail cancel') {
              wx.showToast({
                title: '支付失败',
                icon: 'none'
              })
            }
          }
        })
      }
    } catch (error) {
      console.error('创建订单失败:', error)
    }
  },

  // 申请退款
  applyRefund: function(e) {
    const { orderId } = e.currentTarget.dataset

    wx.showModal({
      title: '申请退款',
      content: '确定要申请退款吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await API.order.applyRefund(orderId, '用户申请退款')
            if (result.data.code === 200) {
              wx.showToast({
                title: '申请成功',
                icon: 'success'
              })
              this.loadOrders()
            }
          } catch (error) {
            console.error('申请退款失败:', error)
          }
        }
      }
    })
  },

  // 关闭订单
  closeOrder: function(e) {
    const { outTradeNo } = e.currentTarget.dataset

    wx.showModal({
      title: '关闭订单',
      content: '确定要关闭这个订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await API.order.closeOrder(outTradeNo)
            if (result.data.code === 200) {
              wx.showToast({
                title: '订单已关闭',
                icon: 'success'
              })
              this.loadOrders()
            }
          } catch (error) {
            console.error('关闭订单失败:', error)
          }
        }
      }
    })
  },

  // 查看订单详情
  viewOrderDetail: function(e) {
    const { orderId } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/orderDetail/index?id=${orderId}`
    })
  }
}

/**
 * ========================
 * 综合示例：书籍列表页
 * ========================
 */

const completePageExample = {
  data: {
    categories: [],
    selectedCategoryId: null,
    bookList: [],
    keyword: '',
    page: 1,
    size: 10,
    hasMore: true
  },

  onLoad: function() {
    const app = getApp()
    this.openid = app.globalData.openid
    
    this.loadCategories()
    this.loadBooks()
  },

  // 加载分类
  loadCategories: async function() {
    const categories = await API.categories.getEnabledCategories()
    this.setData({ categories })
  },

  // 加载书籍
  loadBooks: async function() {
    try {
      const res = await API.books.getBookList({
        page: this.data.page,
        size: this.data.size,
        categoryId: this.data.selectedCategoryId,
        bookName: this.data.keyword
      })

      if (res.data.code === 200) {
        const data = res.data.data
        const books = data.records.map(book => ({
          ...book,
          displayPrice: API.books.priceUtils.fenToYuan(book.price)
        }))

        this.setData({
          bookList: this.data.page === 1 ? books : [...this.data.bookList, ...books],
          hasMore: this.data.page < data.pages
        })
      }
    } catch (error) {
      console.error('加载书籍失败:', error)
    }
  },

  // 搜索
  onSearch: function(e) {
    this.setData({
      keyword: e.detail.value,
      page: 1
    })
    this.loadBooks()
  },

  // 选择分类
  onCategoryClick: function(e) {
    const { id } = e.currentTarget.dataset
    this.setData({
      selectedCategoryId: id,
      page: 1
    })
    this.loadBooks()
  },

  // 加载更多
  onReachBottom: function() {
    if (this.data.hasMore) {
      this.setData({
        page: this.data.page + 1
      })
      this.loadBooks()
    }
  },

  // 添加到购物车
  addToCart: async function(e) {
    const { bookId } = e.currentTarget.dataset
    
    try {
      const res = await API.cart.addToCart({
        openid: this.openid,
        bookId: bookId,
        quantity: 1
      })

      if (res.data.code === 200) {
        wx.showToast({
          title: '已添加到购物车',
          icon: 'success'
        })
      }
    } catch (error) {
      console.error('添加失败:', error)
    }
  },

  // 查看详情
  viewDetail: function(e) {
    const { bookId } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/bookDetail/index?id=${bookId}`
    })
  }
}

// 导出示例（实际使用时不需要导出，直接将代码复制到页面中）
module.exports = {
  loadBooksExample,
  cartExample,
  categoryExample,
  orderExample,
  completePageExample
}

