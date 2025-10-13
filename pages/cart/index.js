// pages/cart/index.js
const API = require('../../utils/api/index.js')

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
    // 检查登录状态
    const app = getApp()
    if (!app.checkUserAuth()) {
      // 未登录，显示登录弹窗
      app.showLoginDialog(() => {
        // 登录成功后加载购物车
        this.loadCartData()
      }, () => {
        // 取消登录，返回上一页
        wx.navigateBack()
      })
    } else {
      this.loadCartData()
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 检查登录状态
    const app = getApp()
    if (app.checkUserAuth()) {
      this.loadCartData()
    }
  },

  /**
   * 加载购物车数据
   */
  async loadCartData() {
    try {
      this.setData({ loading: true })
      
      const openid = await this.getOpenId()
      
      // 使用封装的购物车API
      const res = await API.cart.getCartList(openid)

      if (res.data && res.data.code === 200) {
        const cartItems = res.data.data || []
        
        // 处理数据，添加格式化后的价格
        const processedItems = cartItems.map(item => ({
          ...item,
          priceYuan: API.cart.cartUtils.formatPrice(item.price)
        }))
        
        this.setData({
          cartItems: processedItems,
          loading: false
        })
        this.calculateTotal()
      } else {
        this.setData({
          cartItems: [],
          loading: false
        })
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
    
    // 计算总价和总数量（使用折扣价）
    let totalAmount = 0
    let totalCount = 0
    
    cartItems.forEach(item => {
      if (item.selected) {
        // 优先使用折扣价，否则使用原价
        const price = item.discountPrice || item.price
        totalAmount += price * item.quantity
        totalCount += item.quantity
      }
    })
    
    // 检查是否全选
    const selectedCount = cartItems.filter(item => item.selected).length
    const selectAll = selectedCount === cartItems.length && cartItems.length > 0
    
    this.setData({
      totalAmount: (totalAmount / 100).toFixed(2),
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
    
    // 使用封装的API更新选中状态
    try {
      await API.cart.selectCartItem(cartItems[index].id, cartItems[index].selected)
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
    
    // 使用封装的API批量更新选中状态
    try {
      const cartIds = cartItems.map(item => item.id)
      await API.cart.batchSelectCartItems({
        cartIds,
        selected: newSelectAll
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
    
    // 使用封装的API更新数量
    try {
      await API.cart.updateCartItem(cartItems[index].id, cartItems[index].quantity)
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
    
    // 使用封装的API更新数量
    try {
      await API.cart.updateCartItem(cartItems[index].id, cartItems[index].quantity)
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
            // 使用封装的API删除购物车商品
            await API.cart.removeCartItem(item.id)
            
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
            // 使用封装的API清空购物车
            await API.cart.clearCart(openid)
            
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
