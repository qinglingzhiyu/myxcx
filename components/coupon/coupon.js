// components/coupon/coupon.js
import {
  getCouponWithToken
} from '../../api/request.js';
import regeneratorRuntime from '../../api/regeneratorRuntime.js';

const app = getApp();
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    firstCoupon: {
      type: Object
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
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
     * 立即领取
     */
    getFirstCoupon: async function(e) {
      let _this = this;
      let result = await getCouponWithToken({
        type: 0,
        coupon_id: e.currentTarget.dataset.couponid
      })
      this.triggerEvent('MyFirstCoupon', result.data)
    },

    /**
     * 关闭
     */
    closeToast:function () {
      this.triggerEvent('MyFirstCoupon', 'close')
    }
  }
})