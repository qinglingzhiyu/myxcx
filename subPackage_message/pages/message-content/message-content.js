// pages/message-content/message-content.js
import {
  getMessageNotice,
  postMessageNotice
} from "../../../api/request.js"
import {
  getStorageInfoPromisify,
  showToastPromisify,
  getStoragePromisify,
  jumpToPromisify,
  chooseImagePromisify,
  showLoadingPromisify
} from "../../../api/promisify.js"
import regeneratorRuntime from "../../../api/regeneratorRuntime.js"
import {
  timeCycle,
  isNull
} from "../../../common/common.js"
import {
  config
} from "../../../api/config.js"

const qiniuUploader = require("../../../common/qiniuUploader.js")
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    messageData: [], //页面数据
    currentPage: 1,
    with_user_id: 0,
    disabled: true,
    onStyle: "",
    content: "",
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {

    let {
      with_user_id,
      navTitle
    } = options;
    navTitle && wx.setNavigationBarTitle({
      title: navTitle || "工程师"
    })
    with_user_id && this.setData({
      with_user_id
    })
    let result = await this.messageList({
      with_user_id,
      page: 1
    });

    result && this.setData({
      messageData: result.results.reverse()
    })
  },

  /**
   * 获取数据列表
   */
  messageList: async function (param) {
    let _this = this;
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes("Token") && storageInfo.keys.includes("userId")) {
      let user_id = wx.getStorageSync("userId");
      showLoadingPromisify();
      let result = await getMessageNotice({ ...param
      });
      if (result.statusCode === 200) {
        let {
          results,
          next
        } = result.data;
        results.map(item => {
          if (item.send_user_id === user_id) {
            item["userR"] = "user-right";
            item["contentR"] = "content-right"
            item["detailR"] = "detail-right"
            item["msgR"] = "msg-right"
          } else {
            item["userR"] = "";
            item["contentR"] = "";
            item["detailR"] = "";
            item["msgR"] = ""
          }
          item["create_time"] = timeCycle(item.create_time)
        })
        return {
          results,
          next
        }
      }
    } else {
      showToastPromisify({
        title: "未登录,请返回!"
      })
      jumpToPromisify("index", "reLaunch")
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
  onPullDownRefresh: async function () {
    let {
      currentPage,
      with_user_id,
      messageData
    } = this.data;
    currentPage += 1;
    let result = await this.messageList({
      with_user_id,
      page: currentPage
    })
    result.results && (
      result.results.map(item => {
        messageData.unshift(item)
      }), this.setData({
        messageData,
      }), wx.stopPullDownRefresh()
    );
    result.next && this.setData({
      currentPage
    }) //通过返回数据有next字段则修改页数

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: async function () {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  /**
   * 搜集formId 和发送内容
   */
  bindSubmit: async function (e) {
    //搜集formid
    let {
      formId
    } = e.detail;
    formId && app.data.formID.push(formId);
    let {
      content
    } = e.detail.value;
    let {
      with_user_id
    } = this.data;


    let result = content && await postMessageNotice({
      type: 0,
      to_user_id: with_user_id,
      message_type: 0,
      content
    })
    if (result && result.statusCode === 200) {
      showToastPromisify({
        title: "发送成功!"
      })
      let result2 = await this.messageList({
        with_user_id,
        page: 1
      })
      result2 && this.setData({
        messageData: result2.results.reverse(),
        content: "",
        disabled: true,
        onStyle: "",
      })
    } else if (result && result.statusCode !== 200) {
      showToastPromisify({
        title: "发送失败!"
      })
    }
  },

  /**
   * 跳转TA的信息页
   */
  goPageWithMyEdit: async function (e) {
    let {
      userid
    } = e.currentTarget.dataset;
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes("userId")) {
      let dataByStorge = await getStoragePromisify('userId');
      dataByStorge.userId !== userid && jumpToPromisify("my-edit", "navigate", {
        bottomBtn: "留言",
        userId: userid,
        navTitle: "TA的信息"
      })
    } else {
      jumpToPromisify("index", "reLaunch")
    }
  },

  /**
   * 跳转下载app
   */
  goPageWithDown: function () {
    jumpToPromisify("down")
  },

  /**
   * 选择图片
   */
  chooseImg: async function (e) {
    let {
      with_user_id
    } = this.data;
    let qiniuToken = (await getStoragePromisify("qiniuToken")).qiniuToken;
    if (!qiniuToken) return; //如果没有七牛token则返回
    let result = await chooseImagePromisify({
      count: 1,
      sizeType: "compressed"
    })
    showLoadingPromisify({
      title: "上传中"
    })
    let filePath = result.tempFilePaths[0];
    qiniuUploader.upload(filePath, async (res) => {
      wx.hideLoading()
      let result = await postMessageNotice({
        type: 0,
        to_user_id: with_user_id,
        message_type: 1,
        content: res.imageURL
      })
      if (result.statusCode === 200) {
        showToastPromisify({
          title: "发送成功!"
        })
        let result2 = await this.messageList({
          with_user_id,
          page: 1
        })
        result2 && this.setData({
          messageData: result2.results.reverse()
        })
      } else {
        showToastPromisify({
          title: "发送失败!"
        })
      }
    }, (err) => {

      showToastPromisify({
        title: "上传失败!"
      })
    }, {
      region: 'ECN',
      domain: config.domain,
      uptoken: qiniuToken
    })
  },

  /**
   * 预览图片
   */
  goPreview: function (e) {
    let {
      index
    } = e.currentTarget.dataset;
    let {
      messageData
    } = this.data;
    let imgs = [];
    imgs.push(messageData[index].content)
    wx.previewImage({
      urls: imgs,
      current: imgs[index]
    })
  },

  /**
   * 输入内容
   */
  changeInput: function (e) {
    let {
      value
    } = e.detail
    if (!isNull(value)) {
      this.setData({
        onStyle: "background-color: #D33B33; color: #fff;",
        disabled: false
      })
    } else {
      this.setData({
        onStyle: "",
        disabled: true
      })
    }
  },

  /**
   * 发表情
   */
  onExpression: function () {
    showToastPromisify({
      title: "功能马上来哦"
    })
  }

})
