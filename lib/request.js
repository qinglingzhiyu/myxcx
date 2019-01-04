 var e = require("Promisify.js");
 var o = require("config.js");

 var n = {
    common: {

    },
    yewu: {

    }

};
var appid = wx.getAccountInfoSync().miniProgram.appId //获取appid
module.exports = {
    login:function (arg) {
      return e.getStoragePromisify({key:"CODE"}).then(ee =>{
        return (0,e.requestPromisify)({
          url: o.config.base_circle + "/login/",
          method: "POST",
          data: {
            code: ee.data,
            appId: appid,
            encryptedData: arg.encryptedData,
            iv: arg.iv,
          },
          header: {
            Accept: "application/json"
          }
        })
      })
    }
  
}