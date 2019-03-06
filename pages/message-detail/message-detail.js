// pages/message-detail/message-detail.js
import {
  jumpToPromisify,
  getStorageInfoPromisify,
  showLoadingPromisify,
  showModalPromisify
} from '../../api/promisify.js'
import {
  getMessageNotice,
  MarkMessage
} from '../../api/request.js'
import regeneratorRuntime from '../../api/regeneratorRuntime.js'
import {
  isTestEnvironment
} from '../../api/config';

const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isEmpty: true,
    messageList: [], //页面数据
    on: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {

  },

  /**
   * 跳转TA的信息页
   */
  goPageWithMyEdit: function (e) {
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
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: async function () {
    try {
      let storageInfo = await getStorageInfoPromisify();
      if (storageInfo.keys.includes('Token')) {
        showLoadingPromisify();
        let result = await getMessageNotice({
          all_notice: 0
        })
        if (typeof result === 'undefined' || !result) throw new Error(`getMessageNotice api is ${result}`)
        if (result.statusCode === 200) {
          //判断是否为空
          result.data.length > 0 && this.setData({
            isEmpty: false,
          })
          //判断是否发布照片
          result.data.map(item => {
            //notice_type 0 点赞无图片  1点赞有图片 2评论无图片 3评论有图片
            if (item.notice_type === 1 || item.notice_type === 3) item['isPhoto'] = true;
            if (item.notice_type === 0 || item.notice_type === 2) item['isPhoto'] = false;
            if (item.is_read === 0) item['on'] = 'on';
            if (item.is_read === 1) item['on'] = '';
          })
          this.setData({
            messageList: result.data
          })
        } else throw new Error(`statusCode of getMessageNotice is ${result.statusCode}`)
      } else {
        let errModel = await showModalPromisify({
          title: '提示',
          content: '账号异常,点击确认返回首页'
        })
        errModel.confirm && jumpToPromisify('index', 'reLaunch')
      }
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        title: '错误提示',
        content: String(error)
      })
    }

  },

  /**
   * 获取数据
   */
  getList: function () {

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
   * 跳转圈子首页
   */
  goPageWithCircle: function () {
    jumpToPromisify('circle', 'reLaunch');
  },

  /**
   * 搜集formId
   */
  bindSubmit: function (e) {
    let {
      formId
    } = e.detail;
    formId && app.data.formID.push(formId);
  },

  /**
   * 跳转动态详情
   */
  goPageWithDynamicDetail: async function (e) {
    let {
      feedid,
      noticeid
    } = e.currentTarget.dataset;
    let storageInfo = await getStorageInfoPromisify();
    try {
      if (storageInfo.keys.includes('Token')) {
        let result = await MarkMessage({
          type: 1,
          notice_id: noticeid
        })
        if (typeof result === 'undefined' || !result) throw new Error(`MarkMessage api is ${result}`)
        if (result.statusCode === 200) {
          jumpToPromisify('dynamic-detail', 'navigate', {
            feedId: feedid
          })
        } else throw new Error(`statusCode of MarkMessage api is ${result.statusCode}`)
      } else {
        let errModel = await showModalPromisify({
          title: '提示',
          content: '账号异常,点击确认返回首页'
        })
        errModel.confirm && jumpToPromisify('index', 'reLaunch')
      }
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        title: '错误提示',
        content: String(error)
      })
    }
  },
})
