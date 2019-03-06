/**
 * Created by Terris
 * https://github.com/qinglingzhiyu
 *
 * @date: 2019-01-09
 * @flow
 *
 * description: my 的逻辑
 *
 */

import {
  jumpToPromisify,
  showModalPromisify,
  showToastPromisify,
  getStoragePromisify,
  getStorageInfoPromisify
} from '../../api/promisify.js'
import {
  getUseridInfo,
  getPhone,
  getConfig
} from '../../api/request.js'
import regeneratorRuntime, {
  async
} from '../../api/regeneratorRuntime.js'
import {
  isTestEnvironment
} from '../../api/config.js'
import { MasterMapByThumbnail } from '../../common/common'

const app = getApp()
const tabBar = require('../../template/tabBar-template/tabbar.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isCloseByMask: false,
    isCloseByLogin: false,
    isCloseByWarm: false,
    userData: {
      avatar:'/images/touxiang.jpg'
    }, //页面数据
    qxAppid:null, //跳转的appid
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let {
      comeFrom
    } = options;
    if (comeFrom && comeFrom === 'coupon') jumpToPromisify('coupons')

    //底部导航
    let pointStatus = wx.getStorageSync('pointStatus') || false;
    tabBar.tabbarmain('tabBar', 3, this, pointStatus);

    wx.hideShareMenu(); //取消顶部分享
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady:async function () {
    //获取牵线的appid
    try {
      let result =await getConfig({key:'jump'})
      if (typeof result === 'undefined') throw new Error(`getConfig is ${result}`)
      if (result.statusCode ===200) {
        this.setData({qxAppid:result.data.detail})
      } else {
        throw new Error(`getConfig api statusCode is ${result.statusCode}`)
      }
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        title:'测试提示',
        content:String(error)
      })
    }
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: async function () {
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes('userId') && storageInfo.keys.includes('NICKNAME')) {
      try {
        let { userId, NICKNAME } = await getStoragePromisify(['userId','NICKNAME']);
        if (typeof userId === 'undefined') throw new Error(`userId is ${userId}`)
        let userinfo = userId && await getUseridInfo({
          user_id: userId
        })
        if (typeof userinfo === 'undefined') throw new Error(`getUseridInfo api is ${userinfo}`) 
        if (userinfo.statusCode === 200) {
          let userData = this.data.userData
          userData['avatar'] = MasterMapByThumbnail(userinfo.data.avatar,180);
          userData['occupation'] = userinfo.data.occupation || NICKNAME;
          userData['userId'] = userinfo.data.id
          this.setData({
            userData
          })
        } else {
          throw new Error(`statusCode of getUseridInfo: ${userinfo.statusCode}`)
        }
      } catch (error) {
        isTestEnvironment && await showModalPromisify({
          title:'测试提示',
          content:String(error)
        })
      }
    }
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
   * 关闭弹窗
   */
  closeMask: function (e) {
    var _this = this;
    _this.setData({
      isCloseByMask: e.detail,
      isCloseByLogin: e.detail,
    })
  },

  /**
   * 关闭登录框
   */
  goLoginByPhone: function (e) {
    let _this = this;
    if (e.detail === 'close') {
      _this.setData({
        isCloseByLogin: false,
        isCloseByMask: false,
      })
    } else {
      if (e.detail.isAPP) {
        _this.setData({
          isCloseByLogin: false,
          isCloseByWarm: true,
        });
        showToastPromisify({
          title: '绑定成功'
        })
      }else if(e.detail.detail ==='验证码错误'){
        showToastPromisify({
          title: '验证码错误'
        })
      } else {
        _this.setData({
          isCloseByLogin: false,
          isCloseByMask: false,
        })
       
      }
    }


  },

  /**
   * 关闭warm
   */
  goLoginByWarm:async function (e) {
    if (e.detail === 'close') {
      this.setData({
        isCloseByMask: false,
        isCloseByWarm: false,
      })
    } else {
      if (e.detail === 200) {
        this.setData({
          isCloseByMask: false,
          isCloseByWarm: false,
        });
        showToastPromisify({
          title: '绑定成功'
        })
      } else {
        let errModel = await showModalPromisify({
          title:'绑定失败',
          content:'您的手机已绑定微信号，如需更换，请联系客服微信号 daqinjia02',
          showCancel:false,
        })
        errModel.confirm && this.setData({
          isCloseByMask: false,
          isCloseByWarm: false,
        })
      }
    }
  },

  /**
   * 绑定手机号
   *
   */
  bindPhone: async function (e) {
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes('Token')) {
      let result = await getPhone();
      if (result.statusCode === 200) {
        if (result.data.detail === '') this.setData({
          isCloseByMask: true,
          isCloseByLogin: true,
        });
        else jumpToPromisify('bind-phone', 'navigate', {
          phone: result.data.detail
        });
      } else {
        showToastPromisify({
          title: '网络错误',
          image: '/images/icon/fail.png'
        })
      }
    }
  },

  /**
   * 跳转相亲资料
   */
  goPageWithMyEdit: function (e) {
    let {
      userid,
      cometo
    } = e.currentTarget.dataset;
    cometo === 'edit' && jumpToPromisify('my-edit', 'navigate', {
      bottomBtn: '编辑信息',
      userId: userid
    })
    cometo === 'share' && jumpToPromisify('my-edit', 'navigate', {
      bottomBtn: '分享名片给好友',
      userId: userid
    })
  },

  /**
   * 跳转编辑信息
   */
  goPageWithPersonInfo: (e) => {
    jumpToPromisify('person-info', 'navigate', {
      userId: e.currentTarget.dataset.userid,
      comeTo: 'my'
    })
  },

  /**
   * 跳转我的动态
   */
  goPageWithMyDynamic: (e) => {
    let {
      userid
    } = e.currentTarget.dataset;
    jumpToPromisify('dynamic', 'navigate', {
      userId: userid
    })
  },

  /**
   * 跳转意见反馈
   */
  goPageWithConsulting: () => {
    jumpToPromisify('consulting')
  },

  /**
   * 跳转其他页面
   */
  goOtherPages: function (e) {
    e.currentTarget.dataset.url !== 'my' &&
      jumpToPromisify(e.currentTarget.dataset.url, 'reLaunch')
  },

  /**
   * 跳转带授权的页面
   */
  goOtherPagesWithAuthor: function (e) {
    e.detail.errMsg === 'getUserInfo:ok' &&
      e.currentTarget.dataset.url !== 'my' &&
      jumpToPromisify(e.currentTarget.dataset.url, 'reLaunch')
  },

  /**
   * 保存formid
   */
  bindSubmit: function (e) {
    let {
      formId
    } = e.detail;
    formId && app.data.formID.push(formId);
  },

  /**
   * 跳转我的优惠券
   */
  goPageWithCupons: function (e) {
    jumpToPromisify('coupons')
  },

})
