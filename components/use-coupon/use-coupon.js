// components/use-coupon/use-coupon.js
const app = getApp();
import regeneratorRuntime from  '../../api/regeneratorRuntime.js'
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    couponList: {
      type: Array
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
     * 关闭优惠券列表
     */
    close: function() {
      this.triggerEvent('myList', 'close')
    },

    /**
     * 选择优惠券
     */
    bindSubmit:async function(e) {
      let {
        formId
      } = e.detail;
     formId && app.data.formID.push(formId);
      this.triggerEvent('myList', e.detail.value, )
    }
  }
})