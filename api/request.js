import regeneratorRuntime, { async } from './regeneratorRuntime.js'
import {
  showLoadingPromisify
} from './promisify.js'
import {
  requestPromisify
} from './promisify.js'
import {
  config
} from './config.js'
var n = {
  common: {
    loginUrl: config.base_circle + 'login/', //登录
    verifyCodeUrl: config.base_url + 'verifycode/', //发送验证码
    relateappUrl: config.base_circle + 'relate_app/', // 绑定手机号
    personInfoUrl: config.base_circle + 'user/', //获取个人用户信息
    updatePersonUrl: config.base_url + 'users/', //小程序更新用户信息
    getPhoneUrl: config.base_circle +'get_phone/',//获取手机号
    getConfigUrl: config.base_circle+'config/', //小程序配置
    getCurrentUserUrl: config.base_url+'users/current_user/'  //获取当前用户
  },
  yewu: {
    selectFeedUrl: config.base_circle + 'select_feeds/', //精选动态
    bannerUrl: config.base_circle + 'banner/', //获取Banner
    circleDetailUrl: config.base_circle, //获取圈子详细信息
    couponFirstUrl: config.base_circle + 'coupon/?init=0', //获取初始优惠券 
    getCouponUrl: config.base_circle + 'coupon/', //领取优惠券/使用优惠券
    getCouponListUrl: config.base_circle + 'coupon/', //获取可用优惠券
    getMyCouponUrl: config.base_circle + 'coupon/', //获取我的优惠券
    getQiNiuTokenUrl: config.base_url + 'verifycode/qiniu_token/', // 获取七牛云token
    getUserDnamicUrl: config.base_circle, //获取单个用户动态
    getFeedsDynamicUrl: config.base_circle, //获取圈子动态信息
    getDynamicDetailUrl: config.base_circle + 'wx_feeds/', //获取单个动态
    updataLikeUrl: config.base_circle + 'like/', //创建点赞
    getMembersUrl: config.base_circle, //获取用户圈子人员信息
    getRecommendUrl: config.base_circle + 'recommend/', //获取我的/推荐圈子列表
    getRecommendWithoutTokenUrl: config.base_circle + 'wx_recommend/', //未登录推荐圈子
    getCircleInfoUrl: config.base_circle + 'wx_circle/', //未登录获取圈子信息
    releaseDynamicUrl: config.base_circle + 'feed/', //发布动态
    getMessageNoticeUrl: config.base_circle + 'message/', //获取通知消息列表||获取全部动态通知 ||发送留言
    markMessageUrl: config.base_circle + 'message/', //标记动态提醒已读
    commentUrl: config.base_circle+'comment/', //创建评论 ||删除评论
    payUrl:config.base_circle+'pay/',//圈子支付
    getUserAllDynamicUrl: config.base_circle +'wx_feeds/',//获取单个用户全部动态
    deleteDynamicUrl: config.base_circle+'feed/', //删除动态
    feedbackUrl: config.base_support +'feedback/',//用户反馈
    isJoinCircleUrl: config.base_circle +'is_join/',//判断是否加入圈子和是否完善信息
    userStatusUrl: config.base_circle,//更新圈子用户资料状态
    sendFromidUrl: config.base_circle +'send_formId/', //发送formid
    getOpenidUrl: config.base_circle +'get_openid/',//获取openid
    // interCircleUrl: config.base_match +'entercircle/',// 有人付费进圈
    // createCircleUrl: config.base_match + 'createcircleuser/' //添加圈子用户
  }

};

const appId= 'wx9fa47d9522cc0237';

