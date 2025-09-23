// pages/cart/index.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 购物车列表
    cartItems: [],
    // 全选状态
    selectAll: false,
    // 总金额
    totalAmount: 0,
    // 总数量
    totalCount: 0,
    // 加载状态
    loading: false,
    // 编辑模式
    editMode: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadCartData()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadCartData()
  },

  /**
   * 网络请求封装
   */
  request(options) {
    const app = getApp()
    return app.request(options)
  },

  /**
   * 加载购物车数据
   */
  async loadCartData() {
    try {
      this.setData({ loading: true })
      
      const openid = await this.getOpenId()
      
      // 调用购物车列表接口
      const res = await this.request({
        url: `cart/list?openid=${openid}`,
        method: 'GET'
      })

      if (res.data && res.data.code === 200) {
        const cartItems = res.data.data || []
        this.setData({
          cartItems,
          loading: false
        })
        this.calculateTotal()
      } else {
        // 使用测试数据
        const testCartItems = [
          {
            id: 1,
            openid: 'test_openid',
            bookId: 1,
            bookName: 'JavaScript高级程序设计',
            price: 8900,
            imageUrl: 'https://img.alicdn.com/imgextra/i4/2206678097909/O1CN01Z5n8yI1L3Q8ZYqo3I_!!2206678097909-0-cib.jpg',
            quantity: 2,
            selected: true
          },
          {
            id: 2,
            openid: 'test_openid',
            bookId: 2,
            bookName: 'Java核心技术',
            price: 12800,
            imageUrl: 'https://img.alicdn.com/imgextra/i2/2206678097909/O1CN01lNqX3A1L3Q8aGpaBK_!!2206678097909-0-cib.jpg',
            quantity: 1,
            selected: false
          },
          {
            id: 3,
            openid: 'test_openid',
            bookId: 3,
            bookName: 'Spring实战',
            price: 7900,
            imageUrl: 'https://img.alicdn.com/imgextra/i3/2206678097909/O1CN01N2mYeP1L3Q8a6j5wn_!!2206678097909-0-cib.jpg',
            quantity: 1,
            selected: true
          }
        ]
        
        this.setData({
          cartItems: testCartItems,
          loading: false
        })
        this.calculateTotal()
      }
      
    } catch (error) {
      console.error('加载购物车失败:', error)
      this.showToast('加载失败')
      this.setData({ loading: false })
    }
  },

  /**
   * 计算总价
   */
  calculateTotal() {
    const { cartItems } = this.data
    let totalAmount = 0
    let totalCount = 0
    let selectedCount = 0
    
    cartItems.forEach(item => {
      if (item.selected) {
        totalAmount += item.price * item.quantity
        totalCount += item.quantity
        selectedCount++
      }
    })
    
    const selectAll = selectedCount === cartItems.length && cartItems.length > 0
    
    this.setData({
      totalAmount,
      totalCount,
      selectAll
    })
  },

  /**
   * 切换商品选中状态
   */
  async toggleItemSelect(e) {
    const { index } = e.currentTarget.dataset
    const cartItems = [...this.data.cartItems]
    cartItems[index].selected = !cartItems[index].selected
    
    this.setData({ cartItems })
    this.calculateTotal()
    
    // 调用接口更新选中状态
    try {
      await this.request({
        url: `cart/select/${cartItems[index].id}?selected=${cartItems[index].selected}`,
        method: 'PUT'
      })
    } catch (error) {
      console.error('更新选中状态失败:', error)
    }
  },

  /**
   * 全选/取消全选
   */
  async toggleSelectAll() {
    const { selectAll, cartItems } = this.data
    const newSelectAll = !selectAll
    
    const updatedCartItems = cartItems.map(item => ({
      ...item,
      selected: newSelectAll
    }))
    
    this.setData({
      cartItems: updatedCartItems,
      selectAll: newSelectAll
    })
    this.calculateTotal()
    
    // 调用接口批量更新选中状态
    try {
      const cartIds = cartItems.map(item => item.id)
      await this.request({
        url: 'cart/select',
        method: 'PUT',
        data: {
          cartIds,
          selected: newSelectAll
        }
      })
    } catch (error) {
      console.error('批量更新选中状态失败:', error)
    }
  },

  /**
   * 增加商品数量
   */
  async increaseQuantity(e) {
    const { index } = e.currentTarget.dataset
    const cartItems = [...this.data.cartItems]
    cartItems[index].quantity += 1
    
    this.setData({ cartItems })
    this.calculateTotal()
    
    // 调用接口更新数量
    try {
      await this.request({
        url: `cart/update/${cartItems[index].id}?quantity=${cartItems[index].quantity}`,
        method: 'PUT'
      })
    } catch (error) {
      console.error('更新数量失败:', error)
      // 回滚数量
      cartItems[index].quantity -= 1
      this.setData({ cartItems })
      this.calculateTotal()
      this.showToast('更新失败')
    }
  },

  /**
   * 减少商品数量
   */
  async decreaseQuantity(e) {
    const { index } = e.currentTarget.dataset
    const cartItems = [...this.data.cartItems]
    
    if (cartItems[index].quantity <= 1) {
      this.showToast('数量不能少于1')
      return
    }
    
    cartItems[index].quantity -= 1
    this.setData({ cartItems })
    this.calculateTotal()
    
    // 调用接口更新数量
    try {
      await this.request({
        url: `cart/update/${cartItems[index].id}?quantity=${cartItems[index].quantity}`,
        method: 'PUT'
      })
    } catch (error) {
      console.error('更新数量失败:', error)
      // 回滚数量
      cartItems[index].quantity += 1
      this.setData({ cartItems })
      this.calculateTotal()
      this.showToast('更新失败')
    }
  },

  /**
   * 删除商品
   */
  async removeItem(e) {
    const { index } = e.currentTarget.dataset
    const cartItems = [...this.data.cartItems]
    const item = cartItems[index]
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${item.bookName}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await this.request({
              url: `cart/remove/${item.id}`,
              method: 'DELETE'
            })
            
            cartItems.splice(index, 1)
            this.setData({ cartItems })
            this.calculateTotal()
            this.showToast('删除成功')
          } catch (error) {
            console.error('删除失败:', error)
            this.showToast('删除失败')
          }
        }
      }
    })
  },

  /**
   * 切换编辑模式
   */
  toggleEditMode() {
    this.setData({
      editMode: !this.data.editMode
    })
  },

  /**
   * 清空购物车
   */
  async clearCart() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空购物车吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const openid = await this.getOpenId()
            await this.request({
              url: `cart/clear?openid=${openid}`,
              method: 'DELETE'
            })
            
            this.setData({ cartItems: [] })
            this.calculateTotal()
            this.showToast('清空成功')
          } catch (error) {
            console.error('清空失败:', error)
            this.showToast('清空失败')
          }
        }
      }
    })
  },

  /**
   * 去结算
   */
  goToCheckout() {
    const { cartItems, totalCount, totalAmount } = this.data
    
    if (totalCount === 0) {
      this.showToast('请选择要结算的商品')
      return
    }
    
    // 获取选中的商品
    const selectedItems = cartItems.filter(item => item.selected)
    
    // 跳转到结算页面
    wx.navigateTo({
      url: `/pages/checkout/index?items=${encodeURIComponent(JSON.stringify(selectedItems))}`
    })
  },

  /**
   * 继续购物
   */
  continueShopping() {
    wx.switchTab({
      url: '/pages/home/index'
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
