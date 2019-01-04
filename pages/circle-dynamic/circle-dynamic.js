/**
 * Created by Terris
 * https://github.com/qinglingzhiyu
 *
 * @date: 2018-12-28
 * @flow
 *
 * description:  这是circle-dynamic的逻辑
 *
 */

import {
  getStorageInfoPromisify,
  getStoragePromisify,
  jumpToPromisify,
  showLoadingPromisify,
  showToastPromisify
} from "../../api/promisify.js";
import {
  getFeedsDynamic,
  getMembersList,
  updateLike
} from "../../api/request.js";
import {
  occupationByNumber,
  timeCycle
} from "../../common/common.js";
import regeneratorRuntime from "../../api/regeneratorRuntime.js";
import { expIsApp } from '../../common/const';


const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentTab: 0, //tab切换
    winHeight: 0,
    feedDynamicData: [], //动态数据
    memberList: [], //成员数据
    circleId: 0, //当前圈子
    memberPage: 1, //成员当前页
    dynamicPage: 1, //动态当前页
    isCloseByMask: false,
    isComment: false,
    commentInfo: {}, //评论内容
    showComment: true, //是否显示发布动态按钮
    isDynamic: true,
    isOpenImage:false, //true 放大过照片 false 为未放大照片
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    let _this = this;
    const {
      navTitle,
      circleId
    } = options;
    circleId && _this.setData({
      circleId: options.circleId
    });
    navTitle && wx.setNavigationBarTitle({
      title: navTitle
    });
    let result = await _this.getMemberListByRequest({
      circleId,
      memberPage: 1
    });
    result && _this.setData({
      memberList: result
    });


    /**
     * 获取系统信息
     */
    wx.getSystemInfo({
      success: function (res) {
        _this.setData({
          winHeight: res.windowHeight
        });
      }
    });

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: async function () {
    let {
      circleId,
      isOpenImage,
    } = this.data;
    //如果放大图片则不让刷新页面
    if( isOpenImage ){
      this.setData({
        isOpenImage:false
      });
      return
    }
    this.setData({
      dynamicPage: 1
    })
    let result0 = await this.getDynamicListByRequest({
      circleId,
      dynamicPage: 1
    })
    result0 && this.setData({
      feedDynamicData: result0
    })

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
    let currentTab = this.data.currentTab;
    if (currentTab === 0) {
      let {
        feedDynamicData,
        dynamicPage,
        circleId
      } = this.data;
      let result0 = await this.getDynamicListByRequest({
        circleId,
        dynamicPage:1
      });
      result0 && result0.map(item => {
        feedDynamicData.push(item)
      })
      result0 && this.setData({
        dynamicPage,
        feedDynamicData
      })
    } else if (currentTab === 1) {
      let {
        memberList,
        memberPage,
        circleId
      } = this.data;
      let result = await this.getMemberListByRequest({
        circleId,
        memberPage:1
      });

      result && result.map(item => {
        memberList.push(item)
      });

      result && this.setData({
        memberList,
        memberPage
      })
    }
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: async function () {
  },

  /**
   * 上拉刷新
   * @param 
   */
  loadMore: async function () {
    let currentTab = this.data.currentTab;
    if (currentTab === 0) {
      let {
        feedDynamicData,
        dynamicPage,
        circleId
      } = this.data;
      dynamicPage += 1;
      let result0 = await this.getDynamicListByRequest({
        circleId,
        dynamicPage
      });
      result0 && result0.map(item => {
        feedDynamicData.push(item)
      })
      result0 && this.setData({
        dynamicPage,
        feedDynamicData
      })
    } else if (currentTab === 1) {
      
      let {
        memberList,
        memberPage,
        circleId
      } = this.data;
      memberPage += 1;
      let result = await this.getMemberListByRequest({
        circleId,
        memberPage
      });

      result && result.map(item => {
        memberList.push(item)
      });

      result && this.setData({
        memberList,
        memberPage
      })
    }
  },


  /**
   * 获取动态列表
   */
  getDynamicListByRequest: async function (param) {
    let {
      circleId,
      dynamicPage
    } = param;
    showLoadingPromisify()
    let feedDynamic = circleId && await getFeedsDynamic({
      circleId,
      page: dynamicPage
    })
    if (feedDynamic.statusCode === 200) {
      feedDynamic.data.results.map((item, index) => {
        item["time"] = timeCycle(item.create_time)
        let imgList = item.images.split(",").filter(item1 => {
          if (item1) return item1
        })
        item["images"] = imgList;
        if (item.content.length >= 78) {
          item["contentSub"] = item.content.slice(0, 78) + "...";
          item["isShowWithContent"] = true;
        }
        item["isInterest"] = false;
      })
      return feedDynamic.data.results
    } else {
      showToastPromisify({
        title: "暂无更多动态"
      })
    }
  },

  /**
   * 获取成员列表
   */
  getMemberListByRequest: async function (param) {
    let storageInfo = await getStorageInfoPromisify();
    let {
      circleId,
      memberPage
    } = param
    if (storageInfo.keys.includes("Token")) {
      memberPage > 1 && showLoadingPromisify()
      let list = circleId && await getMembersList({
        circleId,
        page: memberPage
      })
      if (list.statusCode === 200) {
        let storageInfo = await getStorageInfoPromisify();
        if (storageInfo.keys.includes("userId")) {
          let myuserid = (await getStoragePromisify("userId")).userId;
          list.data.results.map(item => {
            if (item.user_id === Number(myuserid)) item["ismy"] = true;
            else item["ismy"] = false;
            if(expIsApp.test(item.user.role)) item.user["isAPP"] = true;
            else item.user["isAPP"] = false;
            item.user.residence_new && (item.user["residence"] = occupationByNumber(item.user.residence_new))
          })
          return list.data.results
        }
      } else {
        showToastPromisify({
          title: "暂无更多成员"
        })
      }
    } else {
      showToastPromisify({
        title: "网络错误!请返回"
      })
      jumpToPromisify("index", "reLaunch")
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (e) {
    const {
      feedid,
      sex,
      img
    } = e.target.dataset;
    if (e.from === "button") {
      let title = "";
      sex === "男" && (title = "快来看看这家孩子适不适合你家小美女？我亲自挑的!");
      sex === "女" && (title = "快来看看这家孩子适不适合你家帅哥？我亲自挑的!")
      return {
        title: title,
        path: `/pages/dynamic-detail/dynamic-detail?feedId=${feedid}`,
        imageUrl: img
      }
    }
  },

  /**
   * 评论
   */
  oncomentBybtn: function (e) {
    let {
      feedid,
      commentto,
      index,
      circleid
    } = e.currentTarget.dataset;
    let userId = wx.getStorageSync("userId");
    if (typeof userId === "undefined" || !userId) throw new Error(`本地userid不存在`);
    if (userId === commentto) commentto = 0;
    this.setData({
      isCloseByMask: true,
      isComment: true,
      commentInfo: {
        feed_id: feedid,
        comment_to: Number(commentto),
        circleid,
        index
      }
    })
  },

  /**
   * 关闭mask
   */
  closeMask: function (e) {
    e.detail === "close" && this.setData({
      isCloseByMask: false,
      isComment: false
    })
  },


  /**
   * 评论
   */
  onComment: async function (e) {
    let {
      statusCode,data
    } = e.detail.result;
    let { feedDynamicData,commentInfo } = this.data;
    if (statusCode === 201) {
      if (feedDynamicData[commentInfo.index].comment.length < 5){
        feedDynamicData[commentInfo.index].comment.push(data.results);
      }
      feedDynamicData[commentInfo.index].comment_count += 1;
      showToastPromisify({
        title: "评论成功"
      });
    }else{
      showToastPromisify({title:"评论失败"})
    };
    this.setData({
      isCloseByMask: false,
      isComment: false,
      feedDynamicData,
    })
  },

  /**
   * 滑动切换tab
   */
  bindChange: function (e) {
    var _this = this;
    _this.setData({
      currentTab: e.detail.current,
      showComment: e.detail.current == "0",
    });

  },

  /**
   * 点击tab切换
   */
  swichNav: function (e) {
    var _this = this;
    if (_this.data.currentTab === e.target.dataset.current) {
      return false;
    } else {
      _this.setData({
        currentTab: e.target.dataset.current,
        showComment: e.target.dataset.current == "0"
      })
    }
  },

  /**
   * 预览图片
   */
  goPreview: function (e) {
    let {
      index,
      imageindex
    } = e.currentTarget.dataset;
    let {
      feedDynamicData
    } = this.data;
    let imgs = feedDynamicData[index].images;
    wx.previewImage({
      urls: imgs,
      current: imgs[imageindex]
    })
    this.setData({
      isOpenImage:true
    })
  },

  /**
   * 跳转TA的信息页
   */
  goPageWithMyEdit: async function (e) {

    let {
      userid,
      circleid
    } = e.currentTarget.dataset;

    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes("userId")) {
      let {
        userId
      } = await getStoragePromisify("userId");
      Number(userid) !== Number(userId) && jumpToPromisify("my-edit", "navigate", {
        navTitle: "TA的信息",
        bottomBtn: "留言",
        userId: userid,
        circleId: circleid
      });
      Number(userid) === Number(userId) && jumpToPromisify("my-edit", "navigate", {
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
   * 控制查看全文
   */
  openContent: function (e) {
    let _this = this;
    let i = e.currentTarget.dataset.index;
    let feedDynamicData = _this.data.feedDynamicData;
    feedDynamicData.map((item, index) => {
      index === i && (item["isShowWithContent"] = false)
    })
    _this.setData({
      feedDynamicData
    })
  },

  /**
   * 跳转动态详情
   */
  goPageWithDynamicDetail: function (e) {
    let {
      feedid
    } = e.currentTarget.dataset;
    jumpToPromisify('dynamic-detail', 'navigate', {
      feedId: feedid,
    })
  },

  /**
   * 感兴趣
   */
  onisLike: async function (e) {
    let list = this.data.feedDynamicData;
    list[e.currentTarget.dataset.index].isInterest = true;
    list[e.currentTarget.dataset.index].like += 1;
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes("Token")) {
      showLoadingPromisify({
        title: "操作中"
      })
      let result = await updateLike({
        feed_id: e.currentTarget.dataset.feedid
      })
      if (result.statusCode === 200) {
        showToastPromisify({
          title: '点赞成功',
          icon: "success",
        })
        this.setData({
          feedDynamicData: list
        })
      } else {
        showToastPromisify({
          title: '点赞失败',
          icon: "fail",
        })
      }
    }
  },

  /**
   * 搜集formId
   */
  bindSubmit: function (e) {
    let {
      formId
    } = e.detail.formId
    formId && app.data.formID.push(formId);
  },

  /**
   * 跳转发布动态
   */
  goPageWithCircleDynamicRelease: function (e) {
    jumpToPromisify("circle-dynamic-release", "navigate", {
      circleId: e.currentTarget.dataset.circleid
    })
  },

  /**
   * 跳转留言页
   */
  goPageWithMessageContent: function (e) {
    let {
      userid,
      navtitle
    } = e.currentTarget.dataset;

    jumpToPromisify("message-content", "navigate", {
      with_user_id: userid,
      navTitle: navtitle
    })
  }

})