module.exports = {
  //登录
  login: async(param) => {
    let code = wx.getStorageSync('CODE');
    showLoadingPromisify({
      title: '登录中'
    })
    return await requestPromisify({
      url: n.common.loginUrl,
      method: 'POST',
      data: {
        ...param,
        appId,
        code
      },
      header: {
        Accept: 'application/json'
      }
    })
  },
  //获取验证码
  verifycode: async(param) => {
    return await requestPromisify({
      url: n.common.verifyCodeUrl,
      data: {
        ...param
      },
      method: 'POST'
    })
  },
  //绑定手机号
  relateapp: async(param) => {
    const token = wx.getStorageSync('Token') //获取Token
    return await requestPromisify({
      url: n.common.relateappUrl,
      method: 'POST',
      data: {
        ...param
      },
      header: {
        Authorization: 'Token ' + token,
        Accept: 'application/json'
      }
    })
  },

  //精选动态
  selectFeed: async(param) => {
    let {  sex, city, page } = param;
    return await requestPromisify({
      url: n.yewu.selectFeedUrl,
      data: {
        sex,
        city:city || '',
        page: page  || 1
      }
    })
  },

  //获取首页banner
  indexBanner: async() => {
    return await requestPromisify({
      url: n.yewu.bannerUrl
    })
  },

  //获取单个用户信息
  getUseridInfo: async(param) => {
    return await requestPromisify({
      url: n.common.personInfoUrl,
      data: {
        ...param
      },
    })
  },

  //获取圈子详细信息
  circleDetailWithToken: async(param) => {
    const token = wx.getStorageSync('Token') //获取Token
    return await requestPromisify({
      url: n.yewu.circleDetailUrl + param + '/',
      header: {
        Authorization: 'Token ' + token,
      }
    })
  },

  //获取初始优惠券
  couponWithToken: async(param) => {
    const token = wx.getStorageSync('Token') //获取Token
    return await requestPromisify({
      url: n.yewu.couponFirstUrl,
      data:{...param},
      header: {
        Authorization: 'Token ' + token,
        Accept: 'application/json',
      }
    })
  },

  //领取优惠券/使用优惠券
  getCouponWithToken: async(param) => {
    const token = wx.getStorageSync('Token') //获取Token
    return await requestPromisify({
      url: n.yewu.getCouponUrl,
      method: 'POST',
      data: {
        ...param
      },
      header: {
        Accept: 'application/json',
        Authorization: 'Token ' + token,
      }
    })
  },

  //获取可用优惠券
  getCouponListWithToken: async(param) => {
    const token = wx.getStorageSync('Token') //获取Token
    return await requestPromisify({
      url: n.yewu.getCouponListUrl,
      data: {
        avai: 0
      },
      header: {
        Authorization: 'Token ' + token,
      }
    })
  },

  //获取七牛云token
  getQiNiuTokenWithToken: async(param) => {
    const token = wx.getStorageSync('Token') //获取Token
    return await requestPromisify({
      url: n.yewu.getQiNiuTokenUrl,
      header: {
        Accept: 'application/json',
        Authorization: 'Token ' + token,
      }
    })
  },

  //获取单个用户动态
  getUserDynamic: async(param) => {
    return await requestPromisify({
      url: n.yewu.getUserDnamicUrl + param.circleId + '/feeds/',
      data: {
        userId: param.userId
      },
      header: {
        Accept: 'application/json',
      }
    })
  },

  //获取圈子动态信息
  getFeedsDynamic: async(param) => {
    const {
      circleId,
      page
    } = param;
    const token = wx.getStorageSync('Token') //获取Token
    return await requestPromisify({
      url: n.yewu.getFeedsDynamicUrl + circleId + '/feeds/',
      data: {
        page
      },
      header: {
        Accept: 'application/json',
        Authorization: 'Token ' + token,
      }
    })
  },

  //获取单个动态详情
  getDynamicDetail: async(param) => {
    return await requestPromisify({
      url: n.yewu.getDynamicDetailUrl,
      data: {
        ...param
      },
      header: {
        Accept: 'application/json',
      }
    })
  },

  //更新点赞
  updateLike: async(param) => {
    const token = wx.getStorageSync('Token') //获取Token
    return await requestPromisify({
      url: n.yewu.updataLikeUrl,
      method: 'POST',
      data: {
        ...param
      },
      header: {
        Accept: 'application/json',
        Authorization: 'Token ' + token,
      }
    })
  },

  //获取用户圈子人员信息
  getMembersList: async(param) => {
    const {
      circleId,
      page
    } = param;
    const token = wx.getStorageSync('Token') //获取Token
    return await requestPromisify({
      url: n.yewu.getMembersUrl + circleId + '/members/',
      data: {
        page
      },
      header: {
        Accept: 'application/json',
        Authorization: 'Token ' + token,
      }
    })
  },

  //获取我的优惠券
  getMyCouponList: async() => {
    const token = wx.getStorageSync('Token') //获取Token
    return await requestPromisify({
      url: n.yewu.getMyCouponUrl,
      header: {
        Accept: 'application/json',
        Authorization: 'Token ' + token,
      }
    })
  },

  //获取我的/推荐圈子列表
  getRecommendList: async() => {
    const token = wx.getStorageSync('Token') //获取Token
    return await requestPromisify({
      url: n.yewu.getRecommendUrl,
      data:{
        type:'city'
      },
      header: {
        Accept: 'application/json',
        Authorization: 'Token ' + token,
      }
    })
  },

  //未登录获取圈子信息
  getCircleInfoWithoutToken: async(param) => {
    return await requestPromisify({
      url: n.yewu.getCircleInfoUrl,
      data: { ...param
      }
    })
  },

  //未登录获取推荐圈子
  getRecommendWithoutToken: async(param) => {
    return await requestPromisify({
      url: n.yewu.getRecommendWithoutTokenUrl,
      data: { ...param
      }
    })
  },

  //更新用户信息
  updatePersonInfo: async(param) => {
    let {
      userId,
      info
    } = param;
    const token = wx.getStorageSync('Token') //获取Token
    return await requestPromisify({
      url: n.common.updatePersonUrl + userId + '/post_update/',
      method: 'post',
      data: {
        ...info
      },
      header: {
        Authorization: 'Token ' + token,
      }
    })
  },

  //发布动态
  releaseDynamic: async(param) => {
    const token = wx.getStorageSync('Token'); //获取Token
    return await requestPromisify({
      url: n.yewu.releaseDynamicUrl,
      method: 'POST',
      data: {
        ...param
      },
      header: {
        Authorization: 'Token ' + token,
      }
    })
  },


  //获取通知消息列表 ||获取全部动态通知 ||发送留言
  getMessageNotice: async(param) => {
    const token = wx.getStorageSync('Token') //获取Token
    return await requestPromisify({
      url: n.yewu.getMessageNoticeUrl,
      data: {
        ...param
      },
      header: {
        Accept: 'application/json',
        Authorization: 'Token ' + token,
      }
    })
  },

  //发送留言
  postMessageNotice:async (param)=>{
    const token = wx.getStorageSync('Token') //获取Token
    return await requestPromisify({
      url: n.yewu.getMessageNoticeUrl,
      method:'POST',
      data: {
        ...param
      },
      header: {
        Accept: 'application/json',
        Authorization: 'Token ' + token,
      }
    })
  },

  //标记动态提醒已读
  MarkMessage: async(param) => {
    const token = wx.getStorageSync('Token') //获取Token 
    return await requestPromisify({
      url: n.yewu.markMessageUrl,
      method: 'POST',
      data: { ...param
      },
      header: {
        Accept: 'application/json',
        Authorization: 'Token ' + token,
      }
    })
  },

  /**
   * 创建评论
   * param = {
   *   type:0, 
   *   feed_id,
   *   comment_to,
   *   content
   * }
   * 
   * 删除评论
   * param={
   *   type:-1,
   *   comment_id
   * }
   * 
   * @param {*} param 
   * 
   */
  createOrDeleteComment:async (param)=>{
    const token = wx.getStorageSync('Token') //获取Token
    return await requestPromisify({
      url: n.yewu.commentUrl,
      method:'POST',
      data:{...param},
      header:{
        Accept: 'application/json',
        Authorization: 'Token ' + token,
      }
    })
  },


  //圈子支付
  payByCircle:async (param)=>{
    const token = wx.getStorageSync('Token') //获取Token 
    return await requestPromisify({
      url:n.yewu.payUrl,
      method:'POST',
      data:{...param},
      header:{
        Accept: 'application/json',
        Authorization: 'Token ' + token,
      }
    })
  },

  //获取单个用户的全部动态
  getUserAllDynamic:async (param) =>{
    return await requestPromisify({
      url: n.yewu.getUserAllDynamicUrl,
      data:{...param}
    })
  },

  //删除动态
  deleteDynamic:async (param)=>{
    const token = wx.getStorageSync('Token') //获取Token 
    return await requestPromisify ({
      url: n.yewu.deleteDynamicUrl,
      method:'POST',
      data:{...param},
      header: {
        Accept: 'application/json',
        Authorization: 'Token ' + token,
      }
    })
  },

  //用户反馈
  feedbackUrl:async (param)=>{
    const token = wx.getStorageSync('Token') //获取Token 
    return await requestPromisify ({
      url: n.yewu.feedbackUrl,
      method:'POST',
      data:{...param},
      header: {
        Accept: 'application/json',
        Authorization: 'Token ' + token,
      }
    })
  },

  //获取手机号
  getPhone:async (param) =>{
    const token = wx.getStorageSync('Token') //获取Token 
    return await requestPromisify({
      url: n.common.getPhoneUrl,
      header: {
        Authorization: 'Token ' + token,
      }
    })
  },

  //是否加入圈子和完善个人信息
  isJoinCircle:async (param)=>{
    const token = wx.getStorageSync('Token') //获取Token 
     return await requestPromisify({
       url: n.yewu.isJoinCircleUrl,
       data:{
         ...param
       },
       header:{
         Accept: 'application/json',
         Authorization: 'Token ' + token,
       }
     })
  } ,

  /**
   * 更新圈子用户资料状态 type:1 指信息保存完成  0指需要编辑信息
   */
  userStatus:async (param)=>{
    const token = wx.getStorageSync('Token') //获取Token 
    return await requestPromisify({
      url: n.yewu.userStatusUrl + param +'/users/',
      method:'POST',
      data:{
        type:1
      },
      header:{
        Authorization: 'Token ' + token,
        Accept: 'application/json',
      }
    })
  },

  /**
   * 得到openid
   */
  getOpenid:async (param)=>{
    return await requestPromisify({
      url: n.yewu.getOpenidUrl,
      data:{
        ...param,
        appid: appId
      },
      header:{
        Accept: 'application/json'
      }
    })
  },

  /**
   * 发送formid
   */
  sendFromid:async (param)=>{
    return await requestPromisify({
      url: n.yewu.sendFromidUrl,
      method:'POST',
      data:{
        ...param,
        appId
      },
      header: {
        Accept: 'application/json'
      }
    })
  },

  /**
   * 获取小程序配置
   */
  getConfig:(param) => {
    return requestPromisify({
      url:n.common.getConfigUrl,
      data:{
        ...param,
        appid:appId
      },
      header: {
        Accept: 'application/json'
      }
    })
  },

  getCurrentUser: () =>{
    const token = wx.getStorageSync('Token') //获取Token 
    return requestPromisify({
      url: n.common.getCurrentUserUrl,
      header: {
        Accept: 'application/json',
        Authorization: 'Token ' + token,
      }
    })
  }
}