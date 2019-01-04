// components/rule-toast/rule-toast.js
import { getStorageInfoPromisify } from "../../api/promisify.js"
import regeneratorRuntime from "../../api/regeneratorRuntime.js"
let app = getApp();
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    currentCircleId: {
      type: Number
    },

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
    closeToast: function() {
      this.triggerEvent("mytoast", "close")
    },

    goPageWithCircleIntroduce: function() {
      this.triggerEvent("mytoast", "navgiteWithClose")

    },
    /**
     * 保存formid
     */
    bindSubmit: async function(e) {
      let {
        formId
      } = e.detail;
      formId && app.data.formID.push(formId);
    }
  }
})