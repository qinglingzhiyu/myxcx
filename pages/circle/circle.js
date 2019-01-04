// pages/circle/circle.js
import {
  jumpToPromisify,
  getStorageInfoPromisify,
  showLoadingPromisify,
  showToastPromisify,
  getStoragePromisify,
  setStoragePromisify,
  checkSessionPromisify
} from "../../api/promisify.js"
import {
  getRecommendList,
  getRecommendWithoutToken, 
  login,
} from "../../api/request.js"
import regeneratorRuntime from "../../api/regeneratorRuntime.js"
import {
  sleep,
  compareByAntitone,
  QiniuToken
} from "../../common/common.js"

const app = getApp()
const tabBar = require('../../template/tabBar-template/tabbar.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isOwn: false,
    myCircleList: [],
    selectCircleList: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function(options) {
    let {from, userId} = options;
    if(from === "share"){
      let storageInfo = await getStorageInfoPromisify();
      if (storageInfo.keys.includes("userId")) {
        let myUserid = (await getStoragePromisify("userId")).userId;
        
        if(myUserid === Number(userId)) jumpToPromisify("my-edit","navigate",{
          navTitle: "我的相亲名片",
          bottomBtn: "分享名片给好友",
          userId,
        });
        else jumpToPromisify("my-edit","navigate",{
          navTitle: "TA的信息",
          bottomBtn: "留言",
          userId,
        })
      }else jumpToPromisify("my-edit","navigate",{
        navTitle: "TA的信息",
        bottomBtn: "留言",
        userId,
      })
    }
    //底部导航
    let pointStatus = wx.getStorageSync("pointStatus") || false;
    tabBar.tabbarmain("tabBar", 1, this, pointStatus);
  },

  /**
   * 获取页面数据
   */
  getList: async function() {
    let _this = this;
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes("Token")) {
      showLoadingPromisify()
      let recommend = await getRecommendList();
      if (recommend.statusCode === 200) {
        wx.stopPullDownRefresh()
        let myCircleList = [];
        let selectCircleList = [];
        recommend.data.map((item, index) => {
          if (item.joined === 1) {
            //通过feed_unread判断 0是已读 1是未读
            if (item.feed_unread > 0) item["on"] = "on"
            else item["on"] = ""
            //通过feed_unread判断动态数
            if (item.feed_unread === 0) item["content"] = "赶紧去发布动态吧"
            else item["content"] = `有${item.feed_unread}条新动态`
            myCircleList.push(item);
          } else if (item.joined === 0) {
            selectCircleList.push(item);
          }
        })
        selectCircleList.sort(compareByAntitone('amount'));
        selectCircleList.map((item, index) => {
          index === 0 && (item["top_img"] = "/images/icon/top1.png");
          index === 1 && (item["top_img"] = "/images/icon/top2.png");
          index === 2 && (item["top_img"] = "/images/icon/top3.png");
        });
        myCircleList.length > 0 && _this.setData({
          isOwn: true
        });
        _this.setData({
          myCircleList,
          selectCircleList
        });
      } else {
        showToastPromisify({
          title: "网络错误"
        })
        jumpToPromisify("index", "reLaunch")
      }
    } else {
      let storageInfo = await getStorageInfoPromisify();
      if (storageInfo.keys.includes("prov")) {
        let prov = parseInt(wx.getStorageSync("prov")) || 31;
        let selectCircle = await getRecommendWithoutToken({
          prov
        })
        if (selectCircle.statusCode === 200) {
          let selectCircleList = [];
          selectCircle.data.map(item => {
            selectCircleList.push(item);
          })
          selectCircleList.map((item, index) => {
            index === 0 && (item["top_img"] = "/images/icon/top1.png");
            index === 1 && (item["top_img"] = "/images/icon/top2.png");
            index === 2 && (item["top_img"] = "/images/icon/top3.png");
          })
          _this.setData({
            selectCircleList
          })
        } else {
          showToastPromisify({
            title: "网络错误"
          })
          jumpToPromisify("index", "reLaunch")
        }
      } else {
        showToastPromisify({
          title: "网络错误"
        })
        jumpToPromisify("index", "reLaunch")
      }
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
    this.getList()
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
    this.getList()
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
    e.currentTarget.dataset.url === "index" && jumpToPromisify(e.currentTarget.dataset.url, "reLaunch")
  },

  
  /**
 * 跳转带授权的页面
 */
  goOtherPagesWithAuthor: async function (info) {
    if (info.detail.errMsg === "getUserInfo:fail auth deny") return;
    let { nickName } = info.detail.userInfo;
    setStoragePromisify({ "NICKNAME": nickName })
    let storageInfo = await getStorageInfoPromisify();
    if (!storageInfo.keys.includes("Token")) {
      let sessionStatus = await checkSessionPromisify();
      let result = sessionStatus.errMsg === "checkSession:ok" && await login({
        encryptedData: info.detail.encryptedData,
        iv: info.detail.iv
      });
      result.data && await setStoragePromisify({
        "Token": result.data.token,
        "userId": result.data.id
      });
      QiniuToken();
      info.detail.errMsg === "getUserInfo:ok" && jumpToPromisify(info.currentTarget.dataset.url, "reLaunch")
    } else jumpToPromisify(info.currentTarget.dataset.url, "reLaunch")
  },

  /**
   * 跳转到圈子介绍页
   */
  goPageWithCircleIntroduce: function(e) {
    const circleId = e.currentTarget.dataset.circleid;
    jumpToPromisify("circle-introduce", "navigate", {
      circleId,
    });
    setStoragePromisify({
      jump: "circleDynamic"
    })
  },

  /**
   * 跳转圈子动态
   */
  goPageWithCircleDynamic: async function(e) {
    let {
      completed,
      circleid,
      circlename,
      index
    } = e.currentTarget.dataset;
    let {
      myCircleList
    } = this.data;
    this.setData({
      myCircleList
    })
    if (completed === 0) {
      showToastPromisify({
        title: "你还没有填写信息哦"
      })
      await sleep(1500)
      jumpToPromisify("person-info", "navigate", {
        circleId: circleid,
        circleName: circlename,
      });
    } else {
      jumpToPromisify("circle-dynamic", "navigate", {
        circleId: circleid,
        navTitle: circlename
      })
    }
  },

  /**
   * 搜集formId
   */
  bindSubmit: function(e) {
    let {
      formId
    } = e.detail.formId
    formId && app.data.formID.push(formId);
  },
})