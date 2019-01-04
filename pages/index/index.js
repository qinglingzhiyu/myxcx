//index.js
import {
  province
} from "../../common/const.js"
import {
  checkSessionPromisify,
  getStorageInfoPromisify,
  setStoragePromisify,
  getStoragePromisify,
  jumpToPromisify,
  showLoadingPromisify,
  showToastPromisify,
} from "../../api/promisify.js"
import regeneratorRuntime, { async } from "../../api/regeneratorRuntime.js"
import {
  login,
  indexBanner,
  selectFeed,
  updateLike,
  isJoinCircle,
  updatePersonInfo
} from "../../api/request.js"
import {
  isAuthor,
  QiniuToken,
  sleep
} from "../../common/common.js"

const app = getApp()
const tabBar = require('../../template/tabBar-template/tabbar.js')

Page({
  data: {
    bannerList: [],
    selectList: [],
    gender: ["不限", "男", "女"],
    genderIndex: 0,
    province,
    provinceIndex: 0,
    isCloseBytoast: false,
    isCloseByMask: false,
    isComment: false,
    currentCircleId: 0, // 当前圈子Id
    currentPage: 1, //当前页
    commentInfo: {}, //评论内容
  },

  onLoad: async function () {
    let _this = this;

    //底部导航false
    let pointStatus = wx.getStorageSync("pointStatus") || false;
    tabBar.tabbarmain("tabBar", 0, this, pointStatus);

    //从大家来牵线
    let {
      receiveData
    } = app.data;
    if (typeof receiveData !== "undefined" && receiveData.from === '牵线') {
      let storageInfo = await getStorageInfoPromisify();
      if (storageInfo.keys.includes("userId")) {
        let myUserld = (await getStoragePromisify("userId")).userId //获取本地的userid
        Number(myUserld) === Number(receiveData.userId) && jumpToPromisify("my-edit", "navigate", {
          userId: receiveData.userId,
          circleId: receiveData.circleId,
          bottomBtn: "编辑信息",
          navTitle: "我的相亲名片"
        });
        Number(myUserld) !== Number(receiveData.userId) && jumpToPromisify("my-edit", "navigate", {
          userId: receiveData.userId,
          circleId: receiveData.circleId,
          shareId: receiveData.lineShareid,
          bottomBtn: "留言",
          navTitle: "TA的信息"
        });
      } else {
        jumpToPromisify("my-edit", "navigate", {
          userId: receiveData.userId,
          circleId: receiveData.circleId,
          shareId: receiveData.lineShareid,
          bottomBtn: "留言",
          navTitle: "TA的信息"
        });
      };
      receiveData.lineShareid &&await setStoragePromisify({
        lineShareid: receiveData.lineShareid
      });
    }
    receiveData && (receiveData.from = "");

    //获取banner
    let banner = await indexBanner();
    if (banner.statusCode === 200) {
      _this.setData({
        bannerList: banner.data
      })
    }
    let storageInfo = await getStorageInfoPromisify();
    let { province,currentPage } = _this.data;
    let provinceIndex;
    if(storageInfo.keys.includes("sex") && storageInfo.keys.includes("prov")){
      let { sex, prov } =await getStoragePromisify(["sex","prov"]);
      prov && province.map((item,index)=>{
        if(Number(item.key) === Number(prov)) return provinceIndex=index
      })
      let select = await _this.getSelectList({
        sex:sex,
        prov:prov ,
        page:currentPage
      });
      _this.setData({
        genderIndex:Number(sex) || 0 ,
        provinceIndex:provinceIndex ||0,
        selectList: select,
      });
    }else{
      setStoragePromisify({
        "sex": "",
        "prov": "",
      });
      let select = await _this.getSelectList({
        sex:'',
        prov:'',
        page:currentPage
      });
      _this.setData({
        selectList: select,
      })
    }
    
    
  },

  /**
   * 选择性别
   * @param {*} e 
   */
  bindGenderChange: async function (e) {
    let {
      value
    } = e.detail;
    this.setData({
      genderIndex: value,
      currentPage: 1
    });
    let sex = e.detail.value == "0" ? "" : e.detail.value;
    let page = this.data.currentPage;
    let prov = "";
    setStoragePromisify({
      "sex": sex
    });

    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes("prov")) {
      prov = wx.getStorageSync("prov")
    }
    let select = await this.getSelectList({
      prov,
      sex,
      page
    });

    this.setData({
      selectList: select
    })
  },

  /**
   * 选择省份
   */
  bindprovinceChange: async function (e) {
    let {
      value
    } = e.detail;
    this.setData({
      provinceIndex: value,
      currentPage: 1
    });
    let prov = value == "0" ? "" : province[value].key;
    let location = value == "0"? "31":String(province[value].key)
    setStoragePromisify({
      "prov": prov
    });
    let page = this.data.currentPage;
    let sex = "";
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes("sex")) {
      sex = wx.getStorageSync("sex")
    };
    let select = await this.getSelectList({
      prov,
      sex,
      page
    });
    this.setData({
      selectList: select
    });
    if(storageInfo.keys.includes("Token") && storageInfo.keys.includes("userId")){
      let { userId } = await getStoragePromisify("userId");
      await updatePersonInfo({
        userId,
        info:{
          location:location+"0000"
        }
      })
    }
  },

  /**
   * 获取精选圈子列表
   */
  getSelectList: async function (param) {
    let _this = this;
    let {
      page
    } = param;
    showLoadingPromisify()
    let select = await selectFeed({ ...param
    });
    if (select.statusCode === 200) {
      select.data.results.map(item => {
        item['images'] = item.images.split(",").filter(Boolean);
        item.comment.map(item2 => {
          item2["circle_id"] = item.circle_id
        })
        if (item.content.length >= 69) {
          item["contentSub"] = item.content.slice(0, 78) + "...";
          item["isShowWithContent"] = true
        } else {
          item["isInterest"] = false;
        };
      });
      this.setData({
        currentPage: page
      });
      return select.data.results
    } else {
      showToastPromisify({
        title: "没有更多啦"
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
      index,
      feedid,
      commentto
    } = info.currentTarget.dataset;
    let authorStatus = await isAuthor({
      encryptedData: info.detail.encryptedData,
      iv: info.detail.iv
    });
    if (authorStatus.statusCode === "isOk" || authorStatus.statusCode === 200) {
      if (cometo === "location") {
        if (typeof circleid === "undefined" || !circleid) throw new Error(`circleid is ${circleid}`);
        if (typeof navtitle === "undefined" || !navtitle) throw new Error(`navtitle is ${navtitle}`);
        circleid && navtitle && this.goPageWithCircleDynamic({
          circleid,
          navtitle,
        });
      } else if (cometo === "interest") {
        if (typeof index === "undefined") throw new Error(`index is ${index}`);
        if (typeof feedid === "undefined" || !feedid) throw new Error(`feedid is ${feedid}`);
        index !== "undefined" && feedid && this.onInterest({
          index,
          feedid
        });
      } else if (cometo === "comment") {
        if (typeof feedid === "undefined" || !feedid) throw new Error(`feedid is ${feedid}`);
        if (typeof commentto === "undefined") throw new Error(`commentto is ${commentto}`);
        if (typeof circleid === "undefined" || !circleid) throw new Error(`circleid is ${circleid}`);
        feedid && circleid && this.onCommentByBtn({
          feedid,
          commentto,
          circleid,
          authorStatus,
          index
        });
      }
    }
    if (authorStatus.statusCode === 200) QiniuToken();
  },

  /**
   * 点击来自xxxx后跳转圈子动态
   * 如果加入圈子则跳转到圈子动态
   * 如果未加入圈子则弹出入圈规则
   */
  goPageWithCircleDynamic: async function (param) {
    let {
      circleid,
      navtitle
    } = param;
    let result = await isJoinCircle({
      circle_id: circleid
    });
    if (!result) throw new Error(`isJoinCircle api is ${result}`);
    if (result.statusCode === 200) {
      if (result.data.detail) jumpToPromisify("circle-dynamic", "navigate", {
        navTitle: navtitle,
        circleId: circleid
      });
      else this.setData({
        currentCircleId: circleid,
        isCloseByMask: true,
        isCloseBytoast: true,
      }), setStoragePromisify({
        jump: "circleDynamic"
      });
    } else new Error(`isJoinCircle api statusCode:${result.statusCode}`), showToastPromisify({
      title: "网络错误,请重试!"
    })
  },

  /**
   * 点击感兴趣操作
   */
  onInterest: async function (param) {
    let {
      index,
      feedid
    } = param
    let {
      selectList
    } = this.data;
    selectList[index].isInterest = true;
    selectList[index].like += 1;
    showLoadingPromisify({
      title: "操作中"
    })
    showLoadingPromisify();
    let result = await updateLike({
      feed_id: feedid
    });
    if (!result) throw new Error(`updateLike api is ${result}`);
    if (result.statusCode === 200) {
      showToastPromisify({
        title: '点赞成功',
        icon: "success",
      });
      this.setData({
        selectList
      });
    } else throw new Error(`updateLike api statusCode:${result.statusCode}`), showToastPromisify({
      title: '点赞失败',
      icon: "fail",
    });
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
      authorStatus,
      index
    } = param;
    
    showLoadingPromisify({
      title: "请求中"
    });
    let result = await isJoinCircle({
      circle_id: circleid
    });
    if (!result) throw new Error("isJoinCircle api is undefine");
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
            index
          }
        });
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
            currentCircleId: circleid,
            isCloseByMask: true,
            isCloseBytoast: true,
          }), setStoragePromisify({
            jump: "circleDynamic"
          })
        )
      }
    } else throw new Error(`isJoinCircle api statusCode:${result.statusCode}`), showToastPromisify({
      title: "网络错误,请重试!"
    });
  },

  /**
   * 关闭toast
   */
  closeTosat: function (e) {
    e.detail === "close" && this.setData({
      isCloseByMask: false,
      isCloseBytoast: false
    })
  },

  /**
   * 关闭toast 并跳转圈子规则
   */
  mytoast: function (e) {
    let circleId = this.data.currentCircleId;
    e.detail === "close" && this.setData({
      isCloseByMask: false,
      isCloseBytoast: false
    });
    e.detail === "navgiteWithClose" && jumpToPromisify("circle-introduce", "navigate", {
      circleId
    }), this.setData({
      isCloseByMask: false,
      isCloseBytoast: false
    });
  },

  /**
   * 控制查看全文
   */
  openContent: function (e) {
    let i = e.currentTarget.dataset.index;
    let selectList = this.data.selectList;
    selectList.map((item, index) => {
      index === i && (item["isShowWithContent"] = false)
    });
    this.setData({
      selectList
    });
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
   * 跳转TA的信息页
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
    } else jumpToPromisify("my-edit", "navigate", {
      navTitle: "TA的信息",
      bottomBtn: "留言",
      userId: userid,
      circleId: circleid
    });
  },

  /**
   * 跳转动态详情页
   */
  goPageWithDynamicDetail: function (e) {
    let {
      selectfeedid,
      feedid
    } = e.currentTarget.dataset;
    jumpToPromisify("dynamic-detail", "navigate", {
      selectFeedId: selectfeedid,
      feedId: feedid,
    })
  },

  /**
   * 跳转不带授权页面
   */
  goOtherPages: function (e) {
    e.currentTarget.dataset.url == "circle" && jumpToPromisify(e.currentTarget.dataset.url, "reLaunch");
  },

  /**
   * 跳转带授权的页面
   */
  goOtherPagesWithAuthor: async function (info) {
    if (info.detail.errMsg === "getUserInfo:fail auth deny") return;
    let {
      nickName
    } = info.detail.userInfo;
    setStoragePromisify({
      "NICKNAME": nickName
    })
    let storageInfo = await getStorageInfoPromisify();
    if (!storageInfo.keys.includes("Token")) {
      let sessionStatus = await checkSessionPromisify();
      let result = sessionStatus.errMsg === "checkSession:ok" && await login({
        encryptedData: info.detail.encryptedData,
        iv: info.detail.iv
      });
      result.data && await setStoragePromisify({
        "Token": result.data.token,
        "userId": result.data.id
      });
      QiniuToken();
      info.detail.errMsg === "getUserInfo:ok" && jumpToPromisify(info.currentTarget.dataset.url, "reLaunch")
    } else jumpToPromisify(info.currentTarget.dataset.url, "reLaunch")
  },

  /**
   * 上拉刷新
   */
  onReachBottom: async function () {
    let page = this.data.currentPage;
    page += 1;
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes("prov") && storageInfo.keys.includes("sex")) {
      let prov = wx.getStorageSync("prov");
      let sex = wx.getStorageSync("sex");
      let selectList = this.data.selectList;
      let select = await this.getSelectList({
        prov,
        sex,
        page
      });
      select && select.map(item => {
        selectList.push(item);
      });
      this.setData({
        selectList
      });
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (e) {
    let _this = this;
    let {
      feedid,
      img,
      sex,
      selectfeedid
    } = e.target.dataset;
    if (e.from === "button") {
      let title = "";
      sex === "男" && (title = "快来看看这家孩子适不适合你家小美女？我亲自挑的!");
      sex === "女" && (title = "快来看看这家孩子适不适合你家帅哥？我亲自挑的!")
      return {
        title: title,
        path: `/pages/dynamic-detail/dynamic-detail?selectFeedId=${selectfeedid}&feedId=${feedid}`,
        imageUrl: img
      }
    } else {
      return {
        title: "精选圈子动态",
        path: "/pages/index/index"
      }
    }
  },

  /**
   * 预览图片
   */
  goPreview: function (e) {
    let that = this;
    let imgs = that.data.selectList[e.currentTarget.dataset.index].images
    wx.previewImage({
      urls: imgs,
      current: imgs[e.currentTarget.dataset.photoindex]
    })
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
   * 评论
   */
  onComment: async function (e) {
    let {
      selectList,
      commentInfo
    } = this.data;
    let {
      statusCode,
      data
    } = e.detail.result;
    if (statusCode === 201) {
      data.results["circle_id"] = commentInfo.circleid;
      if (selectList[commentInfo.index].comment.length < 5){
        selectList[commentInfo.index].comment.push(data.results);
      }
      selectList[commentInfo.index].comment_count += 1;
      this.setData({
        isCloseByMask: false,
        isComment: false,
        selectList
      });
      showToastPromisify({
        title: "评论成功"
      });
    } else {
      showToastPromisify({
        title: "评论失败"
      });
      this.setData({
        isCloseByMask: false,
        isComment: false,
      })
    }
  },

  /**
   * 顶部link跳转
   * banner_type 0: 小程序, 1: appid, 2: 微信公众号
   */
  goLink:async function (e) {
    
    let {
      index
    } = e.currentTarget.dataset;
    let {
      bannerList
    } = this.data;
    let {
      banner_type,
      link
    } = bannerList[index];
    if (banner_type === 0) {
      wx.navigateTo({
        url: link,
      })
    } else if (banner_type === 1) {
      wx.navigateToMiniProgram({
        appId: link,
      });
    } else if (banner_type === 2) {
      setStoragePromisify({link})
      await sleep(500);
      jumpToPromisify("web")
    }
  }
})