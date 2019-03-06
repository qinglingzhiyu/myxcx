/**
 * Created by Terris
 * https://github.com/qinglingzhiyu
 *
 * @date: 2019-01-10
 * @flow
 *
 * description: 绑定手机页面的逻辑
 *
 */

import {
  jumpToPromisify,
  showToastPromisify
} from '../../api/promisify.js'
import regeneratorRuntime from '../../api/regeneratorRuntime.js'
import {
  sleep
} from '../../common/common.js'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    phone: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    let {
      phone
    } = options;
    if (phone) {
      this.setData({
        phone
      })
    } else {
      showToastPromisify({
        title: '未绑定手机号,请返回'
      })
      await sleep(1000)
      jumpToPromisify(1, 'back')
    }
    wx.hideShareMenu(); //取消顶部分享
  },
})
