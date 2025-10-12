# API 接口使用文档

## 目录结构

```
utils/api/
├── index.js          # 统一导出文件
├── books.js          # 书籍管理接口
├── cart.js           # 购物车管理接口
├── categories.js     # 分类管理接口
├── order.js          # 订单管理接口
└── README.md         # 使用文档
```

## 快速开始

### 1. 引入方式

```javascript
// 方式一：引入所有API（推荐）
const API = require('../../utils/api/index.js')

// 方式二：按需引入
const booksAPI = require('../../utils/api/books.js')
const cartAPI = require('../../utils/api/cart.js')
```

### 2. 使用示例

#### 书籍管理 API

```javascript
const API = require('../../utils/api/index.js')

Page({
  data: {
    bookList: []
  },

  onLoad() {
    this.loadBooks()
  },

  // 获取书籍列表
  async loadBooks() {
    try {
      const res = await API.books.getBookList({
        page: 1,
        size: 10,
        categoryId: 1
      })
      
      if (res.data.code === 200) {
        // 处理价格：分转元
        const books = res.data.data.records.map(book => ({
          ...book,
          priceYuan: API.books.priceUtils.fenToYuan(book.price)
        }))
        
        this.setData({ bookList: books })
      }
    } catch (error) {
      console.error('加载书籍失败:', error)
    }
  },

  // 搜索书籍
  async searchBooks(keyword) {
    try {
      const res = await API.books.searchBooks(keyword)
      if (res.data.code === 200) {
        this.setData({ bookList: res.data.data })
      }
    } catch (error) {
      console.error('搜索失败:', error)
    }
  },

  // 获取书籍详情
  async getBookDetail(bookId) {
    try {
      const res = await API.books.getBookDetail(bookId)
      if (res.data.code === 200) {
        const book = res.data.data
        // 价格转换
        book.priceYuan = API.books.priceUtils.fenToYuan(book.price)
        return book
      }
    } catch (error) {
      console.error('获取详情失败:', error)
    }
  }
})
```

#### 购物车 API

```javascript
const API = require('../../utils/api/index.js')

Page({
  data: {
    cartList: [],
    totalPrice: 0
  },

  onLoad() {
    const app = getApp()
    this.openid = app.globalData.openid
    this.loadCart()
  },

  // 加载购物车
  async loadCart() {
    try {
      const res = await API.cart.getCartList(this.openid)
      if (res.data.code === 200) {
        const cartList = res.data.data
        
        // 计算总价（只计算选中的商品）
        const totalPrice = API.cart.cartUtils.calculateTotal(cartList, true)
        
        this.setData({
          cartList,
          totalPrice: API.cart.cartUtils.formatPrice(totalPrice)
        })
      }
    } catch (error) {
      console.error('加载购物车失败:', error)
    }
  },

  // 添加到购物车
  async addToCart(bookId, quantity = 1) {
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
        this.loadCart() // 刷新购物车
      }
    } catch (error) {
      console.error('添加失败:', error)
    }
  },

  // 更新数量
  async updateQuantity(cartId, quantity) {
    try {
      const res = await API.cart.updateCartItem(cartId, quantity)
      if (res.data.code === 200) {
        this.loadCart() // 刷新购物车
      }
    } catch (error) {
      console.error('更新失败:', error)
    }
  },

  // 选中/取消选中
  async toggleSelect(cartId, selected) {
    try {
      const res = await API.cart.selectCartItem(cartId, selected)
      if (res.data.code === 200) {
        this.loadCart() // 刷新购物车
      }
    } catch (error) {
      console.error('操作失败:', error)
    }
  },

  // 删除商品
  async removeItem(cartId) {
    try {
      const res = await API.cart.removeCartItem(cartId)
      if (res.data.code === 200) {
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        })
        this.loadCart() // 刷新购物车
      }
    } catch (error) {
      console.error('删除失败:', error)
    }
  },

  // 结算
  async checkout() {
    try {
      // 获取选中的商品
      const res = await API.cart.getSelectedItems(this.openid)
      if (res.data.code === 200) {
        const selectedItems = res.data.data
        
        if (selectedItems.length === 0) {
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
    } catch (error) {
      console.error('结算失败:', error)
    }
  }
})
```

