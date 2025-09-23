// pages/home/index.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 推荐书籍列表
    recommendBooks: [],
    // 新书上架列表
    newBooks: [],
    // 加载状态
    loading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadBookData()
  },

  /**
   * 网络请求封装
   */
  request(options) {
    const app = getApp()
    return app.request(options)
  },

  /**
   * 加载书籍数据
   */
  async loadBookData() {
    try {
      this.setData({ loading: true })
      
      // 加载推荐书籍和新书 - 使用测试数据
      const recommendBooks = [
        {
          id: 1,
          name: 'JavaScript高级程序设计',
          author: 'Nicholas C. Zakas',
          price: 8900,
          imageUrl: 'https://img.alicdn.com/imgextra/i4/2206678097909/O1CN01Z5n8yI1L3Q8ZYqo3I_!!2206678097909-0-cib.jpg'
        },
        {
          id: 2, 
          name: 'Java核心技术',
          author: 'Cay S. Horstmann',
          price: 12800,
          imageUrl: 'https://img.alicdn.com/imgextra/i2/2206678097909/O1CN01lNqX3A1L3Q8aGpaBK_!!2206678097909-0-cib.jpg'
        },
        {
          id: 3,
          name: 'Spring实战',
          author: 'Craig Walls',
          price: 7900,
          imageUrl: 'https://img.alicdn.com/imgextra/i3/2206678097909/O1CN01N2mYeP1L3Q8a6j5wn_!!2206678097909-0-cib.jpg'
        }
      ]

      const newBooks = [
        {
          id: 4,
          name: 'Vue.js设计与实现',
          author: '霍春阳',
          price: 9900,
          imageUrl: 'https://img.alicdn.com/imgextra/i1/2206678097909/O1CN01v5J5J61L3Q8XpGqv7_!!2206678097909-0-cib.jpg'
        },
        {
          id: 5,
          name: 'React进阶实践指南',
          author: '我不是外星人',
          price: 8900,
          imageUrl: 'https://img.alicdn.com/imgextra/i2/2206678097909/O1CN01fX9nZy1L3Q8XpGt0k_!!2206678097909-0-cib.jpg'
        },
        {
          id: 6,
          name: 'TypeScript编程',
          author: 'Boris Cherny',
          price: 11900,
          imageUrl: 'https://img.alicdn.com/imgextra/i3/2206678097909/O1CN01ZqsXNd1L3Q8ZYqkLh_!!2206678097909-0-cib.jpg'
        },
        {
          id: 7,
          name: 'Node.js开发实战',
          author: '朴灵',
          price: 7900,
          imageUrl: 'https://img.alicdn.com/imgextra/i4/2206678097909/O1CN01VhX5oo1L3Q8Y3zRdE_!!2206678097909-0-cib.jpg'
        }
      ]

      this.setData({
        recommendBooks,
        newBooks,
        loading: false
      })

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
    const category = e.currentTarget.dataset.category
    wx.navigateTo({
      url: `/pages/categoryBrand/index?category=${category}`
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
