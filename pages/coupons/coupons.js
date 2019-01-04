// pages/coupons/coupons.js
import {
  getMyCouponList
} from "../../api/request.js"
import regeneratorRuntime from "../../api/regeneratorRuntime.js"
import {
  getStorageInfoPromisify,
  showLoadingPromisify,
  jumpToPromisify
} from "../../api/promisify.js"

const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    couponList: [], //页面数据
    isEmpty: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function () {
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes("Token")) {
      showLoadingPromisify()
      let coupons = await getMyCouponList()
      if (coupons.statusCode === 200) {
        coupons.data.length === 0 && this.setData({
          isEmpty: true
        })
        coupons.data.length >0 &&this.setData({isEmpty:false})
        let couponList = this.data.couponList;
        coupons.data && coupons.data.map(item => {
          let coupon = {};
          coupon["money"] = item.coupon_info.money;
          coupon["notice"] = item.coupon_info.notice;
          coupon["coupon_id"] = item.coupon_id;
          coupon["expired"] = item.expired;
          couponList.push(coupon)
        })
        this.setData({
          couponList
        })
      } else jumpToPromisify("index", "reLaunch")
    } else jumpToPromisify("index", "reLaunch")

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

  },

  /**
   * 保存formid
   */
  bindSubmit: async function (e) {
    let {
      formId
    } = e.detail;
    formId && app.data.formID.push(formId);
  },

  /**
   * 跳转圈子页面
   */
  goPageWithCircle: function () {
    jumpToPromisify("circle", "reLaunch");
  }
})