#### 分类 API

```javascript
const API = require('../../utils/api/index.js')

Page({
  data: {
    categories: [],
    selectedCategory: null
  },

  onLoad() {
    this.loadCategories()
  },

  // 加载分类列表
  async loadCategories() {
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
  async getEnabledCategories() {
    try {
      const categories = await API.categories.getEnabledCategories()
      // 转换为选择器数据格式
      const pickerData = API.categories.categoryUtils.toPickerData(categories)
      this.setData({ pickerData })
    } catch (error) {
      console.error('获取分类失败:', error)
    }
  }
})
```

#### 订单 API

```javascript
const API = require('../../utils/api/index.js')

Page({
  data: {
    orderList: [],
    name: '',
    phone: '',
    address: ''
  },

  onLoad() {
    const app = getApp()
    this.openid = app.globalData.openid
    this.loadOrders()
  },

  // 加载订单列表
  async loadOrders() {
    try {
      const res = await API.order.getUserOrders(this.openid, 1, 10)
      if (res.data.code === 200) {
        const orders = res.data.data.records.map(order => ({
          ...order,
          statusText: API.order.orderUtils.formatStatus(order.status),
          statusColor: API.order.orderUtils.getStatusColor(order.status),
          totalPrice: API.order.orderUtils.formatPrice(order.money)
        }))
        
        this.setData({ orderList: orders })
      }
    } catch (error) {
      console.error('加载订单失败:', error)
    }
  },

  // 创建订单
  async createOrder() {
    try {
      // 验证手机号
      if (!API.order.orderUtils.validatePhone(this.data.phone)) {
        wx.showToast({
          title: '请输入正确的手机号',
          icon: 'none'
        })
        return
      }

      // 获取选中的购物车商品
      const cartRes = await API.cart.getSelectedItems(this.openid)
      if (cartRes.data.code !== 200 || cartRes.data.data.length === 0) {
        wx.showToast({
          title: '请选择商品',
          icon: 'none'
        })
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
        remark: this.data.remark || '',
        bookItems: bookItems
      }

      // 创建订单并发起支付
      const res = await API.order.createOrder(orderData)
      if (res.data.code === 200) {
        // 获取支付参数
        const payParams = res.data.data
        
        // 调用微信支付
        wx.requestPayment({
          ...payParams,
          success: (payRes) => {
            wx.showToast({
              title: '支付成功',
              icon: 'success'
            })
            // 跳转到订单列表
            wx.redirectTo({
              url: '/pages/order/index'
            })
          },
          fail: (err) => {
            console.error('支付失败:', err)
            wx.showToast({
              title: '支付失败',
              icon: 'none'
            })
          }
        })
      }
    } catch (error) {
      console.error('创建订单失败:', error)
    }
  },

  // 申请退款
  async applyRefund(orderId, reason) {
    try {
      wx.showModal({
        title: '确认退款',
        content: '确定要申请退款吗？',
        success: async (res) => {
          if (res.confirm) {
            const result = await API.order.applyRefund(orderId, reason)
            if (result.data.code === 200) {
              wx.showToast({
                title: '申请成功',
                icon: 'success'
              })
              this.loadOrders() // 刷新订单列表
            }
          }
        }
      })
    } catch (error) {
      console.error('申请退款失败:', error)
    }
  },

  // 根据状态查询订单
  async loadOrdersByStatus(status) {
    try {
      const res = await API.order.getOrdersByStatus(this.openid, status, 1, 10)
      if (res.data.code === 200) {
        this.setData({ orderList: res.data.data.records })
      }
    } catch (error) {
      console.error('加载订单失败:', error)
    }
  }
})
```

## 工具函数

### 书籍工具函数

```javascript
API.books.priceUtils.fenToYuan(9900)  // "99.00"
API.books.priceUtils.yuanToFen(99)    // 9900
```

