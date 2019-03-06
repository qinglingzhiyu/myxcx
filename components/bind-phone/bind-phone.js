// components/bind-phone/bind-phone.js
///
import regeneratorRuntime from '../../api/regeneratorRuntime.js'
import {
  expPhone
} from '../../common/const.js';
import {
  showToastPromisify,
  setStoragePromisify,
  showLoadingPromisify,
  getStorageInfoPromisify
} from '../../api/promisify.js';
import {
  verifycode,
  relateapp,
  selectFeed
} from '../../api/request.js'

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
    disabled: true,
    verContent: '获取验证码',
    verStyle: '',
    phone: '',
    affirmDisabled: true,
    affirmStyle: '',
    isCounting: false,
    timer: '',
    countDownNum: '60',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // onBlurUser: function(e) {
    //   var _this = this;
    //   if(_this.data.isCounting) {
    //     return;
    //   }

    //   let val = e.detail.value;
    //   val && !expPhone.test(Number(val)) && showToastPromisify({
    //     title: '手机号格式有误',
    //     image: '/images/icon/fail.png'
    //   }), _this.setData({
    //     verStyle: '',
    //     disabled: true
    //   })
    //   val && expPhone.test(Number(val)) && _this.setData({
    //     verStyle: 'color:#fff;background-color:#FF5050',
    //     disabled: false,
    //     phone: e.detail.value
    //   })
    // },

    closeLogin: function() {
      this.triggerEvent('bindPhone', 'close')
    },

    verExp: async function() {
      let _this = this;
      let res = await verifycode({
        phone: _this.data.phone
      })
      res.statusCode !== 201 && showToastPromisify({
        title: '请输入正确的验证码'
      })
      res.statusCode === 201 && _this.countDown()
    },
    /**
     * 倒计时
     */
    countDown: function() {
      let _this = this;
      let countDownNum = _this.data.countDownNum
      _this.setData({
        verContent: countDownNum + ' s',
        disabled: true,
        verStyle: '',
      })
      _this.setData({
        timer: setInterval(() => {
          countDownNum--;
          _this.setData({
            countDownNum: countDownNum,
            verContent: countDownNum + ' s',
            isCounting: true,
          })

          if(countDownNum == 0) {
            _this.clearCountDown()
          }
        }, 1000)
      })
    },

    /**
     * 清除倒计时
     */
    clearCountDown: function() {
      let that = this
      clearInterval(that.data.timer)
      that.setData({
        verContent: '重新获取',
        disabled: false,
        verStyle: 'color:#fff;background-color:#FF5050',
        countDownNum: '60',
        isCounting: false,
      })
    },

    /**
     * 验证码验证
     */
    // onBlurVerify: function(e) {
    //   let _this = this;
    //   let val = e.detail.value;
    //   val && val.length !== 4 && showToastPromisify({
    //     title: '验证码错误',
    //     image: '/images/icon/fail.png'
    //   }), _this.setData({
    //     affirmDisabled: true,
    //     affirmStyle: ''
    //   })
    //   val && val.length === 4 && _this.setData({
    //     affirmDisabled: false,
    //     affirmStyle: 'background-color:#EB4639;color:#fff'
    //   })
    // },


    /**
     * 提交
     */
    bindSubmit: async function(e) {
      let _this = this;
      let {
        formId
      } = e.detail;
      formId && app.data.formID.push(formId);
      showLoadingPromisify()
      let result = await relateapp({
        type: 0,
        phone: e.detail.value.user,
        code: e.detail.value.verify
      })
      setStoragePromisify({
        'phone': e.detail.value.user
      })
      _this.triggerEvent('bindPhone', result.data)
    },

    validatePhone: function(e) {
      let that = this
      if(that.data.isCounting) {
        return;
      }
      
      let phonereg=/^[1][3,4,5,7,8][0-9]{9}$/;
      let val = e.detail.value;
      let isvalid = phonereg.test(val);
      this.setData({
        disabled: !isvalid,
        phone: val,
        verStyle: isvalid ? 'color:#fff;background-color:#FF5050' : ''
      })
    },

    validateCode: function(e){
      let that = this
      let val = e.detail.value
      let codereg = /^\d{4}$/
      let phonereg = /^[1][3,4,5,7,8][0-9]{9}$/

      if(val && codereg.test(val) && phonereg.test(that.data.phone)) {
        that.setData({
          affirmDisabled: false,
          affirmStyle: 'background-color:#EB4639;color:#fff'
        })
      } else {
        that.setData({
          affirmDisabled: true,
          affirmStyle: '',
        })
      }
    },
  }
})
