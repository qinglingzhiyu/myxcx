// pages/consulting/consulting.js


import {
  getStorageInfoPromisify,
  showToastPromisify,
  jumpToPromisify,
  getStoragePromisify,
  chooseImagePromisify,
  showLoadingPromisify
} from "../../api/promisify.js"
import regeneratorRuntime from "../../api/regeneratorRuntime.js"
import {
  feedbackUrl
} from "../../api/request.js"
import {
  sleep
} from "../../common/common.js"
import {
  config
} from "../../api/config.js"

const qiniuUploader = require("../../common/qiniuUploader.js")
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    placeholderContent: "请填写您宝贵的意见或者遇到的问题",
    images: [],
    isUploading: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

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
   * 生活照上传
   */
  choosePhoto: async function () {
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes("qiniuToken")) {
      let {
        qiniuToken
      } = await getStoragePromisify("qiniuToken");
      let result = await chooseImagePromisify({
        count: 1,
        sizeType: "compressed"
      })
      showLoadingPromisify({
        title: "上传中"
      })
      let filePath = result.tempFilePaths[0];
      qiniuUploader.upload(filePath, (res) => {
        wx.hideLoading()
        let {
          images
        } = this.data;
        images.push(res.imageURL)
        if (images.length >= 4) this.setData({
          images,
          isUploading: false
        });
        else this.setData({
          images,
          isUploading: true
        })
      }, (err) => {
        showToastPromisify({
          title: "上传失败!"
        })
      }, {
        region: 'ECN',
        domain: config.domain,
        uptoken: qiniuToken
      })
    }
  },

  /**
   * 预览图片
   */
  goPreview: function (e) {
    let {
      index
    } = e.currentTarget.dataset;
    let {
      images
    } = this.data;
    wx.previewImage({
      urls: images,
      current: images[index]
    })
  },

  /**
   * 
   * @param {*} e 
   */
  closeImg: function (e) {
    let {
      index
    } = e.currentTarget.dataset;
    let {
      images
    } = this.data;
    images.splice(index, 1);
    showToastPromisify({
      title: "删除成功"
    })
    if (images.length < 4) this.setData({
      images,
      isUploading: true
    });
    else this.setData({
      images
    })
  },

  /**
   *  搜集formid && 提交
   * @param {*} e 
   */
  
  bindSubmit: async function (e) {
    let {
      formId
    } = e.detail;
    let {
      images
    } = this.data;
    let {
      textarea
    } = e.detail.value;
    formId && app.data.formID.push(formId);
    if (textarea === "" && images.length === 0) {
      showToastPromisify({
        title: "请输入您的宝贵意见"
      })
    } else {
      let storageInfo = await getStorageInfoPromisify();
      if (storageInfo.keys.includes("Token")) {
        let result = await feedbackUrl({
          type: 1,
          content: textarea,
          src: images.join(",")
        })
        if (result.statusCode === 200) {
          await showToastPromisify({
            title: "提示成功，感谢您的反馈",
            duration: 1500
          });
          await sleep(1500);
          jumpToPromisify(1, "back");
        } else {
          showToastPromisify({
            title: "网络异常,请重试"
          })
        }
      } else showToastPromisify({
        title: "未登录,请返回!"
      }), await sleep(1500), jumpToPromisify("index", "reLaunch");
    }
  },
})