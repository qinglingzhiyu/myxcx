let test = "https://test.daqinjia.cn/";
let release = "https://www.daqinjia.cn/";
let imageUrl = "https://images.daqinjia.cn"; //七牛CDN域名
let change = true; //true 为测试环境  false 为线上环境
module.exports = {
  config: {
    base_circle: `${change ? test : release}hysteria/api/v2/wxcircles/`,
    base_url: `${change ? test : release}hysteria/api/v2/`,
    base_support: `${change ? test : release}hysteria/api/support/`,
    base_match: `${change ? test : release}wx-ls/api/match/`,
    app_down: `${imageUrl}/apk/test-app-release.apk`,
    domain: imageUrl
  }
};