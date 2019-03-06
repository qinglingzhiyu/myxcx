/**
 * Created by Terris
 * https://github.com/qinglingzhiyu
 *
 * @date: 2019-01-08
 * @flow
 *
 * description: 支付逻辑
 *
 */

import {
  payByCircle,
  isJoinCircle,
  couponWithToken,
  getCouponWithToken,
  circleDetailWithToken,
  getCouponListWithToken
} from '../../api/request.js'
import regeneratorRuntime from '../../api/regeneratorRuntime.js'
import {
  payPromisify,
  jumpToPromisify,
  showModalPromisify,
  showToastPromisify,
  getStoragePromisify,
  setStoragePromisify,
  showLoadingPromisify,
  removeStoragePromisify,
  getStorageInfoPromisify,
} from '../../api/promisify.js'
import {
  sleep,
  signPay,
  countDown
} from '../../common/common.js'
import {
  isTestEnvironment
} from '../../api/config';

const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    bannerList: [
      '微信用户 王先生 刚刚加入了上海有房相亲圈',
      '微信用户 张女士 刚刚加入了武汉有房相亲圈',
      '微信用户 郑女士 刚刚加入了深圳有房相亲圈',
      '微信用户 黄先生 刚刚加入了上海硕博相亲圈',
      '微信用户 郑女士 刚刚加入了北京有房相亲圈',
      '微信用户 刘先生 刚刚加入了南京有房相亲圈',
      '微信用户 吕先生 刚刚加入了上海海归相亲圈',
      '微信用户 吴先生 刚刚加入了杭州有房相亲圈',
      '微信用户 赵先生 刚刚加入了上海985相亲圈',
      '微信用户 吴先生 刚刚加入了郑州有房相亲圈',
      '微信用户 黄先生 刚刚加入了成都有房相亲圈',
      '微信用户 刘先生 刚刚加入了北京海归相亲圈',
      '微信用户 王先生 刚刚加入了上海大龄相亲圈',
      '微信用户 吴女士 刚刚加入了南京有房相亲圈',
      '微信用户 赵先生 刚刚加入了成都有房相亲圈',
      '微信用户 王先生 刚刚加入了上海海归相亲圈',
      '微信用户 钱先生 刚刚加入了深圳有房相亲圈',
      '微信用户 李先生 刚刚加入了北京985相亲圈'
    ],
    saleData: {}, //页面数据
    couponData: { //优惠数据
      tip: '无可用优惠券',
      isOnSale: false
    },
    isCloseByMask: false,
    isCloseBycoupon: false,
    isCloseByUseCoupon: false,
    currentCircleId: 0, //当前圈子id
    useCouponId: 0, //使用的优惠券id
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    let {
      circleId,
      comeFrom
    } = options;
    circleId && this.setData({
      circleId
    })
    comeFrom && this.setData({
      comeFrom
    })

    //请求页面数据
    try {
      if (typeof circleId === 'undefined' || !circleId) throw new Error(`circleId is ${circleId}`)
      let saleData = circleId && await this.getPageData({
        circleId
      });
      this.setData({
        saleData
      });
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        title: '错误提示',
        content: String(error)
      })
    }
    wx.hideShareMenu(); //取消顶部分享
  },



  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: async function () {
    let {
      circleId
    } = this.data;
    // //请求页面数据
    // let saleData = circleId && await this.getPageData({
    //   circleId
    // });
    // this.setData({
    //   saleData
    // });

    //初次进入获取第一张优惠券
    let storageInfo = await getStorageInfoPromisify();
    if (!storageInfo.keys.includes('isGetFirstCoupon')) {
      let getFirstCoupon = await this.getFirstCoupon({
        init: 0,
        circle_id: circleId
      })
      getFirstCoupon && this.setData({
        firstCouponData: getFirstCoupon,
        isCloseByMask: true,
        isCloseBycoupon: true,
      });
    }
    //获取可用优惠券
    await this.getCouponList();
    let {
      OPENID
    } = await getStoragePromisify('OPENID')
    this.setData({
      OPENID,
    })
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
  onShareAppMessage: function () {

  },

  /**
   * 请求页面数据
   */
  getPageData: async function (param) {
    let saleData = {};
    let {
      circleId
    } = param
    //判断是否授权
    let storageInfo = await getStorageInfoPromisify();
    try {
      if (storageInfo.keys.includes('Token')) {
        showLoadingPromisify()
        let sale = await circleDetailWithToken(circleId);
        if (sale.statusCode === 200) {
          saleData['name'] = sale.data.name;
          saleData['circleId'] = sale.data.circle_id
          saleData['price'] = sale.data.price;
          saleData['newprice'] = sale.data.price;
          saleData['declaration'] = sale.data.declaration.split('\n');
          saleData['p1'] = sale.data.price_rules.p1.split(',');
          saleData['p2'] = sale.data.price_rules.p2.split(',');
          saleData['p3'] = sale.data.price_rules.p3.split(',');
          saleData['p4'] = sale.data.price_rules.p4.split(',');
          return saleData
        } else throw new Error(`statusCode of circleDetailWithToken is ${sale.statusCode}`)
      } else {
        let errModel = await showModalPromisify({
          title: '提示',
          content: '账号异常,点击确认返回首页'
        });
        errModel.confirm && jumpToPromisify('index', 'reLaunch')
      }
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        title: '错误提示',
        content: String(error)
      })
    }

  },

  /**
   * 请求第一张优惠券
   */
  getFirstCoupon: async function (param) {
    try {
      let firstCoupon = await couponWithToken({ ...param
      });
      if (typeof firstCoupon === 'undefined' || !firstCoupon) throw new Error(`couponWithToken api is ${firstCoupon}`)
      if (firstCoupon.statusCode === 200) {
        return firstCoupon.data
      }
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        title: '错误提示',
        content: String(error)
      })
    }
  },

  /**
   * 获取可用优惠券
   */
  getCouponList: async function () {
    let {
      saleData,
      couponData
    } = this.data
    let storageInfo = await getStorageInfoPromisify();
    try {
      if (storageInfo.keys.includes('Token')) {
        let couponList = await getCouponListWithToken()
        if (typeof couponList === 'undefined' || !couponList) throw new Error(`getCouponListWithToken api is ${couponList}`)
        if (couponList.statusCode === 200) {
          if (couponList.data.length > 0) {
            couponData['isOnSale'] = true;
            couponData['money'] = couponList.data[0].coupon_info.money;
            couponData['user_coupon_id'] = couponList.data[0].user_coupon_id;
            saleData['newprice'] = saleData.price - couponList.data[0].coupon_info.money
            let inter = setInterval(() => {
              let deadline = countDown(couponList.data[0].expired);
              couponData['deadline'] = deadline;
              this.setData({
                couponData,
                saleData
              })
            }, 1000);
            //无优惠券使用显示无可用优惠券
            couponData['tip'] = '已选择1张优惠券' //'有' + couponList.data.length + '张优惠券可用';
            couponList.data.map((item, index) => {
                //默认选择第一张
                if (index === 0) {
                  item['checked'] = true
                } else {
                  item['checked'] = false
                }
                let inter = setInterval(() => {
                  if (deadline === 'time out') {
                    clearInterval(inter);
                    return
                  }
                  let deadline = countDown(item.expired);
                  couponData['deadline'] = deadline;
                  this.setData({
                    couponData
                  })
                }, 1000);
              }),
              this.setData({
                saleData,
                couponData,
                couponListData: couponList.data
              })
          }
        } else throw new Error(`statusCode of getCouponListWithToken is ${couponList.statusCode}`)
      } else {
        let errModel = await showModalPromisify({
          title: '提示',
          content: '账号异常,点击确认返回首页'
        })
        errModel.confirm && jumpToPromisify('index', 'reLaunch')
      }
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        title: '错误提示',
        content: String(error)
      })
    }
  },

  /**
   * 选择优惠券列表 并关闭
   */
  closeCouponList: function (e) {
    let {
      couponId
    } = e.detail;
    let {
      couponListData,
      couponData,
      saleData
    } = this.data;
    if (couponId) {
      couponListData.map(item => {
        if (item.coupon_id == e.detail.couponId) {
          couponData['money'] = item.coupon_info.money;
          couponData['deadline'] = item.coupon_info.deadline;
          couponData['tip'] = '已选择1张优惠券';
          couponData['isOnSale'] = true;
          couponData['user_coupon_id'] = item.user_coupon_id
          saleData['price'] = saleData.price - item.coupon_info.money;
          item['checked'] = true
        } else {
          item['checked'] = false
        }
        this.setData({
          couponData,
          couponListData
        })
      })
    }
    this.setData({
      isCloseByMask: false,
      isCloseByUseCoupon: false,
    })
    e.detail === 'close' && this.setData({
      isCloseByUseCoupon: false,
      isCloseByMask: false,
    })
  },


  /**
   * 打开优惠券列表
   */
  powerDrawer: function (e) {
    this.setData({
      isCloseByMask: true,
      isCloseByUseCoupon: true
    })
  },

  /**
   * 立即领取第一张优惠券
   */
  onFirstCoupon: async function (e) {
    //点击右上方关闭
    if (e.detail === 'close') {
      this.setData({
        isCloseByMask: false,
        isCloseBycoupon: false,
      });
      return
    }
    let {
      detail
    } = e.detail;
    let {
      couponData,
      firstCouponData
    } = this.data;
    if (detail === '领取成功') {
      showToastPromisify({
        title: '优惠券已放入您的账户中'
      });
      couponData['money'] = firstCouponData.money;
      couponData['deadline'] = firstCouponData.deadline;
      couponData['tip'] = '已选择1张优惠券';
      couponData['isOnSale'] = true,
        this.setData({
          isCloseByMask: false,
          isCloseBycoupon: false,
          isOnSale: true,
          couponData,
        });
      setStoragePromisify({
        'isGetFirstCoupon': 'ok'
      });
      await this.getCouponList()
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
   * 跳转编辑页面
   */
  goPageWithPersonInfo: async function (e) {
    let {
      user_coupon_id
    } = this.data.couponData;
    let {
      circleId,
      name,
      price
    } = this.data.saleData;
    showLoadingPromisify();
    let result = await payByCircle({
      app_id: 'wx9fa47d9522cc0237',
      user_coupon_id: user_coupon_id || 0,
      circle_id: circleId,
      version:'XCX-脱单请入圈v1.0.2-20190222'
    });
    let {
      nonce_str,
      prepay_id,
      sign
    } = result.data.results;
    let timeStamp = String(new Date().getTime());
    let data = {
      timeStamp,
      ...result.data.results
    };
    let payResult = await payPromisify({
      timeStamp,
      nonceStr: nonce_str,
      package: `prepay_id=${prepay_id}`,
      paySign: signPay(data),
      signType: 'MD5',
    })
    if (payResult.errMsg === 'requestPayment:ok') {
      showToastPromisify({
        title: '支付成功',
        image: '/images/icon/success.png'
      });

      //使用优惠券
      try {
        showLoadingPromisify();
        user_coupon_id && await getCouponWithToken({
          type: 1,
          user_coupon_id
        });
      } catch (error) {
        isTestEnvironment && showModalPromisify({
          title: '错误提示',
          content: String(error)
        })
      }

      //是否加入圈子
      try {
        showLoadingPromisify();
        if (typeof circleId === 'undefined' || !circleId) throw new Error(`param of isJoinCircle api, circleId is ${circleId}`)
        let result = circleId && await isJoinCircle({
          circle_id: circleId
        });
        if (typeof result === 'undefined') throw new Error(`response of isJoinCircle api is ${result}`)
        if (result.statusCode === 200) {
          if (result.data.completed) {
            let jump = wx.getStorageSync('jump');
            let withUserid = wx.getStorageSync('withUserid');
            let messageNavTitle = wx.getStorageSync('messageNavTitle');
            jump && jump === 'messageContent' && jumpToPromisify('/subPackage_message/pages/message-content/message-content', 'redirect', {
              with_user_id: withUserid,
              navTitle: messageNavTitle
            },true), removeStoragePromisify(['jump', 'withUserid', 'messageNavTitle']);
            jump && jump === 'circleDynamic' && jumpToPromisify('circle-dynamic', 'redirect', {
              circleId,
              navTitle: name
            }), removeStoragePromisify('jump');
            jump && jump === 'dynamic' && jumpToPromisify('dynamic', 'redirect', {
              userId: withUserid,
              navTitle: 'TA的动态'
            }), removeStoragePromisify(['jump', 'withUserid', 'messageNavTitle']);
            !jump && jumpToPromisify('circle-dynamic', 'redirect', {
              circleId,
              navTitle: name,
            })
          } else {
            jumpToPromisify('person-info', 'redirect', {
              circleId,
              circleName: name,
              comeTo: 'sale'
            })
          }
        } else throw new Error(`statusCode of isJoinCircle api is ${result.statusCode}`)
      } catch (error) {
        let content;
        if (error instanceof Object) content = JSON.stringify(error);
        else content = String(content)
        isTestEnvironment && await showModalPromisify({
          title: '错误提示',
          content
        })
      }
    } else {
      showToastPromisify({
        title: '支付失败，请检查网络或稍后再试',
        duration: 2000,
      })
    }
  },
})
