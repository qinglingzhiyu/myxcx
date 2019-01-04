// pages/message-detail/message-detail.js
import {
  jumpToPromisify,
  getStorageInfoPromisify,
  showLoadingPromisify
} from "../../api/promisify.js"
import {
  getMessageNotice,
  MarkMessage
} from "../../api/request.js"
import regeneratorRuntime from "../../api/regeneratorRuntime.js"
import { sleep } from "../../common/common.js"

const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isEmpty: true,
    messageList: [], //页面数据
    on:""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function(options) {
   
  },

  /**
   * 跳转TA的信息页
   */
  goPageWithMyEdit: function(e) {
    jumpToPromisify('my-edit', 'navigate', {
      bottomBtn: e.currentTarget.dataset.btn,
      userId: e.currentTarget.dataset.userid,
      navTitle: e.currentTarget.dataset.navtitle,
      circleId: e.currentTarget.dataset.circleid
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow:async function() {
    let _this = this;
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes("Token")) {
      showLoadingPromisify();
      let result = await getMessageNotice({
        all_notice: 0
      })
      
      if (result.statusCode === 200) {
        //判断是否为空
        result.data.length >0 && _this.setData({
          isEmpty: false,
        })
        //判断是否发布照片
        result.data.map(item => {
          if (item.notice_type === 1 || 3) item["isPhoto"] = false;
          if (item.notice_type === 0 || 2) item["isPhoto"] = true;
          if (item.is_read === 0 ) item["on"] = "on";
          if (item.is_read === 1 ) item["on"] = "";
        })
        _this.setData({
          messageList: result.data
        })
      } else {
        showToastPromisify({
          title: "网络错误,请返回!"
        })
      }
    } else {
      showToastPromisify({
        title: "未登录,请返回!"
      })
      jumpToPromisify("index", "reLaunch")
    }
  },

  /**
   * 获取数据
   */
  getList:function () {
    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  },

  /**
   * 跳转圈子首页
   */
  goPageWithCircle: function() {
    jumpToPromisify("circle", "reLaunch");
  },

  /**
   * 搜集formId
   */
  bindSubmit: function(e) {
    let {
      formId
    } = e.detail;
    formId && app.data.formID.push(formId);
  },

  /**
   * 跳转动态详情
   */
  goPageWithDynamicDetail:async function(e) {
    let { feedid,noticeid } = e.currentTarget.dataset;
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes("Token")) {
      let result = await MarkMessage({
        type: 1,
        notice_id: noticeid
      })
      if (result.statusCode === 200) {
        jumpToPromisify("dynamic-detail", "navigate", {
          feedId: feedid
        })
      } else {
        showToastPromisify({
          title: "网络错误,请重试!"
        })
      }
    } else {
      showToastPromisify({
        title: "未登录,请返回!"
      })
      await sleep(1500)
      jumpToPromisify("index", "reLaunch")
    }
    
  },



})