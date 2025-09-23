// pages/categoryBrand/index.js
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
    categories: ['文学小说', '科技编程', '经济管理', '教育考试', '历史文化', '儿童读物'],
    // 当前选中的分类
    selectedCategory: '',
    // 排序类型
    sortType: 'default',
    sortText: '默认排序',
    // 加载状态
    loading: false,
    // 弹窗状态
    showCategoryModal: false,
    showSortModal: false,
    // 页面类型
    pageType: 'category' // category, search
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
    } else if (options.category) {
      this.setData({
        selectedCategory: options.category,
        pageType: 'category'
      })
    }
    
    // 设置页面标题
    if (options.category) {
      wx.setNavigationBarTitle({
        title: options.category
      })
    } else if (options.type === 'search') {
      wx.setNavigationBarTitle({
        title: '搜索书籍'
      })
    } else {
      wx.setNavigationBarTitle({
        title: '图书列表'
      })
    }
    
    // 加载书籍数据
    this.loadBooks()
  },

  /**
   * 网络请求封装
   */
  request(options) {
    const app = getApp()
    return app.request(options)
  },

  /**
   * 加载书籍列表
   */
  async loadBooks() {
    try {
      this.setData({ loading: true })
      
      // 构建搜索参数
      const params = {
        keyword: this.data.searchKeyword,
        category: this.data.selectedCategory,
        sortType: this.data.sortType
      }
      
      console.log('加载书籍，参数:', params)
      
      // 使用测试数据（实际项目中这里应该调用API）
      let books = [
        {
          id: 1,
          name: 'JavaScript高级程序设计',
          author: 'Nicholas C. Zakas',
          price: 8900,
          category: '科技编程',
          imageUrl: 'https://img.alicdn.com/imgextra/i4/2206678097909/O1CN01Z5n8yI1L3Q8ZYqo3I_!!2206678097909-0-cib.jpg',
          sales: 1200
        },
        {
          id: 2,
          name: 'Java核心技术',
          author: 'Cay S. Horstmann',
          price: 12800,
          category: '科技编程',
          imageUrl: 'https://img.alicdn.com/imgextra/i2/2206678097909/O1CN01lNqX3A1L3Q8aGpaBK_!!2206678097909-0-cib.jpg',
          sales: 980
        },
        {
          id: 3,
          name: 'Spring实战',
          author: 'Craig Walls',
          price: 7900,
          category: '科技编程',
          imageUrl: 'https://img.alicdn.com/imgextra/i3/2206678097909/O1CN01N2mYeP1L3Q8a6j5wn_!!2206678097909-0-cib.jpg',
          sales: 756
        },
        {
          id: 4,
          name: '平凡的世界',
          author: '路遥',
          price: 6800,
          category: '文学小说',
          imageUrl: 'https://img.alicdn.com/imgextra/i1/2206678097909/O1CN01v5J5J61L3Q8XpGqv7_!!2206678097909-0-cib.jpg',
          sales: 2100
        },
        {
          id: 5,
          name: '活着',
          author: '余华',
          price: 4900,
          category: '文学小说',
          imageUrl: 'https://img.alicdn.com/imgextra/i2/2206678097909/O1CN01fX9nZy1L3Q8XpGt0k_!!2206678097909-0-cib.jpg',
          sales: 1800
        },
        {
          id: 6,
          name: '经济学原理',
          author: '曼昆',
          price: 15900,
          category: '经济管理',
          imageUrl: 'https://img.alicdn.com/imgextra/i3/2206678097909/O1CN01ZqsXNd1L3Q8ZYqkLh_!!2206678097909-0-cib.jpg',
          sales: 654
        },
        {
          id: 7,
          name: '管理学基础',
          author: '罗宾斯',
          price: 11900,
          category: '经济管理',
          imageUrl: 'https://img.alicdn.com/imgextra/i4/2206678097909/O1CN01VhX5oo1L3Q8Y3zRdE_!!2206678097909-0-cib.jpg',
          sales: 432
        },
        {
          id: 8,
          name: '小王子',
          author: '圣埃克苏佩里',
          price: 3900,
          category: '儿童读物',
          imageUrl: 'https://img.alicdn.com/imgextra/i1/2206678097909/O1CN01wWqbks1L3Q8ZYqnfB_!!2206678097909-0-cib.jpg',
          sales: 2500
        }
      ]
      
      // 根据分类筛选
      if (this.data.selectedCategory) {
        books = books.filter(book => book.category === this.data.selectedCategory)
      }
      
      // 根据关键词搜索
      if (this.data.searchKeyword) {
        const keyword = this.data.searchKeyword.toLowerCase()
        books = books.filter(book => 
          book.name.toLowerCase().includes(keyword) || 
          book.author.toLowerCase().includes(keyword)
        )
      }
      
      // 排序
      switch (this.data.sortType) {
        case 'price_asc':
          books.sort((a, b) => a.price - b.price)
          break
        case 'price_desc':
          books.sort((a, b) => b.price - a.price)
          break
        case 'sales':
          books.sort((a, b) => b.sales - a.sales)
          break
        default:
          // 默认排序保持原数组顺序
          break
      }
      
      this.setData({
        books,
        loading: false
      })
      
    } catch (error) {
      console.error('加载书籍失败:', error)
      this.showToast('加载失败')
      this.setData({ loading: false })
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
    const category = e.currentTarget.dataset.category
    this.setData({
      selectedCategory: category,
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
      case 'sales':
        sortText = '销量排序'
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
    
    try {
      const openid = await this.getOpenId()
      
      const res = await this.request({
        url: 'cart/add',
        method: 'POST',
        data: {
          openid: openid,
          bookId: book.id,
          quantity: 1
        }
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
  showToast(title) {
    wx.showToast({
      title: title,
      icon: 'none',
      duration: 2000
    })
  }
})