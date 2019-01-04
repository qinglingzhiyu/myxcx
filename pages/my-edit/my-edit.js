// pages/my-edit/my-edit.js
import {
  getUseridInfo,
  isJoinCircle,
} from "../../api/request.js"
import {
  getStorageInfoPromisify,
  jumpToPromisify,
  showLoadingPromisify,
  showToastPromisify,
  setStoragePromisify
} from "../../api/promisify.js"
import regeneratorRuntime from "../../api/regeneratorRuntime.js"
import {
  sleep,
  isAuthor,
  QiniuToken
} from "../../common/common.js"

const app = getApp();

Page({

  /**
   * 页面的初始数据
   */

  data: {
    editInfoData: {},
    userId: 0,
    share: "",
    isCloseByMask: false,
    isCloseBytoast: false,
    isbanner: true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    let _this = this;
    let {
      userId,
      circleId,
      bottomBtn,
      navTitle,
      shareId,
    } = options;
    userId && _this.setData({
      userId
    })
    circleId && _this.setData({
      circleId
    })
    navTitle && wx.setNavigationBarTitle({
      title: navTitle
    })
    shareId && _this.setData({
      shareId
    })
    bottomBtn && _this.setData({
      bottomBtn
    })
    bottomBtn && bottomBtn === "分享名片给好友" && _this.setData({
      share: "share",

    })
    bottomBtn && bottomBtn === "编辑信息" && _this.setData({
      share: "getUserInfo"
    })
    bottomBtn && bottomBtn === "留言" && _this.setData({
      share: "getUserInfo"
    })
    showLoadingPromisify()
    let result = await getUseridInfo({
      user_id: userId
    })
    if (result.statusCode === 200) {
      let editInfoData = _this.data.editInfoData;
      editInfoData["avatar"] = result.data.avatar; //头像
      editInfoData["residence"] = result.data.residence; //居住地
      editInfoData["height"] = result.data.height; //身高
      editInfoData["education"] = result.data.education; //学历
      editInfoData["images"] = result.data.images.slice(0, 4); //动态
      editInfoData["descr"] = result.data.descr; //个人介绍
      editInfoData["occupation"] = result.data.occupation; //职业
      editInfoData["gender"] = result.data.child_gender; //性别
      editInfoData["birthday"] = result.data.birthday.split("-")[0]; //出生年份
      _this.setData({
        editInfoData
      })
    } else showToastPromisify({
      title: "用户不存在,请返回"
    }), await sleep(1500), jumpToPromisify(1, "back")
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
  onShareAppMessage: function (e) {
    let {
      userid
    } = e.target.dataset;
    if (typeof userid === "undefined" || !userid) throw new Error(`userid is ${userid}`)
    if (e.from === "button") {
      return {
        title: "这是我的相亲名片，如适合您，请与我联系!",
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
    if (info.detail.errMsg === "getUserInfo:fail auth deny") return
    let {
      nickName
    } = info.detail.userInfo;
    setStoragePromisify({
      "NICKNAME": nickName
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
    if (authorStatus.statusCode === "isOk" || authorStatus.statusCode === 200) {
      if (cometo === "dynamic") {
        if (typeof userId === "undefined" || !userId) throw new Error(`userId is ${userId}`);
        userId && this.isJoinCircleByDynamic({
          circleId,
          userId
        });
      } else if (cometo === "btn") {
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
    if (typeof userId === "undefined" || !userId) throw new Error(`userId is ${userId}`)
    if (circleId) {
      let result = await isJoinCircle({
        circle_id: circleId
      });
      if (!result) throw new Error(`isJoinCircle api is ${result}`);
      if (result.statusCode === 200) {
        if (result.data.detail) {
          userId && this.goPageWithDynamic({
            userId
          });
        } else this.setData({
          isCloseByMask: true,
          isCloseBytoast: true,
        }), setStoragePromisify({
          jump: "dynamic",
          withUserid: userId
        })
      } else throw new Error(`isJoinCircle api statusCode: ${result.statusCode}`);
    } else userId && this.goPageWithDynamic({
      userId
    });
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
    if (typeof userId === "undefined" || !userId) throw new Error(`userId is ${userId}`)
    if (circleId) {
      let result = await isJoinCircle({
        circle_id: circleId
      });
      if (!result) throw new Error(`isJoinCircle api is ${result}`);
      if (result.statusCode === 200) {
        if (result.data.detail) {
          userId && this.goPageWithMessageContentOrPersonInfo({
            userId,
            navTitle: navtitle
          });
        } else this.setData({
          isCloseByMask: true,
          isCloseBytoast: true,
        }), setStoragePromisify({
          jump: "messageContent",
          withUserid: userId,
          messageNavTitle: navtitle
        })
      } else throw new Error(`isJoinCircle api statusCode: ${result.statusCode}`);
    } else userId && this.goPageWithMessageContentOrPersonInfo({
      userId,
      navTitle: navtitle
    });
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
    if (storageInfo.keys.includes("userId")) {
      let myUserId = wx.getStorageSync("userId")
      if (myUserId === Number(userId)) jumpToPromisify("dynamic", "navigate", {
        userId,
        navTitle: "我的动态",
        come: "myEdit"
      });
      else jumpToPromisify("dynamic", "navigate", {
        userId,
        navTitle: "TA的动态",
        come: "myEdit"
      })
    } else showToastPromisify({
      title: "未登录,请返回!"
    }), await sleep(1500), jumpToPromisify("index", "reLaunch");
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
    if (storageInfo.keys.includes("userId")) {
      let myUserId = wx.getStorageSync("userId")
      if (myUserId !== Number(userId)) jumpToPromisify("message-content", "navigate", {
        with_user_id: userId,
        navTitle
      });
      else jumpToPromisify("person-info", "navigate", {
        comeTo: "my-edit"
      });
    } else showToastPromisify({
      title: "未登录,请返回!"
    }), await sleep(1500), jumpToPromisify("index", "reLaunch");
  },

  /**
   * 关闭蒙层
   */
  closeMask: function (e) {
    e.detail === "close" && this.setData({
      isCloseBytoast: false,
      isCloseByMask: false,
      isComment: false,
    })
  },

  /**
   * 关闭toast 并跳转圈子规则
   */
  mytoast: function (e) {
    e.detail === "close" && this.setData({
      isCloseByMask: false,
      isCloseBytoast: false
    })
    let circleId = this.data.circleId;
    e.detail === "navgiteWithClose" && jumpToPromisify("circle-introduce", "navigate", {
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
    this.setData({
      isbanner: false
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
    imgs.push(avatar);
    wx.previewImage({
      urls: imgs,
      current: imgs[0]
    })
  },
})
