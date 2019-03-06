/**
 * Created by Terris
 * https://github.com/qinglingzhiyu
 *
 * @date: 2019-01-09
 * @flow
 *
 * description: consulting的逻辑
 *
 */

import {
  getStorageInfoPromisify,
  showToastPromisify,
  jumpToPromisify,
  getStoragePromisify,
  chooseImagePromisify,
  showLoadingPromisify
} from '../../api/promisify.js'
import regeneratorRuntime, {
  async
} from '../../api/regeneratorRuntime.js'
import {
  feedbackUrl
} from '../../api/request.js'
import {
  sleep,
  QiniuToken
} from '../../common/common.js'
import {
  config
} from '../../api/config.js'

const qiniuUploader = require('../../common/qiniuUploader.js')
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    placeholderContent: '请填写您宝贵的意见或者遇到的问题',
    images: [],
    isUploading: true
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow:async function () {
    let storageInfo = await getStorageInfoPromisify();
    if (!storageInfo.keys.includes('qiniuToken')) {
      QiniuToken()
    }
  },

  /**
   * 生活照上传
   */
  choosePhoto: async function () {
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes('qiniuToken')) {
      try {
        let {
          qiniuToken
        } = await getStoragePromisify('qiniuToken');
        let result = await chooseImagePromisify({
          count: 1,
          sizeType: 'compressed'
        })
        showLoadingPromisify({
          title: '上传中'
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
            title: '上传失败!'
          })
        }, {
          region: 'ECN',
          domain: config.domain,
          uptoken: qiniuToken
        })
      } catch (error) {
        if (error.errMsg !== "chooseImage:fail cancel")
          await showModalPromisify({
            content: "微信客户端未授权相机权限，请授权",
            showCancel: false
          });
      }
    } else {
      await showModalPromisify({
        content: '账号异常,请返回重试',
        showCancel: false
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
   * 删除照片
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
      title: '删除成功'
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
    if (textarea.replace(/\s*/g, '').length === 0 && images.length === 0) {
      showToastPromisify({
        title: '请输入您的宝贵意见'
      })
    } else {
      let storageInfo = await getStorageInfoPromisify();
      if (storageInfo.keys.includes('Token')) {
        let result = await feedbackUrl({
          type: 1,
          content: textarea,
          src: images.join(',')
        })
        if (result.statusCode === 200) {
          await showToastPromisify({
            title: '提示成功，感谢您的反馈',
            duration: 1500
          });
          await sleep(1500);
          jumpToPromisify(1, 'back');
        } else {
          showToastPromisify({
            title: '网络异常,请重试'
          })
        }
      }
    }
  },
})
