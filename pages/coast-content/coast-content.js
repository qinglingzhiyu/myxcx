// pages/coast-content/coast-content.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    date: [{
      title: "元旦",
      day: "2018年12月30日至2019年1月1日"
    }, {
      title: "春节",
      day: "2月4日至10日"
    }, {
      title: "清明节",
      day: "4月5日"
    }, {
      title: "劳动节",
      day: "5月1日"
    }, {
      title: "端午节",
      day: "6月7日"
    }, {
      title: "中秋节",
      day: "9月13日"
    }, {
      title: "国庆节",
      day: "10月1日至7日"
    }]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.showTabBar()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})