### 购物车工具函数

```javascript
// 计算总价
API.cart.cartUtils.calculateTotal(cartItems, true)

// 计算商品总数
API.cart.cartUtils.calculateTotalQuantity(cartItems, false)

// 格式化价格
API.cart.cartUtils.formatPrice(9900)  // "99.00"
```

### 分类工具函数

```javascript
// 格式化状态
API.categories.categoryUtils.formatStatus(1)  // "启用"

// 检查是否启用
API.categories.categoryUtils.isEnabled(1)  // true

// 转换为选择器数据
API.categories.categoryUtils.toPickerData(categories)
```

### 订单工具函数

```javascript
// 格式化订单状态
API.order.orderUtils.formatStatus('0')  // "已支付"

// 获取状态颜色
API.order.orderUtils.getStatusColor('0')  // "#07c160"

// 验证手机号
API.order.orderUtils.validatePhone('13800138000')  // true

// 判断是否可以退款
API.order.orderUtils.canRefund('0')  // true

// 判断是否可以关闭
API.order.orderUtils.canClose('待支付')  // true
```

## 注意事项

1. **价格单位**：后端存储价格以分为单位，前端显示时需要除以100转换为元
2. **用户openid**：所有需要用户信息的接口都需要传入openid，可以从 `getApp().globalData.openid` 获取
3. **错误处理**：所有接口都已经封装了错误处理，失败时会自动显示toast提示
4. **加载提示**：默认会显示加载提示，如果不需要可以在请求参数中设置 `showLoading: false`
5. **异步处理**：所有接口都是异步的，使用 `async/await` 或 `Promise` 处理

## API 接口完整列表

### 书籍管理 (books.js)

| 方法名 | 说明 | 参数 |
|--------|------|------|
| getBookList | 获取书籍列表 | params |
| getBookDetail | 获取书籍详情 | id |
| addBook | 添加书籍 | data |
| updateBook | 更新书籍 | data |
| deleteBook | 删除书籍 | id |
| batchDeleteBooks | 批量删除 | ids |
| updateBookPrice | 更新价格 | bookId, newPrice |
| batchUpdatePrice | 批量调价 | data |
| adjustStock | 调整库存 | bookId, adjustment |
| getLowStockBooks | 库存预警 | threshold |
| searchBooks | 搜索书籍 | keyword |
| getBooksByCategory | 按分类查询 | categoryId |
| getBookStatistics | 统计信息 | - |

### 购物车管理 (cart.js)

| 方法名 | 说明 | 参数 |
|--------|------|------|
| addToCart | 添加到购物车 | data |
| updateCartItem | 更新数量 | cartId, quantity |
| removeCartItem | 删除商品 | cartId |
| clearCart | 清空购物车 | openid |
| getCartList | 获取购物车列表 | openid |
| batchSelectCartItems | 批量选中 | data |
| selectCartItem | 单个选中 | cartId, selected |
| getSelectedCount | 选中数量 | openid |
| getSelectedItems | 选中的商品 | openid |

### 分类管理 (categories.js)

| 方法名 | 说明 | 参数 |
|--------|------|------|
| addCategory | 添加分类 | data |
| getCategoryList | 获取分类列表 | - |
| deleteCategory | 删除分类 | id |
| updateCategory | 更新分类 | data |
| getEnabledCategories | 获取启用分类 | - |
| getCategoryById | 根据ID获取 | id |

### 订单管理 (order.js)

| 方法名 | 说明 | 参数 |
|--------|------|------|
| createOrder | 创建订单 | data |
| queryOrder | 查询订单 | outTradeNo |
| closeOrder | 关闭订单 | outTradeNo |
| applyRefund | 申请退款 | orderId, reason |
| executeRefund | 执行退款 | orderId, reason |
| getOrderList | 订单列表 | params |
| getUserOrders | 用户订单 | openid, page, size |
| getOrdersByStatus | 按状态查询 | openid, status, page, size |

## 更新日志

- 2024-01-01: 初始版本，完成所有基础接口封装

