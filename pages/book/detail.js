// pages/book/detail.js
const API = require('../../utils/api/index')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    bookId: null,
    book: null,
    loading: true,
    quantity: 1, // 购买数量
    showActionSheet: false, // 是否显示操作菜单
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('书籍详情页加载，参数:', options)
    if (options.id) {
      this.setData({ bookId: options.id })
      this.loadBookDetail()
    } else {
      wx.showToast({
        title: '书籍ID不存在',
        icon: 'none',
        duration: 2000
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 2000)
    }
  },

  /**
   * 加载书籍详情
   */
  async loadBookDetail() {
    try {
      this.setData({ loading: true })

      const res = await API.books.getBookDetail(this.data.bookId)
      console.log('书籍详情响应:', res)

      if (res.data && res.data.code === 200) {
        const bookData = res.data.data
        
        // 统一字段名映射
        const book = {
          id: bookData.id,
          name: bookData.bookName || bookData.name,
          author: bookData.author,
          publisher: bookData.publisher,
          imageUrl: bookData.imageurl || bookData.imageUrl, // 后端返回的是 imageurl
          price: bookData.price,
          originalPrice: bookData.originalPrice,
          stock: bookData.stock,
          isbn: bookData.isbn,
          categoryName: bookData.categoryName,
          publishDate: bookData.publishDate,
          pages: bookData.pages,
          language: bookData.language || '中文',
          description: bookData.description
        }
        
        console.log('处理后的书籍数据:', book)
        
        this.setData({
          book: book,
          loading: false
        })

        // 设置页面标题
        wx.setNavigationBarTitle({
          title: book.name || '书籍详情'
        })
      } else {
        throw new Error(res.data?.msg || '获取书籍详情失败')
      }
    } catch (error) {
      console.error('加载书籍详情失败:', error)
      this.setData({ loading: false })
      
      wx.showModal({
        title: '加载失败',
        content: error.message || '无法加载书籍详情',
        showCancel: false,
        confirmText: '返回',
        success: () => {
          wx.navigateBack()
        }
      })
    }
  },

  /**
   * 增加数量
   */
  increaseQuantity() {
    if (this.data.quantity < this.data.book.stock) {
      this.setData({
        quantity: this.data.quantity + 1
      })
    } else {
      wx.showToast({
        title: '库存不足',
        icon: 'none'
      })
    }
  },

  /**
   * 减少数量
   */
  decreaseQuantity() {
    if (this.data.quantity > 1) {
      this.setData({
        quantity: this.data.quantity - 1
      })
    }
  },

  /**
   * 输入数量
   */
  onQuantityInput(e) {
    let value = parseInt(e.detail.value) || 1
    if (value < 1) value = 1
    if (value > this.data.book.stock) {
      value = this.data.book.stock
      wx.showToast({
        title: '超过库存数量',
        icon: 'none'
      })
    }
    this.setData({ quantity: value })
  },

  /**
   * 加入购物车
   */
  async addToCart() {
    // 检查登录状态
    const app = getApp()
    if (!app.checkUserAuth()) {
      app.showLoginDialog(async () => {
        await this.doAddToCart()
      })
      return
    }

    await this.doAddToCart()
  },

  /**
   * 执行加入购物车
   */
  async doAddToCart() {
    try {
      const app = getApp()
      const openid = app.globalData.openid || wx.getStorageSync('openid')

      if (!openid) {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        })
        return
      }

      wx.showLoading({ title: '加载中...' })

      const res = await API.cart.addToCart({
        openid: openid,
        bookId: this.data.bookId,
        quantity: this.data.quantity
      })

      wx.hideLoading()

      if (res.data && res.data.code === 200) {
        wx.showToast({
          title: '已添加到购物车',
          icon: 'success'
        })
        
        // 重置数量
        this.setData({ quantity: 1 })
      } else {
        wx.showToast({
          title: res.data?.msg || '添加失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('加入购物车失败:', error)
      wx.showToast({
        title: '加入购物车失败',
        icon: 'none'
      })
    }
  },

  /**
   * 立即购买
   */
  buyNow() {
    // 检查登录状态
    const app = getApp()
    if (!app.checkUserAuth()) {
      app.showLoginDialog(() => {
        this.doBuyNow()
      })
      return
    }

    this.doBuyNow()
  },

  /**
   * 执行立即购买
   */
  doBuyNow() {
    // 跳转到订单确认页面
    const purchaseData = {
      id: this.data.book.id,
      name: this.data.book.name,
      author: this.data.book.author,
      imageUrl: this.data.book.imageUrl,
      price: this.data.book.price,
      quantity: this.data.quantity
    }
    
    console.log('立即购买数据:', purchaseData)
    
    const bookData = JSON.stringify(purchaseData)
    
    wx.navigateTo({
      url: `/pages/checkout/index?from=detail&book=${encodeURIComponent(bookData)}`
    })
  },

  /**
   * 预览图片
   */
  previewImage() {
    if (this.data.book && this.data.book.imageUrl) {
      wx.previewImage({
        current: this.data.book.imageUrl,
        urls: [this.data.book.imageUrl]
      })
    }
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    return {
      title: this.data.book?.name || '书籍详情',
      path: `/pages/book/detail?id=${this.data.bookId}`,
      imageUrl: this.data.book?.imageUrl || ''
    }
  },

  /**
   * 返回首页
   */
  goHome() {
    wx.switchTab({
      url: '/pages/home/index'
    })
  },

  /**
   * 查看购物车
   */
  goToCart() {
    wx.switchTab({
      url: '/pages/cart/index'
    })
  }
})

