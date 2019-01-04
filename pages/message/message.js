// pages/message/message.js
import {
  jumpToPromisify,
  getStorageInfoPromisify,
  showLoadingPromisify,
  showToastPromisify,
  setStoragePromisify,
  getStoragePromisify
} from "../../api/promisify.js"
import {
  getMessageNotice,
  MarkMessage
} from "../../api/request.js"
import regeneratorRuntime from "../../api/regeneratorRuntime.js"
import {
  timeCycle,
  sleep
} from "../../common/common.js"

const app = getApp()
const tabBar = require('../../template/tabBar-template/tabbar.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    messageData: [], //页面数据
    isEmpty: true,
    content: "",
    isCloseByMask: false,
    isDelete: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad:async function(options) {
    
    let { comeFrom } = options;
    if (comeFrom && comeFrom === "detail") jumpToPromisify("message-detail"); 

    let pointStatus = wx.getStorageSync("pointStatus") || false;
    tabBar.tabbarmain("tabBar", 2, this, pointStatus);
  },

  /**
   * 获取页面信息
   */
  getData: async function() {
    let _this = this;
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes("Token")) {
      showLoadingPromisify();
      let message = await getMessageNotice();
      
      message && message.data.conversation.map(item => {
        item["update_time"] = timeCycle(item.update_time)
      })
      if (message.statusCode === 200) {
        let {
          conversation,
          notice_content,
          conversation_unread,
          notice_unread
        } = message.data;
        let {
          messageData
        } = _this.data;

        if (message.data.conversation.length > 0) {
          _this.setData({
            isEmpty: false
          })
        } else {
          _this.setData({
            isEmpty: true
          })
        }
        if (notice_unread>0){
          _this.setData({
            content:"content"
          })
        }else{
          _this.setData({
            content: ""
          })
        }
        if (notice_unread > 0 || conversation_unread > 0){
          messageData["notice_content"] = notice_content;
          messageData["conversation"] = conversation;
          await setStoragePromisify({ "pointStatus":true})
        }else {
          await setStoragePromisify({ "pointStatus": false })
        };
        _this.setData({
          messageData: message.data
        })
      } else {
        showToastPromisify({
          title: "网络错误!请重试"
        })
      }
    } else {
      showToastPromisify({
        title: "未登录,请返回!"
      })
      await sleep(1500);
      jumpToPromisify("index", "reLaunch")
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    this.getData()
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
   * 跳转其他页面
   */
  goOtherPages: function(e) {
    e.currentTarget.dataset.url !== "message" && jumpToPromisify(e.currentTarget.dataset.url, "reLaunch")
  },


  /**
   * 跳转带授权的页面
   */
  goOtherPagesWithAuthor: function(e) {
    e.currentTarget.dataset.url !== "message" &&
      e.detail.errMsg === "getUserInfo:ok" &&
      jumpToPromisify(e.currentTarget.dataset.url, "reLaunch")
  },

  /**
   * 跳转动态提醒
   */
  goPageWithMessageDetail: async function(e) {
    jumpToPromisify("message-detail")
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
   * 
   */
  goPageWithMessageContent: function(e) {
    let {withuserid, navtitle} = e.currentTarget.dataset;
    jumpToPromisify("message-content", "navigate", {
      with_user_id: withuserid,
      navTitle:navtitle
    })
  },

  /**
   * 删除
   */
  deleteMessage: function(e) {
    let {
      conversationid
    } = e.currentTarget.dataset
    this.setData({
      isCloseByMask: true,
      isDelete: true,
      conversationid
    })
  },

  /**
   * 确认删除
   */
  affirmDelete: async function() {
    let {
      conversationid
    } = this.data;
    let result = await MarkMessage({
      type: 2,
      conversation_id: conversationid
    });
    if (result.statusCode === 200) {
      showToastPromisify({
        title: "删除成功"
      });
    } else {
      showToastPromisify({
        title: "删除失败"
      });
    }
    this.getData();
    this.setData({
      isDelete: false,
      isCloseByMask: false,
    })
  },

  /**
   * 关闭蒙层
   */
  closeMask: function(e) {
    e.detail === "close" && this.setData({
      isDelete: false,
      isCloseByMask: false,
    })
  }
})