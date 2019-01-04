//app.js
import regeneratorRuntime from "/api/regeneratorRuntime.js"
import {
  loginPromisify,
  setStoragePromisify,
  getStoragePromisify
} from "./api/promisify.js"
import {
  getOpenid,
  sendFromid
} from "./api/request.js"

App({
  data: {
    formID: [],
    receiveData: {}
  },
  onLaunch: function () {
    wx.hideTabBar();
  },
  onShow: async function (options) {
    this.data.receiveData = options.referrerInfo.extraData;
    let code = (await loginPromisify()).code;
    let newcode = (await loginPromisify()).code;
    let result = await getOpenid({
      code: newcode
    });
    if (result.statusCode === 200) {
      let openid = result.data.detail;
      await setStoragePromisify({
        "CODE": code,
        "OPENID": openid,
        "pointStatus": false
      })
    } else {
      throw new Error(`result api statusCode: ${result.statusCode}`)
    }
  },
  onHide: async function () {
    let formId = this.data.formID;
    let {
      OPENID
    } = (await getStoragePromisify("OPENID"));
    let result = formId.length > 0 && await sendFromid({
      formId,
      openId: OPENID
    });
    if (result.statusCode === 201) {
      this.data.formID.splice(0);
    }
  }
})
