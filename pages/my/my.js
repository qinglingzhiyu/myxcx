// pages/my/my.js
import {
  getStoragePromisify,
  jumpToPromisify,
  showToastPromisify,
  getStorageInfoPromisify
} from "../../api/promisify.js"
import {
  getUseridInfo,
  getPhone,
  getConfig
} from "../../api/request.js"
import regeneratorRuntime, {
  async
} from "../../api/regeneratorRuntime.js"
import {
  config
} from "../../api/config.js"

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
    userData: {}, //页面数据
    qxAppid:null, //跳转的appid
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    let {
      comeFrom
    } = options;
    if (comeFrom && comeFrom === "coupon") jumpToPromisify("coupons")
    //底部导航
    let pointStatus = wx.getStorageSync("pointStatus") || false;
    tabBar.tabbarmain("tabBar", 3, this, pointStatus);

    //获取牵线的appid
    let result =await getConfig({key:'jump'})
    if(typeof result === "undefined" && !result) throw new Error(`getConfig api is ${result}`)
    if(result.statusCode ===200){
      this.setData({qxAppid:result.data.detail})
    }else{
      throw new Error(`getConfig api statusCode is ${result.statusCode}`)
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: async function () {
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes("userId") && storageInfo.keys.includes("NICKNAME")) {
      let userId = wx.getStorageSync("userId");
      let nickname = wx.getStorageSync("NICKNAME");
      let userinfo = await getUseridInfo({
        user_id: userId
      })
      if (userinfo.statusCode === 200) {
        let userData = this.data.userData
        userData["avatar"] = userinfo.data.avatar;
        userData["occupation"] = userinfo.data.occupation || nickname;
        userData["userId"] = userinfo.data.id
        this.setData({
          userData
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
    if (e.detail === "close") {
      _this.setData({
        isCloseByLogin: false,
        isCloseByMask: false,
      })
    } else {
      if (e.detail.isAPP) {
        _this.setData({
          isCloseByLogin: false,
          isCloseByWarm: true,
        })
      } else {
        _this.setData({
          isCloseByLogin: false,
          isCloseByMask: false,
        })
        showToastPromisify({
          title: "绑定成功"
        })
      }
    }


  },

  /**
   * 关闭warm
   */
  goLoginByWarm: function (e) {
    if (e.detail === "close") {
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
          title: "绑定成功"
        })
      } else {
        showToastPromisify({
          title: "绑定失败,请重试!"
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
    if (storageInfo.keys.includes("Token")) {
      let tokentoken = await getStoragePromisify("Token")
      let result = await getPhone();
      if (result.statusCode === 200) {
        if (result.data.detail === "") this.setData({
          isCloseByMask: true,
          isCloseByLogin: true,
        });
        else jumpToPromisify("bind-phone", "navigate", {
          phone: result.data.detail
        });
      } else {
        showToastPromisify({
          title: "网络错误",
          image: "/images/icon/fail.png"
        })
      }
    } else {

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
    cometo === "edit" && jumpToPromisify("my-edit", "navigate", {
      bottomBtn: "编辑信息",
      userId: userid
    })
    cometo === "share" && jumpToPromisify("my-edit", "navigate", {
      bottomBtn: "分享名片给好友",
      userId: userid
    })
  },

  /**
   * 跳转编辑信息
   */
  goPageWithPersonInfo: (e) => {
    jumpToPromisify('person-info', "navigate", {
      userId: e.currentTarget.dataset.userid,
      comeTo: "my"
    })
  },

  /**
   * 跳转我的动态
   */
  goPageWithMyDynamic: (e) => {
    let {
      userid
    } = e.currentTarget.dataset;
    jumpToPromisify('dynamic', "navigate", {
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
    e.currentTarget.dataset.url !== "my" &&
      jumpToPromisify(e.currentTarget.dataset.url, "reLaunch")
  },

  /**
   * 跳转带授权的页面
   */
  goOtherPagesWithAuthor: function (e) {
    e.detail.errMsg === "getUserInfo:ok" &&
      e.currentTarget.dataset.url !== "my" &&
      jumpToPromisify(e.currentTarget.dataset.url, "reLaunch")
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
    jumpToPromisify("coupons")
  },

})
