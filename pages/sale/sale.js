// pages/sale/sale.js
import {
  circleDetailWithToken,
  couponWithToken,
  getCouponListWithToken,
  payByCircle,
  getCouponWithToken,
} from "../../api/request.js"
import regeneratorRuntime from "../../api/regeneratorRuntime.js"
import {
  showToastPromisify,
  jumpToPromisify,
  setStoragePromisify,
  getStorageInfoPromisify,
  showLoadingPromisify,
  payPromisify,
  getStoragePromisify
} from "../../api/promisify.js"
import {
  countDown, signPay,sleep
} from "../../common/common.js"

const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    bannerList: [
      "微信用户 王先生 刚刚加入了上海有房相亲圈",
      "微信用户 张女士 刚刚加入了武汉有房相亲圈",
      "微信用户 郑女士 刚刚加入了深圳有房相亲圈",
      "微信用户 黄先生 刚刚加入了上海硕博相亲圈",
      "微信用户 郑女士 刚刚加入了北京有房相亲圈",
      "微信用户 刘先生 刚刚加入了南京有房相亲圈",
      "微信用户 吕先生 刚刚加入了上海海归相亲圈",
      "微信用户 吴先生 刚刚加入了杭州有房相亲圈",
      "微信用户 赵先生 刚刚加入了上海985相亲圈",
      "微信用户 吴先生 刚刚加入了郑州有房相亲圈",
      "微信用户 黄先生 刚刚加入了成都有房相亲圈",
      "微信用户 刘先生 刚刚加入了北京海归相亲圈",
      "微信用户 王先生 刚刚加入了上海大龄相亲圈",
      "微信用户 吴女士 刚刚加入了南京有房相亲圈",
      "微信用户 赵先生 刚刚加入了成都有房相亲圈",
      "微信用户 王先生 刚刚加入了上海海归相亲圈",
      "微信用户 钱先生 刚刚加入了深圳有房相亲圈",
      "微信用户 李先生 刚刚加入了北京985相亲圈"
    ],
    saleData: {}, //页面数据
    couponData: { //优惠数据
      tip: "无可用优惠券",
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
  onLoad: async function(options) {
    let _this = this;
    let {
      circleId,
      comeFrom
    } = options;
    comeFrom && _this.setData({ comeFrom })
    //如果不存在或者circleId 为0 返回首页
    if (!circleId || circleId === 0) {
      showToastPromisify({
        title: "未登录,请返回!"
      })
      jumpToPromisify("index", "reLaunch")
      return
    }

    //请求页面数据
    let saleData = circleId && await _this.getPageData({
      circleId
    });
    _this.setData({
      saleData
    });

    //初次进入获取第一张优惠券
    let storageInfo = await getStorageInfoPromisify();
    if (!storageInfo.keys.includes("isGetFirstCoupon")) {
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
    let couponlist = await this.getCouponList();
    let { OPENID } = await getStoragePromisify("OPENID")
    this.setData({
      OPENID
    })
  },

  /**
   * 请求页面数据
   */
  getPageData: async function(param) {
    let _this = this;
    let saleData = {};
    let {
      circleId
    } = param
    //判断是否授权
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes("Token") && circleId) {
      showLoadingPromisify()
      let sale = await circleDetailWithToken(circleId);
      if (sale.statusCode === 200) {
        saleData["name"] = sale.data.name;
        saleData["circleId"] = sale.data.circle_id
        saleData["price"] = sale.data.price;
        saleData["newprice"] = sale.data.price;
        saleData["declaration"] = sale.data.declaration.split("\n");
        saleData["p1"] = sale.data.price_rules.p1.split(",");
        saleData["p2"] = sale.data.price_rules.p2.split(",");
        saleData["p3"] = sale.data.price_rules.p3.split(",");
        saleData["p4"] = sale.data.price_rules.p4.split(",");
        return saleData
      } else {
        showToastPromisify({
          title: "网络错误重试!"
        })
      }
    } else {
      showToastPromisify({
        title: "未登录,请返回!"
      })
      jumpToPromisify("index", "reLaunch")
    }
  },

  /**
   * 请求第一张优惠券
   */
  getFirstCoupon: async function(param) {
    let firstCoupon = await couponWithToken({ ...param
    });
    if (firstCoupon.statusCode === 200) {
      return firstCoupon.data
    } else {
      showToastPromisify({
        title: "网络错误重试!"
      })
    }
  },

  /**
   * 获取可用优惠券
   */
  getCouponList: async function() {
    let {
      saleData,
      couponData
    } = this.data
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes("Token")) {
      let couponList = await getCouponListWithToken()
      if (couponList.statusCode === 200) {
        if (couponList.data.length > 0) {
          couponData["isOnSale"] = true;
          couponData["money"] = couponList.data[0].coupon_info.money;
          couponData["user_coupon_id"] = couponList.data[0].user_coupon_id;
          saleData["newprice"] = saleData.price - couponList.data[0].coupon_info.money
          let inter = setInterval(() => {
            let deadline = countDown(couponList.data[0].expired);
            couponData["deadline"] = deadline;
            this.setData({
              couponData,
              saleData
            })
          }, 1000);
          //无优惠券使用显示无可用优惠券
          couponData["tip"] ="已选择1张优惠券" //"有" + couponList.data.length + "张优惠券可用";
          couponList.data.map((item, index) => {
              //默认选择第一张
              if (index === 0) {
                item["checked"] = true
              } else {
                item["checked"] = false
              }
              let inter = setInterval(() => {
                if (deadline === "time out") {
                  clearInterval(inter);
                  return
                }
                let deadline = countDown(item.expired);
                couponData["deadline"] = deadline;
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
      } else {
        showToastPromisify({
          title: "网络错误,请重试"
        })
      }
    } else {
      showToastPromisify({
        title: "未登录,请返回!"
      });
      await sleep(1500);
      jumpToPromisify("index", "reLaunch")
    }

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: async function() {

  },



  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

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
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  },


  /**
   * 选择优惠券列表 并关闭
   */
  closeCouponList: function(e) {
    let _this = this;
    let {
      couponId
    } = e.detail;
    let {
      couponListData,
      couponData,
      saleData
    } = _this.data;
    if (couponId) {
      couponListData.map(item => {
        if (item.coupon_id == e.detail.couponId) {
          couponData["money"] = item.coupon_info.money;
          couponData["deadline"] = item.coupon_info.deadline;
          couponData["tip"] = "已选择1张优惠券";
          couponData["isOnSale"] = true;
          couponData["user_coupon_id"] = item.user_coupon_id
          saleData["price"] = saleData.price - item.coupon_info.money;
          item["checked"] = true
        }else{
          item["checked"] = false
        }
        _this.setData({
          couponData,
          couponListData
        })
      })
    }
    _this.setData({
      isCloseByMask: false,
      isCloseByUseCoupon: false,
    })
    e.detail === "close" && _this.setData({
      isCloseByUseCoupon: false,
      isCloseByMask: false,
    })
  },


  /**
   * 打开优惠券列表
   */
  powerDrawer: function(e) {
    let {
      statu
    } = e.currentTarget.dataset
    this.util(statu)
  },

  /**
   * 立即领取第一张优惠券
   */
  onFirstCoupon: async function(e) {
    let _this = this;
    //点击右上方关闭
    if(e.detail ==="close"){
      _this.setData({
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
    } = _this.data;
    detail === "领取成功" && (
      showToastPromisify({
        title: "优惠券已放入您的账户中"
      }), couponData["money"] = firstCouponData.money, couponData["deadline"] = firstCouponData.deadline, couponData["tip"] = "已选择1张优惠券", couponData["isOnSale"] = true,
      _this.setData({
        isCloseByMask: false,
        isCloseBycoupon: false,
        isOnSale: true,
        couponData,
      }), setStoragePromisify({
        "isGetFirstCoupon": "ok"
      }), await this.getCouponList()
    )
  },

  /**
   * 创建动画
   */
  util: function(currentStatu) {
    var that = this;
    var animation = wx.createAnimation({
      duration: 400,
      timingFunction: '"linear"',
      delay: 0,
      transformOrigin: '"50% 50% 0"',
    });
    that.animation = animation;
    animation.opacity(0).rotateY(-100).step();
    that.setData({
      animationData: animation.export()
    });
    animation.opacity(1).rotateX(0).step();
    that.setData({
      animationData: animation
    });
    if (currentStatu == "close") {
      that.setData({
        isCloseByMask: false,
        isCloseByUseCoupon: false
      });
    }
    currentStatu == "open" && that.setData({
      isCloseByMask: true,
      isCloseByUseCoupon: true
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
   * 跳转编辑页面
   */
  goPageWithPersonInfo: async function(e) {
    let {
      user_coupon_id
    } = this.data.couponData;
    let {
      circleId, name,price
    } = this.data.saleData;
    let { comeFrom } = this.data;
    let appid = wx.getAccountInfoSync();
    showLoadingPromisify();
    let result = await payByCircle({
      app_id: appid.miniProgram.appId,
      user_coupon_id: user_coupon_id||0,
      circle_id: circleId
    });
    let {
      nonce_str,
      prepay_id,
      sign
    } = result.data.results;
    let timeStamp = String(new Date().getTime());
    let data = { timeStamp, ...result.data.results};
    let payResult = await payPromisify({
      timeStamp,
      nonceStr: nonce_str,
      package: `prepay_id=${prepay_id}`,
      paySign: signPay(data), 
      signType: 'MD5',
    })
    if (payResult.errMsg==="requestPayment:ok"){
      showToastPromisify({
        title: "支付成功",
        image: "/images/icon/success.png"
      });
      showLoadingPromisify();
      user_coupon_id && await getCouponWithToken({
        type: 1,
        user_coupon_id
      });
      jumpToPromisify("person-info", "redirect", {
        circleId,
        circleName: name,
        comeTo: "sale",
      })
    }else{
      showToastPromisify({
        title: "支付失败，请检查网络或稍后再试",
        duration: 2000,
      })
    }
  },
})