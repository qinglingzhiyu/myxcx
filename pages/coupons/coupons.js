/**
 * Created by Terris
 * https://github.com/qinglingzhiyu
 *
 * @date: 2019-01-09
 * @flow
 *
 * description: 这是优惠券的逻辑
 *
 */

import {
  getMyCouponList
} from '../../api/request.js'
import regeneratorRuntime, {
  async
} from '../../api/regeneratorRuntime.js'
import {
  getStorageInfoPromisify,
  showLoadingPromisify,
  jumpToPromisify
} from '../../api/promisify.js'
import {
  isTestEnvironment
} from '../../api/config';

const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    couponList: [], //页面数据
    isEmpty: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    wx.hideShareMenu(); //取消顶部分享
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: async function () {
    let {
      couponList
    } = this.data;
    try {
      let storageInfo = await getStorageInfoPromisify();
      if (storageInfo.keys.includes('Token')) {
        showLoadingPromisify();
        let coupons = await getMyCouponList();
        if (typeof coupons === 'undefined' || !coupons) throw new Error(`getMyCouponList api is ${coupons}`)
        if (coupons.statusCode === 200) {
          if (coupons.data.length === 0) {
            this.setData({
              isEmpty: true
            })
          } else {
            coupons.data.map(item => {
              let coupon = {};
              coupon['money'] = item.coupon_info.money;
              coupon['notice'] = item.coupon_info.notice;
              coupon['coupon_id'] = item.coupon_id;
              coupon['expired'] = item.expired.slice(5);
              couponList.push(coupon)
            })
            this.setData({
              isEmpty: false,
              couponList
            })
          }
        } else {
          throw new Error(`statusCode of getMyCouponList is ${coupons.statusCode}`)
        }
      } else {
        let errModal = await showModalPromisify({
          content: '账号异常,点击确定返回首页',
          showCancel: false
        });
        errModal.confirm && jumpToPromisify('index', 'reLaunch')
      }
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        content: String(error),
        showCancel: false
      })
    }
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
    jumpToPromisify('circle', 'reLaunch');
  }
})
