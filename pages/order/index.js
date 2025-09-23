// pages/order/index.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    appointmentList: [], // 预约列表数据
  },

  /**
   * 获取预约列表数据
   */
  getAppointmentList() {
    console.log('开始获取预约列表...');
    
    // 检查登录状态
    const app = getApp()
    const openid = app.globalData.openid || wx.getStorageSync('openid')
    
    console.log('当前openid:', openid);
    
    if (!openid) {
      console.log('openid为空，显示登录提示');
      this.showLoginTip()
      return
    }

    wx.showLoading({
      title: '加载中...',
    });

    console.log('准备发送请求到 appoint/list，参数:', { openid: openid });

    // 使用全局request方法调用预约列表接口
    app.request({
      url: 'appoint/list',
      method: 'POST',
      data: {
        openid: openid
      }
    }).then((res) => {
      console.log('预约列表接口返回:', res);
      console.log('res.data:', res.data);
      console.log('res.data.code:', res.data?.code);
      console.log('res.data.data:', res.data?.data);
      
      // 检查响应状态和数据
      if (res.data && res.data.code === 200 ) {
        // 处理时间格式
        const processedList = res.data.data.map(item => ({
          ...item,
          time: this.formatTime(item.time),
          createdat: this.formatTime(item.createdat)
        }));
        
        console.log('处理后的数据:', processedList);
        
        this.setData({
          appointmentList: processedList
        });
        
        console.log('数据已设置到页面，当前appointmentList:', this.data.appointmentList);
      } else if (res.data && res.data.code === 200 && (!res.data.data || res.data.data.length === 0)) {
        // 接口成功但无数据
        console.log('接口成功但无数据');
        this.setData({
          appointmentList: []
        });
      } else {
        // 接口返回错误
        console.error('接口返回错误:', res.data);
        wx.showToast({
          title: res.data?.msg || '获取数据失败',
          icon: 'none'
        });
      }
    }).catch((err) => {
      console.error('获取预约列表失败:', err);
      console.error('错误详情:', JSON.stringify(err));
      wx.showToast({
        title: '获取数据失败',
        icon: 'none'
      });
    }).finally(() => {
      console.log('请求完成，隐藏loading');
      wx.hideLoading();
    });
  },

  /**
   * 显示登录提示
   */
  showLoginTip() {
    wx.showModal({
      title: '提示',
      content: '请先登录后再查看预约记录',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 跳转到登录页面
          wx.navigateTo({
            url: '/pages/login/index',
          });
        }
      }
    });
  },

  /**
   * 格式化时间
   */
  formatTime(timeStr) {
    if (!timeStr) return '';
    
    try {
      const date = new Date(timeStr);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hour = date.getHours().toString().padStart(2, '0');
      const minute = date.getMinutes().toString().padStart(2, '0');
      
      return `${year}-${month}-${day} ${hour}:${minute}`;
    } catch (e) {
      return timeStr;
    }
  },

  /**
   * 登录成功回调
   */
  onLoginSuccess(openid) {
    console.log('登录成功，openid:', openid);
    // 登录成功后自动刷新数据
    this.getAppointmentList();
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 添加登录状态监听器
    const app = getApp()
    app.addLoginListener(this.onLoginSuccess.bind(this))
    
    this.getAppointmentList();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 每次显示页面时检查登录状态并刷新数据
    const app = getApp()
    const openid = app.globalData.openid || wx.getStorageSync('openid')
    
    if (openid) {
      // 如果已登录，刷新数据
      this.getAppointmentList();
    } else {
      // 如果未登录，清空数据
      this.setData({
        appointmentList: []
      });
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    // 移除登录状态监听器
    const app = getApp()
    app.removeLoginListener(this.onLoginSuccess.bind(this))
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.getAppointmentList();
    wx.stopPullDownRefresh();
  },
})
