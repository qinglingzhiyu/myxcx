// pages/circle-dynamic-release/circle-dynamic-release.js
import {
  jumpToPromisify,
  showToastPromisify,
  showModalPromisify,
  getStoragePromisify,
  chooseImagePromisify,
  showLoadingPromisify,
  getStorageInfoPromisify,
} from '../../api/promisify.js'
import {
  releaseDynamic
} from '../../api/request.js'
import regeneratorRuntime from '../../api/regeneratorRuntime.js'
import {
  config,
  isTestEnvironment
} from '../../api/config.js'

const qiniuUploader = require('../../common/qiniuUploader.js')
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    content: '',
    images: [],
    isUploading: true,
    circleId: 0, //当前圈子

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad:async function(options) {
    let storageInfo =await getStorageInfoPromisify();
    if (!storageInfo.keys.includes('qiniuToken')) {
      QiniuToken()
    }
    this.setData({
      circleId: options.circleId
    })
    wx.hideShareMenu(); //取消顶部分享
  },

  /**
   * 生活照上传
   */
  choosePhoto: async function() {
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes('qiniuToken')) {
      let { qiniuToken } = await getStoragePromisify('qiniuToken');
      try {
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
         let { images } = this.data;
          images.push(res.imageURL)
          if (images.length >= 9) this.setData({
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
        content: "账号异常,请返回首页",
        showCancel: false
      });
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
   * 删除图片
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
    if (images.length < 9) this.setData({
      images,
      isUploading: true
    });
    else this.setData({
      images
    })
  },

  /**
   * 搜集formid和保存照片
   */
  bindSubmit: async function(e) {
    let {
      formId
    } = e.detail
    formId && app.data.formID.push(formId);
    
    let {
      content
    } = e.detail.value;
    let {
      images,
      circleId
    } = this.data;
    if (content || images.length>0) {
      let storageInfo = await getStorageInfoPromisify();
      if (storageInfo.keys.includes('Token')) {
        showLoadingPromisify()
        let result = await releaseDynamic({
          type: 0,
          circle_id: circleId,
          content,
          images:images.join(',')
        })
        if (result.statusCode === 201) {
          showToastPromisify({
            title: '发布完成',
            image: '/images/icon/success.png'
          })
          jumpToPromisify(1, 'back')
        } else {
          showToastPromisify({
            title: '网络错误! 请重试!'
          })
        }
      } else {
        let errModel = await showModalPromisify({
          title:'提示',
          content:'账号异常,点击确认返回',
          showCancel:false,
        })
        errModel.confirm && jumpToPromisify('index','reLaunch')
      }
    } else {
      showToastPromisify({
        title: '填写信息,才能发布哦!'
      })
    }
  }
})