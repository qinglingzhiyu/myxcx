// pages/dynamic/dynamic.js
import {
  getUserAllDynamic,
  deleteDynamic,
  updateLike,
  isJoinCircle
} from "../../api/request.js"
import {
  jumpToPromisify,
  showToastPromisify,
  getStorageInfoPromisify,
  showLoadingPromisify,
  setStoragePromisify 
} from "../../api/promisify.js"
import regeneratorRuntime, { async } from "../../api/regeneratorRuntime.js"
import { sleep } from "../../common/common.js"


const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    del: false,
    delAffirm: false,
    isCloseByMask: false,
    isComment:false,
    dynamicData: [], //动态数据
    page: 1, //当前页
    index: 0, //当前动态列表的位置
    commentInfo:{}, //评论信息
    userId:0, //当前用户
    isEmpty:true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function(options) {
    
    let _this = this;
    let {
      navTitle,
      userId
    } = options;
    navTitle && wx.setNavigationBarTitle({
      title: navTitle
    })
    userId && _this.setData({
      userId
    });
    navTitle && _this.setData({
      navTitle
    })
    let result = await _this.getAllDynamic({
      user_id: userId,
      page: 1,
      navTitle
    })
    result && _this.setData({
      dynamicData: result
    })
  },

  /**
   * 请求页面数据
   */
  getAllDynamic: async function(param) {
    let _this = this;
    let {
      user_id,
      navTitle,
      page
    } = param;
    showLoadingPromisify()
    let result = await getUserAllDynamic({
      user_id,
      page
    });
    if (result.statusCode === 200) {
      if (result.data.results.length >0){
        _this.setData({
          isEmpty:false
        })
      }else {
        _this.setData({
          isEmpty:true
        })
      }
      result.data.results.map((item, index) => {
        if (navTitle && navTitle === "TA的动态") item["isown"] = false;
        else item["isown"] = true;
        item["images"] = item.images.split(",").filter(Boolean);
        if (item.content.length >= 69) {
          item["contentSub"] = item.content.slice(0, 78) + "...";
          item["isShowWithContent"] = true
        }
        item["isInterest"] = false;
        item["del"] = false;
      })
      return result.data.results
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 控制查看全文
   */
  openContent: function(e) {
    let {
      index
    } = e.currentTarget.dataset;
    let {
      dynamicData
    } = this.data;
    dynamicData.map((item, i) => {
      index === i && (item["isShowWithContent"] = false)
    })
    this.setData({
      dynamicData
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom:async function() {
    let { page, dynamicData, userId, navTitle } = this.data;
    page+=1;
    let result = await this.getAllDynamic({
      user_id: userId,
      page,
      navTitle
    })
    
    
    
    result &&result.map(item=>{
      dynamicData.push(item)
    })
    result && this.setData({
      dynamicData,
      page
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function(e) {
    let {
      feedid,
      img,
      sex,
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
   * 弹出上部弹窗
   */
  popDel: function(e) {
    let {
      index
    } = e.currentTarget.dataset;
    let {
      dynamicData
    } = this.data;
    dynamicData.map((item, i) => {
      if (index === i) item["del"] = true;
      else item["del"] = false;
    })
    this.setData({
      dynamicData
    })
  },

  /**
   * 弹窗确认删除
   */
  delAffrim: function(e) {
    let {
      index
    } = e.currentTarget.dataset;
    let {
      dynamicData
    } = this.data;
    dynamicData.map(item => {
      item["del"] = false;
    })
    this.setData({
      isCloseByMask: true,
      delAffirm: true,
      index,
      dynamicData
    })
  },

  /**
   * 确认删除
   */
  deleteAffirm: async function() {
    let {
      page,
      dynamicData,
      index
    } = this.data;
    let {
      feed_id,
      user_id
    } = dynamicData[index]
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes("Token")) {
      showLoadingPromisify({
        title: "操作中"
      })
      let result = await deleteDynamic({
        type: -1,
        feed_id
      })
      this.setData({
        isCloseByMask: false,
        delAffirm: false,
      })
      if (result.statusCode === 200) {
        showToastPromisify({
          title: "删除成功",
          image: "/images/icon/success.png"
        });
        await sleep(1000);
        let data = await this.getAllDynamic({
          user_id,
          page
        })
        if (data) this.setData({
          dynamicData: data,
        })

      } else showToastPromisify({
        title: "网络错误,请重试!"
      })
    } else showToastPromisify({
      title: "未登录,请返回!"
    }), jumpToPromisify("index", "reLaunch")
  },

  /**
   * 点赞
   */
  onInterest:async function(e) {
    let {
      dynamicData
    } = this.data;
    let {
      index,circleid,feedid
    } = e.currentTarget.dataset;
    dynamicData[index].isInterest = true;
    dynamicData[index].like += 1;
    showLoadingPromisify({
      title: "操作中"
    })
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes("Token")) {
      let result = await updateLike({
        feed_id: feedid
      })
      if (result && result.statusCode === 200) {
        showToastPromisify({
          title: '点赞成功',
          icon: "success",
        })
        this.setData({
          dynamicData
        })
      } else {
        showToastPromisify({
          title: '点赞失败',
          icon: "fail",
        })
      }
    } else showToastPromisify({
      title: "未登录,请返回!"
    }), jumpToPromisify("index", "reLaunch")
  },

  /**
   * 预览图片
   */
  goPreview: function(e) {
    let { imageindex, index} = e.currentTarget.dataset;
    let { dynamicData } = this.data;
    let imgs = dynamicData[index].images
    wx.previewImage({
      urls: imgs,
      current: imgs[imageindex]
    })
  },

  /**
   * 跳转TA的信息页
   */
  goPageWithMyEdit: function(e) {
    jumpToPromisify('my-edit', 'navigate', {
      bottomBtn: e.currentTarget.dataset.btn,
      userId: e.currentTarget.dataset.userid,
      navTitle: e.currentTarget.dataset.navtitle,
      circleId: e.currentTarget.dataset.circleid
    })
  },

  /**
   * 保存formid
   */
  bindSubmit: async function(e) {
    let {
      formId
    } = e.detail;
    formId && app.data.formID.push(formId);
  },

  /**
   * 跳转圈子动态
   */
  goPageWithCircleDynamic:async function(e) {
    let { circleid, circlename  } = e.currentTarget.dataset;
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes("Token")) {
      showLoadingPromisify()
      let result = await isJoinCircle({
        circle_id: circleid
      });
      if (!result) throw new Error(`isJoinCircle api is ${result}`);
      if (result.statusCode === 200) {
        if(result.data.detail){
          jumpToPromisify("circle-dynamic", "navigate", {
            circleId: circleid,
            navTitle: circlename,
          })
        }else{
          showToastPromisify({
            title: "您需要先加入该圈子才能评论哦"
          }), await sleep(1000), jumpToPromisify("circle-introduce", "navigate", {
            circleId: circleid
          }), setStoragePromisify({
            jump: "circleDynamic"
          })
        }
      }else showToastPromisify({title:"网络错误,请重试"})
    } else showToastPromisify({title:"未登录,请返回"}),sleep(1000),jumpToPromisify("index","reLaunch")
  },

  /**
   *  跳转动态详情页
   */
  goPageWithDynamicDetail: function(e) {
    jumpToPromisify("dynamic-detail", "navigate", {
      circleId: e.currentTarget.dataset.circleid,
      feedId: e.currentTarget.dataset.feedid
    })
  },

  /**
   * 关闭弹窗
   */
  closeMask: function(e) {
    e.detail === "close" && this.setData({
      isCloseByMask: false,
      delAffirm: false,
    })
  },

  /**
   * 评论
   */
  onComment:async function (e) {
    let {
      feedid,
      commentto,
      circleid,
      index,
    } = e.currentTarget.dataset;
    let isJoin = await isJoinCircle({
      circle_id: circleid
    });
    if (isJoin.statusCode ===200){
      if (isJoin.data.detail){
        this.setData({
          isCloseByMask: true,
          isComment: true,
          commentInfo: {
            feed_id: feedid,
            comment_to: commentto || 0,
            index,
            circleid
          }
        })
      }else {
        showToastPromisify({ title:"您需要先加入该圈子才能评论哦"})
      }
      
    }
   
  },

  /**
   * 评论弹窗
   */
  openCommentToast:async function (e) {
    let { dynamicData, commentInfo } = this.data;
    let {
      statusCode,data
    } = e.detail.result;
    if (statusCode === 201) {
      showToastPromisify({
        title: "评论成功"
      });
      data.results["circle_id"] = commentInfo.circleid;
      if (dynamicData[commentInfo.index].comment.length < 5){
        dynamicData[commentInfo.index].comment.push(data.results);
      }
      dynamicData[commentInfo.index].comment_count += 1;
     this.setData({
        dynamicData,
      })
    }else showToastPromisify({title:"评论失败"})
    this.setData({
      isCloseByMask: false,
      isComment: false,
    })
  },

  /**
   * 发布动态
   */
  goPageWithCircle:function () {
    jumpToPromisify("circle","reLaunch")
  }
})