// pages/categoryBrand/index.js
const API = require('../../utils/api/index.js')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 搜索关键词
    searchKeyword: '',
    // 书籍列表
    books: [],
    // 分类列表
    categories: [],
    // 当前选中的分类ID
    selectedCategoryId: null,
    // 当前选中的分类名称
    selectedCategoryName: '',
    // 排序类型
    sortType: 'default',
    sortText: '默认排序',
    // 加载状态
    loading: false,
    // 弹窗状态
    showCategoryModal: false,
    showSortModal: false,
    // 页面类型
    pageType: 'category', // category, search
    // 分页参数
    page: 1,
    pageSize: 20,
    hasMore: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('categoryBrand页面加载，参数：', options)
    
    // 根据参数设置页面状态
    if (options.type === 'search') {
      this.setData({
        pageType: 'search'
      })
      wx.setNavigationBarTitle({
        title: '搜索书籍'
      })
    } else if (options.categoryId) {
      this.setData({
        selectedCategoryId: parseInt(options.categoryId),
        selectedCategoryName: options.categoryName || '',
        pageType: 'category'
      })
      wx.setNavigationBarTitle({
        title: options.categoryName || '图书列表'
      })
    } else {
      wx.setNavigationBarTitle({
        title: '图书列表'
      })
    }
    
    // 加载分类列表
    this.loadCategories()
    // 加载书籍数据
    this.loadBooks()
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
        
        console.log('分类列表加载成功:', categories)
        this.setData({ categories })
      }
    } catch (error) {
      console.error('加载分类失败:', error)
    }
  },

  /**
   * 加载书籍列表
   */
  async loadBooks(loadMore = false) {
    try {
      if (!loadMore) {
        this.setData({ loading: true, page: 1 })
      }
      
      let res
      
      // 根据搜索关键词或分类ID调用不同的API
      if (this.data.searchKeyword) {
        // 搜索模式
        console.log('搜索书籍:', this.data.searchKeyword)
        res = await API.books.searchBooks(this.data.searchKeyword)
      } else if (this.data.selectedCategoryId) {
        // 按分类查询
        console.log('按分类查询:', this.data.selectedCategoryId)
        res = await API.books.getBooksByCategory(this.data.selectedCategoryId)
      } else {
        // 查询所有书籍
        console.log('查询所有书籍，参数:', {
          page: this.data.page,
          size: this.data.pageSize,
          stockStatus: 'inStock'
        })
        res = await API.books.getBookList({
          page: this.data.page,
          size: this.data.pageSize,
          stockStatus: 'inStock'
        })
      }
      
      console.log('书籍列表接口返回:', res)
      
      if (res.data && res.data.code === 200) {
        let books = []
        let hasMore = false
        
        // 处理不同接口的返回格式
        if (res.data.data.records) {
          // 分页接口返回格式
          books = res.data.data.records
          hasMore = this.data.page < res.data.data.pages
        } else if (Array.isArray(res.data.data)) {
          // 数组格式返回
          books = res.data.data
        }
        
        // 处理书籍数据
        const processedBooks = books.map(book => ({
          id: book.id,
          name: book.bookName,
          author: book.author,
          price: book.price,
          imageUrl: book.imageurl,
          stock: book.stock,
          category: book.categoryId,
          // 格式化价格显示（分转元）
          priceYuan: API.books.priceUtils.fenToYuan(book.price),
          stockStatus: book.stock > 10 ? '充足' : book.stock > 0 ? '紧张' : '缺货'
        }))
        
        // 本地排序
        this.sortBooks(processedBooks)
        
        this.setData({
          books: loadMore ? [...this.data.books, ...processedBooks] : processedBooks,
          loading: false,
          hasMore
        })
      } else {
        this.setData({
          books: [],
          loading: false,
          hasMore: false
        })
      }
      
    } catch (error) {
      console.error('加载书籍失败:', error)
      this.showToast('加载失败')
      this.setData({ loading: false })
    }
  },

  /**
   * 本地排序
   */
  sortBooks(books) {
    switch (this.data.sortType) {
      case 'price_asc':
        books.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        books.sort((a, b) => b.price - a.price)
        break
      default:
        // 默认排序保持原数组顺序
        break
    }
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },

  /**
   * 执行搜索
   */
  doSearch() {
    this.loadBooks()
  },

  /**
   * 显示分类筛选
   */
  showCategoryFilter() {
    this.setData({
      showCategoryModal: true
    })
  },

  /**
   * 显示排序筛选
   */
  showSortFilter() {
    this.setData({
      showSortModal: true
    })
  },

  /**
   * 选择分类
   */
  selectCategory(e) {
    const { id, name } = e.currentTarget.dataset
    this.setData({
      selectedCategoryId: id,
      selectedCategoryName: name,
      showCategoryModal: false
    })
    this.loadBooks()
  },

  /**
   * 选择排序
   */
  selectSort(e) {
    const sort = e.currentTarget.dataset.sort
    let sortText = '默认排序'
    
    switch (sort) {
      case 'price_asc':
        sortText = '价格从低到高'
        break
      case 'price_desc':
        sortText = '价格从高到低'
        break
    }
    
    this.setData({
      sortType: sort,
      sortText: sortText,
      showSortModal: false
    })
    this.loadBooks()
  },

  /**
   * 关闭分类弹窗
   */
  closeCategoryModal() {
    this.setData({
      showCategoryModal: false
    })
  },

  /**
   * 关闭排序弹窗
   */
  closeSortModal() {
    this.setData({
      showSortModal: false
    })
  },

  /**
   * 跳转到书籍详情
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
   * 上拉加载更多
   */
  onReachBottom() {
    if (!this.data.loading && this.data.hasMore) {
      this.setData({
        page: this.data.page + 1
      })
      this.loadBooks(true)
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.setData({ page: 1 })
    this.loadBooks().then(() => {
      wx.stopPullDownRefresh()
    })
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
  showToast(title) {
    wx.showToast({
      title: title,
      icon: 'none',
      duration: 2000
    })
  }
})