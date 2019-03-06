/**
 * Created by Terris
 * https://github.com/qinglingzhiyu
 *
 * @date: 2019-01-09
 * @flow
 *
 * description:  circle-introduce 逻辑
 *
 */

import {
  circleDetailWithToken,
  getCircleInfoWithoutToken,
  isJoinCircle
} from '../../api/request.js'
import regeneratorRuntime, {
  async
} from '../../api/regeneratorRuntime.js'
import {
  jumpToPromisify,
  showModalPromisify,
  showToastPromisify,
  setStoragePromisify,
  getStorageInfoPromisify,
} from '../../api/promisify.js'
import {
  isAuthor,
  QiniuToken,
} from '../../common/common.js'
import {
  isTestEnvironment
} from '../../api/config';

const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {},

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    let {
      circleId,
      comeFrom
    } = options;
    try {
      if (circleId) this.setData({
        circleId: circleId
      })
      else throw new Error(`circleId:${circleId}`)
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        title: '错误提示',
        content: String(error)
      })
    }
    comeFrom && this.setData({
      comeFrom
    })
    wx.hideShareMenu(); //取消顶部分享
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: async function () {
    let {
      circleId
    } = this.data;
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes('Token')) {
      try {
        let circleDetailData = await circleDetailWithToken(circleId);
        if (typeof circleDetailData === 'undefined' || !circleDetailData) throw new Error(`circleDetailWithToken api is ${circleDetailWithToken}`)
        if (circleDetailData.statusCode === 200) {
          circleDetailData.data['brief'] = circleDetailData.data.brief.split(',')
          circleDetailData.data['descr'] = circleDetailData.data.descr.split('\r\n')
          circleDetailData.data['welfare'] = circleDetailData.data.welfare.split('\r\n')
          this.setData({
            circleIntroduceData: circleDetailData.data
          }) //获取页面数据
        } else throw new Error(`statusCode of circleDetailWithToken is ${circleDetailData.statusCode}`)
      } catch (error) {
        isTestEnvironment && await showModalPromisify({
          title: '错误提示',
          content: String(error)
        })
      }
    } else {
      try {
        let circle = circleId && await getCircleInfoWithoutToken({
          circle_id: circleId
        });
        if (typeof circle === 'undefined') throw new Error(`getCircleInfoWithoutToken api is ${circle}`)
        if (circle.statusCode === 200) {
          circle.data['brief'] = circle.data.brief.split(',')
          circle.data['descr'] = circle.data.descr.split('\r\n')
          circle.data['welfare'] = circle.data.welfare.split('\r\n')
          this.setData({
            circleIntroduceData: circle.data
          })
        } else throw new Error(`statusCode of getCircleInfoWithoutToken is ${circle.statusCode}`)
      } catch (error) {
        isTestEnvironment && await showModalPromisify({
          title: '错误提示',
          content: String(error)
        })
      }
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
  onShareAppMessage: function (e) {
    let circleName = e.target.dataset.circlename; //当前圈子名称
    let circleId = this.data.circleId; //当前圈子id
    return {
      title: `请符合条件的您，加入${circleName},找到结婚对象!`,
      path: '/pages/circle-introduce/circle-introduce?circleId=' + circleId,
      imageUrl: '/images/share-bg.png'
    }
  },



  /**
   * 跳转越早越优惠页面
   */
  userInfo: async function (info) {
    if (info.detail.errMsg === 'getUserInfo:fail auth deny') return
    let {
      nickName
    } = info.detail.userInfo;
    setStoragePromisify({
      'NICKNAME': nickName
    })
    let {
      circleid,
      name
    } = info.currentTarget.dataset;
    if (typeof circleid === 'undefined' || !circleid) throw new Error(`circleid is ${circleid}`);
    if (typeof name === 'undefined' || !name) throw new Error(`circleName is ${name}`);
    let authorStatus = await isAuthor({
      encryptedData: info.detail.encryptedData,
      iv: info.detail.iv
    })
    if (authorStatus.statusCode === 'isOk' || authorStatus.statusCode === 200) {
      let result = await isJoinCircle({
        circle_id: circleid
      });
      if (!result) throw new Error('isJoinCircle api is undefined')
      if (result.statusCode === 200) {
        if (result.data.joined) jumpToPromisify('circle-dynamic', 'redirect', {
          circleId: circleid,
          navTitle: name
        });
        else jumpToPromisify('sale', 'redirect', {
          circleId: circleid
        })
      } else throw new Error(`isJoinCircle api is statusCode: ${result.statusCode}`), showToastPromisify({
        title: '网络错误'
      })
    } else throw new Error(`isAuthor api statusCode: ${authorStatus.statusCode}`), showToastPromisify({
      title: '网络错误'
    })

    if (authorStatus.statusCode === 200) QiniuToken();
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
   * 跳转圈子首页
   */
  goPageWithCircle: function () {
    jumpToPromisify('circle', 'reLaunch');
  }
})
