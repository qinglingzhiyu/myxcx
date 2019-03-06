/**
 * Created by Terris
 * https://github.com/qinglingzhiyu
 *
 * @date: 2019-01-09
 * @flow
 *
 * description:
 *
 */

import {
  getUseridInfo,
  isJoinCircle,
  getUserAllDynamic,
} from '../../api/request.js'
import {
  jumpToPromisify,
  showToastPromisify,
  showModalPromisify,
  setStoragePromisify,
  showLoadingPromisify,
  getStorageInfoPromisify,
} from '../../api/promisify.js'
import regeneratorRuntime, {
  async
} from '../../api/regeneratorRuntime.js'
import {
  sleep,
  isAuthor,
  QiniuToken,
  occupationByNumber,
  MasterMapByThumbnail,
  thumbnailByMasterMap
} from '../../common/common.js'
import {
  isTestEnvironment
} from '../../api/config';
import {
  expIsApp
} from '../../common/const';

const app = getApp();

Page({

  /**
   * 页面的初始数据
   */

  data: {
    editInfoData: {},
    userId: 0,
    share: '',
    isCloseByMask: false,
    isCloseBytoast: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    let {
      userId,
      circleId,
      bottomBtn,
      navTitle,
      shareId,
    } = options;
    userId && this.setData({
      userId
    })
    circleId && this.setData({
      circleId
    })
    navTitle && this.setData({
      navTitle
    })
    shareId && this.setData({
      shareId
    })
    bottomBtn && this.setData({
      bottomBtn
    })
    wx.hideShareMenu(); //取消顶部分享
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: async function () {
    let {
      userId,
      bottomBtn,
      navTitle,
      editInfoData
    } = this.data;
    let image = [];
    navTitle && wx.setNavigationBarTitle({
      title: navTitle
    })
    bottomBtn && bottomBtn === '分享名片给好友' && this.setData({
      share: 'share',
    })
    bottomBtn && bottomBtn === '编辑信息' && this.setData({
      share: 'getUserInfo'
    })
    bottomBtn && bottomBtn === '留言' && this.setData({
      share: 'getUserInfo'
    })
    showLoadingPromisify()
    try {
      if (typeof userId === 'undefined') throw new Error(`userId is ${userId}`)
      let result2 = userId && await getUserAllDynamic({
        user_id: userId
      })
      if (typeof result2 === 'undefined' || !result2) throw new Error(`getUserAllDynamic api is ${result2},param={user_id:${userId}}`)
      if (result2.statusCode === 200) {
        result2.data.results.map(item => {
          let newImageList = item.images.split(',').filter(Boolean)
          newImageList.map(item => {
            image.push(MasterMapByThumbnail(item,140))
          })
        })
      } else throw new Error(`statusCode of getUserAllDynamic is ${result2.statusCode},param={user_id:${userId}}`)
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        title: '错误提示',
        content: String(error)
      })
    }
    showLoadingPromisify()
    try {
      let result = userId && await getUseridInfo({
        user_id: userId
      })
      if (typeof result === 'undefined' || !result) throw new Error(`getUseridInfo api is ${result}`)
      if (result.statusCode === 200) {
        editInfoData['avatar'] = MasterMapByThumbnail(result.data.avatar, 180); //头像
        editInfoData['residence'] = occupationByNumber(Number(result.data.residence_new)); //居住地
        result.data.images.map(item => {
          image.push( MasterMapByThumbnail(item.src,140))
        });
        if (expIsApp.test(Number(result.data.role))) editInfoData['isAPP'] = true;
        else editInfoData['isAPP'] = false;
        editInfoData['height'] = result.data.height; //身高
        editInfoData['education'] = result.data.education; //学历
        editInfoData['descr'] = result.data.descr; //个人介绍
        editInfoData['occupation'] = result.data.occupation; //职业
        editInfoData['gender'] = result.data.child_gender; //性别
        editInfoData['birthday'] = result.data.birthday.split('-')[0]; //出生年份
      } else showToastPromisify({
        title: '用户不存在,请返回'
      }), await sleep(1500), jumpToPromisify(1, 'back')
      editInfoData['images'] = image.slice(0, 4)
      this.setData({
        editInfoData
      })
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        title: '错误提示',
        content: String(error)
      })
    }
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
  onShareAppMessage: function (e) {
    let {
      userid
    } = e.target.dataset;
    if (typeof userid === 'undefined' || !userid) throw new Error(`userid is ${userid}`)
    if (e.from === 'button') {
      return {
        title: '这是我的相亲名片，如适合您，请与我联系!',
        path: `/pages/circle/circle?from=share&userId=${userid}`
      }
    }
  },

  /**
   * 保存formid
   */
  bindSubmit: async function (e) {
    let {
      formId
    } = e.detail;
    formId && app.data.formID.push(formId);
  },

  /**
   * 授权
   */
  getUserInfo: async function (info) {
    if (info.detail.errMsg === 'getUserInfo:fail auth deny') return
    let {
      nickName
    } = info.detail.userInfo;
    setStoragePromisify({
      'NICKNAME': nickName
    })
    let {
      cometo,
      navtitle
    } = info.currentTarget.dataset;
    let {
      circleId,
      shareId,
      userId,
    } = this.data;
    let authorStatus = await isAuthor({
      encryptedData: info.detail.encryptedData,
      iv: info.detail.iv,
      shareId: Number(shareId) || 0,
      circleId: Number(circleId) || 0
    })
    if (authorStatus.statusCode === 'isOk' || authorStatus.statusCode === 200) {
      if (cometo === 'dynamic') {
        if (typeof userId === 'undefined' || !userId) throw new Error(`userId is ${userId}`);
        userId && this.isJoinCircleByDynamic({
          circleId,
          userId
        });
      } else if (cometo === 'btn') {
        userId && this.isJoinCircleBybtn({
          circleId,
          userId,
          navtitle
        })
      }
    };
    if (authorStatus.statusCode === 200) QiniuToken()
  },

  /**
   * 点击动态模块
   */
  isJoinCircleByDynamic: async function (param) {
    let {
      userId,
      circleId
    } = param;
    try {
      if (typeof userId === 'undefined' || !userId) throw new Error(`userId is ${userId}`)
      if (circleId) {
        let result = await isJoinCircle({
          circle_id: circleId
        });
        if (!result) throw new Error(`isJoinCircle api is ${result}`);
        if (result.statusCode === 200) {
          if (result.data.joined) {
            userId && this.goPageWithDynamic({
              userId
            });
          } else this.setData({
            isCloseByMask: true,
            isCloseBytoast: true,
          }), setStoragePromisify({
            jump: 'dynamic',
            withUserid: userId
          })
        } else throw new Error(`isJoinCircle api statusCode: ${result.statusCode}`);
      } else userId && this.goPageWithDynamic({
        userId
      });
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        title: '错误提示',
        content: String(error)
      })
    }
  },

  /**
   * 点击底部btn
   */
  isJoinCircleBybtn: async function (param) {
    let {
      userId,
      circleId,
      navtitle
    } = param;
    try {
      if (typeof userId === 'undefined' || !userId) throw new Error(`userId is ${userId}`)
      if (circleId) {
        let result = await isJoinCircle({
          circle_id: circleId
        });
        if (!result) throw new Error(`isJoinCircle api is ${result}`);
        if (result.statusCode === 200) {
          if (result.data.joined) {
            userId && this.goPageWithMessageContentOrPersonInfo({
              userId,
              navTitle: navtitle
            });
          } else this.setData({
            isCloseByMask: true,
            isCloseBytoast: true,
          }), setStoragePromisify({
            jump: 'messageContent',
            withUserid: userId,
            messageNavTitle: navtitle
          })
        } else throw new Error(`isJoinCircle api statusCode: ${result.statusCode}`);
      } else userId && this.goPageWithMessageContentOrPersonInfo({
        userId,
        navTitle: navtitle
      });
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        title: '错误提示',
        content: String(error)
      })
    }
  },

  /**
   * 如果未加入圈子则弹出入圈规则
   * 如果加入圈子则跳转到个人动态页面
   */
  goPageWithDynamic: async function (param) {
    let {
      userId
    } = param;
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes('userId')) {
      let myUserId = wx.getStorageSync('userId')
      if (myUserId === Number(userId)) jumpToPromisify('dynamic', 'navigate', {
        userId,
        navTitle: '我的动态',
        come: 'myEdit'
      });
      else jumpToPromisify('dynamic', 'navigate', {
        userId,
        navTitle: 'TA的动态',
        come: 'myEdit'
      })
    } else showToastPromisify({
      title: '未登录,请返回!'
    }), await sleep(1500), jumpToPromisify('index', 'reLaunch');
  },

  /**
   * 如果未加入圈子则弹出入圈规则
   * 如果加入圈子则跳转留言(他人userid) 跳转编辑信息(自己userid)
   */
  goPageWithMessageContentOrPersonInfo: async function (param) {
    let {
      userId,
      navTitle
    } = param;
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes('userId')) {
      let myUserId = wx.getStorageSync('userId')
      if (myUserId !== Number(userId)) jumpToPromisify('/subPackage_message/pages/message-content/message-content', 'navigate', {
        with_user_id: userId,
        navTitle
      }, true);
      else jumpToPromisify('person-info', 'navigate', {
        comeTo: 'my-edit'
      });
    } else showToastPromisify({
      title: '未登录,请返回!'
    }), await sleep(1500), jumpToPromisify('index', 'reLaunch');
  },

  /**
   * 关闭蒙层
   */
  closeMask: function (e) {
    e.detail === 'close' && this.setData({
      isCloseBytoast: false,
      isCloseByMask: false,
      isComment: false,
    })
  },

  /**
   * 关闭toast 并跳转圈子规则
   */
  mytoast: function (e) {
    e.detail === 'close' && this.setData({
      isCloseByMask: false,
      isCloseBytoast: false
    })
    let circleId = this.data.circleId;
    e.detail === 'navgiteWithClose' && jumpToPromisify('circle-introduce', 'navigate', {
      circleId,
    }), this.setData({
      isCloseByMask: false,
      isCloseBytoast: false
    })
  },

  /**
   * 关闭banner
   */
  closeBanner: function () {
    let {
      editInfoData
    } = this.data;
    editInfoData.isAPP = false;
    this.setData({
      editInfoData
    })
  },

  /**
   * 预览图片
   */
  goPreview: function (e) {
    let {
      avatar
    } = this.data.editInfoData
    let imgs = [];
    let newAvatar = thumbnailByMasterMap(avatar)
    imgs.push(newAvatar);
    wx.previewImage({
      urls: imgs,
      current: imgs[0]
    })
  },
})
