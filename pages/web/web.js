import regeneratorRuntime, {
  async
} from '../../api/regeneratorRuntime.js'
import {
  getStoragePromisify,
  jumpToPromisify,
  getStorageInfoPromisify
} from '../../api/promisify';
// pages/web/web.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    link: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function () {
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes('link')) {
      let {
        link
      } = await getStoragePromisify('link');
      this.setData({
        link
      });
    } else jumpToPromisify(1, 'back')
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
