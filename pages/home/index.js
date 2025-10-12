// pages/home/index.js
const API = require('../../utils/api/index.js')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 推荐书籍列表
    recommendBooks: [],
    // 新书上架列表
    newBooks: [],
    // 分类列表
    categories: [],
    // 加载状态
    loading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadCategories()
    this.loadBookData()
  },

  /**
   * 加载分类列表
   */
  async loadCategories() {
    try {
      const res = await API.categories.getCategoryList()
      
      if (res.data && res.data.code === 200) {
        // 获取所有分类数据（分页格式）
        let categoriesData = []
        
        if (res.data.data.records) {
          // 如果是分页格式
          categoriesData = res.data.data.records
        } else if (Array.isArray(res.data.data)) {
          // 如果是数组格式
          categoriesData = res.data.data
        }
        
        // 映射字段名：servicetypeid -> id, name -> categoryName
        const categories = categoriesData.map(cat => ({
          id: cat.servicetypeid || cat.id,
          categoryName: cat.name || cat.categoryName,
          imageUrl: cat.imageurl || cat.imageUrl,
          createdat: cat.createdat
        }))
        
        console.log('处理后的分类数据:', categories)
        this.setData({ categories })
      }
    } catch (error) {
      console.error('加载分类失败:', error)
    }
  },

  /**
   * 加载书籍数据
   */
  async loadBookData() {
    try {
      this.setData({ loading: true })
      
      // 加载推荐书籍（获取前6本书籍）
      const recommendRes = await API.books.getBookList({
        page: 1,
        size: 6,
        stockStatus: 'inStock' // 只显示有库存的
      })

      // 加载新书（按创建时间倒序，获取前4本）
      const newBooksRes = await API.books.getBookList({
        page: 1,
        size: 4,
        stockStatus: 'inStock'
      })

      if (recommendRes.data && recommendRes.data.code === 200) {
        // 处理推荐书籍数据
        const recommendBooks = recommendRes.data.data.records.map(book => ({
          id: book.id,
          name: book.bookName,
          author: book.author,
          price: book.price,
          imageUrl: book.imageurl,
          // 格式化价格显示（分转元）
          priceYuan: API.books.priceUtils.fenToYuan(book.price),
          stock: book.stock
        }))

        this.setData({ recommendBooks })
      }

      if (newBooksRes.data && newBooksRes.data.code === 200) {
        // 处理新书数据
        const newBooks = newBooksRes.data.data.records.map(book => ({
          id: book.id,
          name: book.bookName,
          author: book.author,
          price: book.price,
          imageUrl: book.imageurl,
          priceYuan: API.books.priceUtils.fenToYuan(book.price),
          stock: book.stock
        }))

        this.setData({ newBooks })
      }

      this.setData({ loading: false })

    } catch (error) {
      console.error('加载书籍数据失败:', error)
      this.showToast('加载失败')
      this.setData({ loading: false })
    }
  },

  /**
   * 跳转到搜索页面
   */
  goToSearch() {
    wx.navigateTo({
      url: '/pages/categoryBrand/index?type=search'
    })
  },

  /**
   * 跳转到分类页面
   */
  goToCategory(e) {
    const { id, name } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/categoryBrand/index?categoryId=${id}&categoryName=${encodeURIComponent(name)}`
    })
  },

  /**
   * 跳转到书籍详情页
   */
  goToBookDetail(e) {
    const book = e.currentTarget.dataset.book
    wx.navigateTo({
      url: `/pages/book/detail?id=${book.id}`
    })
  },

  /**
   * 添加到购物车
   */
  async addToCart(e) {
    const book = e.currentTarget.dataset.book
    
    // 检查登录状态
    const app = getApp()
    if (!app.checkUserAuth()) {
      // 未登录，显示登录弹窗
      app.showLoginDialog(async () => {
        // 登录成功后执行加入购物车
        await this.doAddToCart(book)
      })
      return
    }
    
    // 已登录，直接加入购物车
    await this.doAddToCart(book)
  },

  /**
   * 执行加入购物车操作
   */
  async doAddToCart(book) {
    try {
      const openid = await this.getOpenId()
      
      // 使用封装的购物车API
      const res = await API.cart.addToCart({
        openid: openid,
        bookId: book.id,
        quantity: 1
      })

      if (res.data && res.data.code === 200) {
        this.showToast('已添加到购物车')
      } else {
        this.showToast(res.data.msg || '添加失败')
      }
    } catch (error) {
      console.error('添加购物车失败:', error)
      this.showToast('添加失败')
    }
  },

  /**
   * 获取用户openid
   */
  async getOpenId() {
    return new Promise((resolve, reject) => {
      // 先从缓存获取
      const openid = wx.getStorageSync('openid')
      if (openid) {
        resolve(openid)
        return
      }

      // 如果没有，调用app.js中的方法获取
      const app = getApp()
      if (app && app.getUserOpenId) {
        app.getUserOpenId().then(openid => {
          resolve(openid)
        }).catch(error => {
          console.error('获取openid失败:', error)
          reject(error)
        })
      } else {
        reject(new Error('无法获取openid'))
      }
    })
  },

  /**
   * 显示提示信息
   */
  showToast: function(title) {
    wx.showToast({
      title: title,
      icon: 'none',
      duration: 2000
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {},
})
