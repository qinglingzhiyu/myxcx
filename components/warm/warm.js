// components/warm/warm.js
import {
  relateapp
} from '../../api/request.js'
import {
  setStoragePromisify,
  showLoadingPromisify,
} from '../../api/promisify.js'
import regeneratorRuntime from '../../api/regeneratorRuntime.js'

const app = getApp();
Component({
  /**
   * 组件的属性列表
   */
  properties: {

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
    closeLogin: function() {
      this.triggerEvent('bindWarm', 'close')
    },
    bindSubmit: async function(e) {
      let {
        formId
      } = e.detail;
      formId && app.data.formID.push(formId);
      let phone = wx.getStorageSync('phone');
      showLoadingPromisify();
      let result = await relateapp({
        type: 1,
        save_type: parseInt(e.detail.value.saveType),
        phone: phone
      })
      if (result.statusCode === 200) {
        let {
          token,
          id
        } = result.data;
        setStoragePromisify({ Token: token, userId:id})
      }
      this.triggerEvent('bindWarm', result.statusCode)
    }
  }
})