// pages/components/jiadianweixiu/index.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    pageTitle: '家电维修服务',
    services: [
      { name: '空调维修', icon: '/assets/imgs/tp-kongtiaoweixiu@2x.png' },
      { name: '冰箱维修', icon: '/assets/imgs/jiadianweixiuIcon/bingxiang-weidianji.png' },
      { name: '洗衣机维修', icon: '/assets/imgs/jiadianweixiuIcon/xiyiji-weixuanzhong.png' },
      { name: '电视维修', icon: '/assets/imgs/jiadianweixiuIcon/dianshi-weixuanzhong.png' }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('jiadianweixiu页面加载成功')
  },

  /**
   * 跳转到预约页面
   */
  goToReservation() {
    wx.navigateTo({
      url: '/pages/components/reservation/index',
    })
  },

  /**
   * 选择服务项目
   */
  selectService(e) {
    const service = e.currentTarget.dataset.service
    console.log('选择服务:', service)
    
    wx.showToast({
      title: `您选择了${service.name}`,
      icon: 'success'
    })
  }
})