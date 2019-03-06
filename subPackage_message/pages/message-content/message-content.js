/**
 * Created by Terris
 * https://github.com/qinglingzhiyu
 *
 * @date: 2019-01-10
 * @flow
 *
 * description: 这是留言页面的逻辑
 *
 */

import {
  getMessageNotice,
  postMessageNotice
} from '../../../api/request.js'
import {
  getStorageInfoPromisify,
  showToastPromisify,
  getStoragePromisify,
  jumpToPromisify,
  chooseImagePromisify,
  showLoadingPromisify,
  showModalPromisify,
  getSystemInfoPromisify
} from '../../../api/promisify.js'
import regeneratorRuntime, {
  async
} from '../../../api/regeneratorRuntime.js'
import {
  timeCycle,
  isNull,
  QiniuToken
} from '../../../common/common.js'
import {
  config,
  isTestEnvironment
} from '../../../api/config.js'
import {
  EmojiTextArray,
  expContent,
} from '../../../common/const';


const qiniuUploader = require('../../../common/qiniuUploader.js')
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
    affirmOn: '',
    content: '',
    isEmotion: false,
    navTitle: '工程师',
    clickEmoji: '',
    height: 0, //可使用窗口高度
    scrollTop: 0, //滚动的高度
    animateType: '', //动画类型
    padBottom: '', //点击表情内容上移
    focus: true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    let {
      with_user_id,
      navTitle
    } = options;
    let windowHeight;
    try {
      let result = await getSystemInfoPromisify();
      windowHeight = (result.windowHeight * (750 / result.windowWidth));
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        title: '错误提示',
        content: String(error)
      })
    }
    this.setData({
      with_user_id,
      navTitle,
      height: windowHeight - 150 - 96
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: async function () {
    let {
      navTitle,
      with_user_id
    } = this.data;

    navTitle && wx.setNavigationBarTitle({
      title: navTitle
    })

    let result = await this.messageList({
      with_user_id,
      page: 1
    });

    this.setData({
      messageData: result.results.reverse(),
      isNext: result.next || 0,
      scrollTop: result.results.length * 300
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: async function () {

    //检查是否本地缓存qiniuToken
    let storageInfo = await getStorageInfoPromisify();
    if (!storageInfo.keys.includes("qiniuToken")) {
      QiniuToken();
    }
  },


  /**
   * 获取数据列表
   */
  messageList: async function (param) {
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes('Token') && storageInfo.keys.includes('userId')) {
      let user_id = wx.getStorageSync('userId');
      try {
        showLoadingPromisify();
        let result = await getMessageNotice({
          ...param
        });
        if (typeof result === 'undefined' || !result) throw new Error(`getMessageNotice api is ${result}`)
        if (result.statusCode === 200) {
          let {
            results,
            next
          } = result.data;
          results.map(item => {
            let array = item.content.split(expContent).filter(Boolean);
            let newArray = [];
            array.map((item1) => {
              let newItem = {};
              EmojiTextArray.map((item2) => {
                if (item2.key === '[' + item1 + ']') {
                  newItem['node'] = 'img';
                  newItem['newImg'] = item2.value;
                  return
                }
              })
              if (Object.keys(newItem).length === 0) {
                newItem['node'] = 'text';
                newItem['text'] = item1;
              }
              newArray.push(newItem)
            })
            item['newContent'] = newArray
            //判断是不是本人
            if (item.send_user_id === user_id) {
              item['userR'] = 'user-right';
              item['contentR'] = 'content-right'
              item['detailR'] = 'detail-right'
              item['msgR'] = 'msg-right'
            } else {
              item['userR'] = '';
              item['contentR'] = '';
              item['detailR'] = '';
              item['msgR'] = ''
            }
            item['create_time'] = timeCycle(item.create_time);
          })
          return {
            next,
            results
          }
        } else throw new Error(`statusCode of getMessageNotice api is ${result.statusCode}`)
      } catch (error) {
        isTestEnvironment && await showModalPromisify({
          content: String(error),
        })
      }
    } else {
      let errModel = await showModalPromisify({
        content: '账号异常,点击确定返回首页',
        showCancel: false
      })
      errModel.confirm && jumpToPromisify('index', 'reLaunch')
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
  onPullDownRefresh: async function () {
    let {
      currentPage,
      with_user_id,
      messageData,
      isNext
    } = this.data;
    if (isNext === 0) {
      wx.stopPullDownRefresh();
      return
    }
    currentPage += 1;
    let result = await this.messageList({
      with_user_id,
      page: currentPage
    })
    wx.stopPullDownRefresh();
    result.results.map(item => {
      messageData.unshift(item)
    });
    this.setData({
      messageData,
      currentPage,
      isNext: result.next || 0,
    })
  },

  /**
   * 下拉刷新
   */
  onShell: async function () {
    let {
      currentPage,
      with_user_id,
      messageData,
      isNext
    } = this.data;
    if (isNext === 0) {
      wx.stopPullDownRefresh();
      return
    }
    currentPage += 1;
    let result = await this.messageList({
      with_user_id,
      page: currentPage
    })
    wx.stopPullDownRefresh();
    result.results.map(item => {
      messageData.unshift(item)
    });
    this.setData({
      messageData,
      currentPage,
      isNext: result.next || 0,
    })
  },

  /**
   * 搜集formId
   */
  bindSubmit: async function (e) {
    let {
      formId
    } = e.detail;
    formId && app.data.formID.push(formId); //搜集formid
  },

  /**
   * 发送留言
   */
  onSend: async function () {
    let {
      with_user_id,
      content
    } = this.data;

    this.setData({
      clickEmoji: '',
      padBottom: '',
      focus: false
    })
    let result = content && await postMessageNotice({
      type: 0,
      to_user_id: with_user_id,
      message_type: 0,
      content
    })
    if (result && result.statusCode === 200) {
      showToastPromisify({
        title: '发送成功!'
      })
      let result2 = await this.messageList({
        with_user_id,
        page: 1
      })
      result2 && this.setData({
        messageData: result2.results.reverse(),
        content: '',
        disabled: true,
        isEmotion: false,
        affirmOn: ''
      })
    } else if (result && result.statusCode !== 200) {
      showToastPromisify({
        title: '发送失败!'
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
    if (storageInfo.keys.includes('userId')) {
      let dataByStorge = await getStoragePromisify('userId');
      dataByStorge.userId !== userid && jumpToPromisify('my-edit', 'navigate', {
        bottomBtn: '留言',
        userId: userid,
        navTitle: 'TA的信息'
      })
    } else {
      jumpToPromisify('index', 'reLaunch')
    }
  },

  /**
   * 选择图片
   */
  chooseImg: async function (e) {
    let {
      with_user_id
    } = this.data;
    this.setData({
      isEmotion: false,
      clickEmoji: '',
      padBottom: ''
    });
    let {
      qiniuToken
    } = await getStoragePromisify('qiniuToken');
    if (!qiniuToken) await showModalPromisify({
      content: '账号异常,请返回',
      showCancel: false
    }); //如果没有七牛token则返回
    try {
      let result = await chooseImagePromisify({
        count: 1,
        sizeType: 'compressed'
      })
      showLoadingPromisify({
        title: '上传中'
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
            title: '发送成功!'
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
            title: '发送失败!'
          })
        }
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
      value,
      keyCode
    } = e.detail
    if (keyCode === 0) {
      this.setData({
        isEmotion: false,
        clickEmoji: '',
        padBottom: ''
      })
    } else {
      this.setData({
        content: value
      });
      this.isOpenSendBtn(value)
    }
  },

  /**
   * 当输入框有数据底部发送按钮高亮并且可点击
   * 无数据时发送按钮无法点击
   * @param {*} val 输入框的数据
   */
  isOpenSendBtn: function (val) {
    if (!isNull(val)) {
      this.setData({
        affirmOn: 'affirm_on',
        disabled: false
      })
    } else {
      this.setData({
        affirmOn: '',
        disabled: true
      })
    }
  },

  /**
   * 发表情
   */
  onExpression: function () {
    let {
      isEmotion,
    } = this.data;
    if (isEmotion) this.setData({
      isEmotion: false,
      clickEmoji: 'fadeOutDown',
      padBottom: '',
      focus: false
    })
    else this.setData({
      isEmotion: true,
      clickEmoji: 'click-with-emotion',
      animateType: 'fadeInUp',
      padBottom: 'pad-bottom',
      focus: false
    })
  },

  /**
   * 发送具体表情
   */
  selectEmoji: function (e) {
    let {
      emojiObj,
      type
    } = e.detail;
    let {
      content
    } = this.data;
    if (type === 'add') {

      let newContent = content + emojiObj.key
      this.setData({
        content: newContent
      });
      this.isOpenSendBtn(newContent); //发送按钮的发送能力

    } else if (type === 'delete') {
      content.charAt(content.length - 1) === ']' && this.setData({
        content: content.substring(0, content.lastIndexOf('['))
      })
      content.charAt(content.length - 1) !== ']' && this.setData({
        content: content.substring(0, content.length - 1)
      })
      this.isOpenSendBtn(content); //发送按钮的发送能力
    }

  },

  /**
   * 获取input焦点关闭表情 
   */
  onFocus: function () {
    this.setData({
      isEmotion: false,
      padBottom: ''
    })
  },

  /**
   * 点击空白处 关闭表情
   */
  onCloseTosat: function () {
    this.setData({
      isEmotion: false,
      clickEmoji: '',
      padBottom: '',
      focus: ''
    })
  }
})
