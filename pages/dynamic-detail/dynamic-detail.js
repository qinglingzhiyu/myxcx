// pages/dynamic-detail/dynamic-detail.js
import {
  getDynamicDetail,
  updateLike,
  deleteDynamic,
  isJoinCircle
} from "../../api/request.js"
import regeneratorRuntime from "../../api/regeneratorRuntime.js"
import {
  jumpToPromisify,
  getStorageInfoPromisify,
  showLoadingPromisify,
  showToastPromisify,
  getStoragePromisify,
  setStoragePromisify
} from "../../api/promisify.js"
import {
  isAuthor,
  QiniuToken,
  sleep
} from "../../common/common.js"
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    del: false,
    isCloseByMask: false,
    delAffirm: false,
    isCloseByMask: false,
    isCloseBytoast: false,
    isComment: false,
    feedDetailData: {}, //页面数据
    commentInfo: {},
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    let {
      feedId,
      selectFeedId
    } = options;
    if(typeof feedId ==="undefined" || !feedId ) throw new Error(`feedId is ${feedId}`);
    if (!selectFeedId) this.getDataByRequest({
      feed_id: feedId
    });
    else this.getDataByRequest({
      select_feed_id: selectFeedId
    });
  },

  /**
   * 请求数据
   */
  getDataByRequest: async function (param) {
    showLoadingPromisify()
    let feedDetail = await getDynamicDetail({
      ...param
    });
    if (feedDetail.statusCode === 200) {
      //如果动态不存在,则提醒并退出
      if (feedDetail.data.detail === "动态不存在") {
        showToastPromisify({
          title: "动态已删除"
        })
        await sleep(1000);
        wx.navigateBack({
          delta: 1
        });
        return
      }
      //动态存在情况
      let ownUserId = wx.getStorageSync("userId");
      if (ownUserId == feedDetail.data.user_id) {
        feedDetail.data["isShowWithMore"] = true
      } else {
        feedDetail.data["isShowWithMore"] = false
      }
      feedDetail.data["isInterest"] = false
      let imglist = feedDetail.data.images.split(",").filter(item => {
        if (item) return item
      })
      feedDetail.data["images"] = imglist;
      this.setData({
        feedDetailData: feedDetail.data
      })
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
      sex,
      feedid,
      img
    } = e.target.dataset;
    let title = "";
    sex === "男" && (title = "快来看看这家孩子适不适合你家小美女？我亲自挑的!");
    sex === "女" && (title = "快来看看这家孩子适不适合你家帅哥？我亲自挑的!")
    return {
      title: title,
      path: `/pages/dynamic-detail/dynamic-detail?feedId=${feedid}`,
      imageUrl: img
    }
  },


  /**
   * 关闭mask
   */
  closeMask: function (e) {
    e.detail === "close" && this.setData({
      isCloseByMask: false,
      isCloseBytoast: false,
      isComment: false,
      delAffirm: false,
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
    let {
      circle_id
    } = this.data.feedDetailData;
    e.detail === "navgiteWithClose" && jumpToPromisify("circle-introduce", "navigate", {
      circleId: circle_id
    }), this.setData({
      isCloseByMask: false,
      isCloseBytoast: false
    })
  },


  /**
   * 评论
   */
  onComment: async function (e) {
    let _this = this;
    let {
      statusCode,data
    } = e.detail.result;
    let { feedDetailData,commentInfo } = this.data
    if (statusCode === 201) {
      data.results["circle_id"] = commentInfo.circleid;
      feedDetailData.comment.push(data.results);
      feedDetailData.comment_count += 1;
      showToastPromisify({
        title: "评论成功"
      });
    }else{
      showToastPromisify({title:"评论失败"})
    };
    _this.setData({
      isCloseByMask: false,
      isComment: false,
      feedDetailData
    })
  },

  /**
   * 跳转个人信息页
   */
  goPageWithMyEdit: async function (e) {
    let {
      userid,
      circleid
    } = e.currentTarget.dataset;
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes("userId")) {
      let myUserId = (await getStoragePromisify("userId")).userId;
      Number(userid) !== Number(myUserId) && jumpToPromisify("my-edit", "navigate", {
        navTitle: "TA的信息",
        bottomBtn: "留言",
        userId: userid,
        circleId: circleid
      });
      Number(userid) === Number(myUserId) && jumpToPromisify("my-edit", "navigate", {
        navTitle: "我的相亲名片",
        bottomBtn: "编辑信息",
        userId: userid,
        circleId: circleid
      })
    } else {
      jumpToPromisify("my-edit", "navigate", {
        navTitle: "TA的信息",
        bottomBtn: "留言",
        userId: userid,
        circleId: circleid
      });
    }
  },


  /**
   *是否授权
   */
  getUseInfo: async function (info) {
    if (info.detail.errMsg === "getUserInfo:fail auth deny") return
    let {
      nickName
    } = info.detail.userInfo;
    setStoragePromisify({
      "NICKNAME": nickName
    })
    let {
      cometo,
      circleid,
      navtitle,
      feedid,
      commentto,
      userid
    } = info.currentTarget.dataset;
    let authorStatus = await isAuthor({
      encryptedData: info.detail.encryptedData,
      iv: info.detail.iv
    })
    if (authorStatus.statusCode === "isOk" || authorStatus.statusCode === 200) {
      if (cometo === "interest") {
        if (typeof feedid === "undefined" || !feedid) throw new Error(`feedid is ${feedid}`);
        feedid && this.onInterest({
          feedid
        });
      } else if (cometo === "comment") {
        if (typeof feedid === "undefined" || !feedid) throw new Error(`feedid is ${feedid}`);
        if (typeof commentto === "undefined") throw new Error(`commentto is ${commentto}`);
        if (typeof circleid === "undefined" || !circleid) throw new Error(`circleid is ${circleid}`)
        feedid && circleid && this.onCommentByBtn({
          feedid,
          commentto,
          circleid,
          authorStatus
        })
      } else if (cometo === "contact") {
        if (typeof circleid === "undefined" || !circleid) throw new Error(`circleid is ${circleid}`);
        if (typeof userid === "undefined" || !userid) throw new Error(`userid is ${userid}`);
        circleid && userid && this.contact({
          circleid,
          userid,
          authorStatus
        })
      }
    }
    if (authorStatus.statusCode === 200) QiniuToken()
  },

  /**
   * 点击感兴趣操作
   * 
   */
  onInterest: async function (param) {
    let {
      feedid
    } = param
    let {
      feedDetailData
    } = this.data;
    feedDetailData.isInterest = true;
    feedDetailData.like += 1;
    showLoadingPromisify({
      title: "操作中"
    })
    showLoadingPromisify();
    let result = await updateLike({
      feed_id: feedid
    })
    if (!result) throw new Error("updateLike api is undefine")
    if (result.statusCode === 200) {
      showToastPromisify({
        title: '点赞成功',
        icon: "success",
      })
      this.setData({
        feedDetailData
      })
    } else {
      throw new Error(`updateLike api statusCode:${result.statusCode}`)
      showToastPromisify({
        title: '点赞失败',
        icon: "fail",
      })
    }
  },

  /**
   * 点击评论按钮
   * 如果加入圈子则评论
   * 如果未加入圈子则弹出入圈规则
   */
  onCommentByBtn: async function (param) {
    let {
      circleid,
      commentto,
      feedid,
      authorStatus
    } = param;
    let result = await isJoinCircle({
      circle_id: circleid
    });
    if (!result) throw new Error(`isJoinCircle api is ${result}`)
    if (result.statusCode === 200) {
      if (result.data.detail) {
        let myUserid = wx.getStorageSync("userId");
        if (typeof myUserid === "undefined" || !myUserid) throw new Error(`本地userid不存在`);
        if (myUserid === commentto) commentto = 0;
        this.setData({
          isCloseByMask: true,
          isComment: true,
          commentInfo: {
            feed_id: feedid,
            comment_to: commentto,
            circleid,
          }
        })
      } else {
        authorStatus.statusCode === "isOk" && (
          showToastPromisify({
            title: "您需要先加入该圈子才能评论哦"
          }), await sleep(1000), jumpToPromisify("circle-introduce", "navigate", {
            circleId: circleid
          }), setStoragePromisify({
            jump: "circleDynamic"
          })
        );
        authorStatus.statusCode === 200 && (
          this.setData({
            isCloseByMask: true,
            isCloseBytoast: true,
          }), setStoragePromisify({
            jump: "circleDynamic"
          })
        )
      }
    } else {
      throw new Error(`isJoinCircle api statusCode:${result.statusCode}`)
      showToastPromisify({
        title: "网络错误,请重试!"
      })
    }
  },

  /**
   * 联系TA
   * 如果加入圈子则跳转到留言页,
   * 如果未加入圈子则弹出入圈规则
   */
  contact: async function (param) {
    let {
      circleid,
      userid,
      authorStatus
    } = param;
    let result = await isJoinCircle({
      circle_id: circleid
    });
    if (!result) throw new Error(`isJoinCircle api is ${result}`);
    if (result.statusCode === 200) {
      if (result.data.detail) {
        let storageInfo = await getStorageInfoPromisify();
        if (storageInfo.keys.includes("userId")) {
          let myUserId = (await getStoragePromisify("userId")).userId;
          if (userid !== myUserId) jumpToPromisify("message-content", "navigate", {
            with_user_id: userid
          })
          else showToastPromisify({
            title: "不能跟自己联系哦"
          })
        }
      } else {
        authorStatus.statusCode === "isOk" && (
          showToastPromisify({
            title: "您需要先加入该圈子才能评论哦"
          }), await sleep(1000), jumpToPromisify("circle-introduce", "navigate", {
            circleId: circleid
          }), setStoragePromisify({
            jump: "messageContent",
            withUserid: userid
          })
        );
        authorStatus.statusCode === 200 && (
          this.setData({
            isCloseByMask: true,
            isCloseBytoast: true,
          }), setStoragePromisify({
            jump: "messageContent",
            withUserid: userid
          })
        )
      }
    } else {
      throw new Error(`isJoinCircle api statusCode:${result.statusCode}`)
      showToastPromisify({
        title: "网络错误,请重试!"
      })
    }
  },

  /**
   * 预览图片
   */
  goPreview: function (e) {
    let _this = this;
    let {
      images
    } = _this.data.feedDetailData;
    wx.previewImage({
      urls: images,
      current: images[e.currentTarget.dataset.imageindex]
    })
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
   * 跳回首页
   */
  goPageWithIndex: function () {
    jumpToPromisify("index", "reLaunch")
  },

  /**
   * 弹出删除动态弹窗
   */
  popDel: function () {
    this.setData({
      isCloseByMask: true,
      delAffirm: true,
    })

  },

  /**
   * 删除动态
   */
  deleteDynamic: async function (e) {
    let {
      feedid
    } = e.currentTarget.dataset;
    let result = await deleteDynamic({
      type: -1,
      feed_id: feedid
    })
    if (result.statusCode === 200) {
      showToastPromisify({
        title: "删除成功",
        image: "/images/icon/success.png"
      })
      this.setData({
        isCloseByMask: false,
        delAffirm: false,
      })

      wx.navigateBack({
        delta: 1
      })
    } else {
      showToastPromisify({
        title: "网络异常",
        image: "/images/icon/fail.png"
      })
    }
  }
})