/**
 * Created by Terris
 * https://github.com/qinglingzhiyu
 *
 * @date: 2019-01-08
 * @flow
 * description: 这是请求的配置
 *
 */

let test = "https://test.daqinjia.cn/";
let release = "https://www.daqinjia.cn/";
let imageUrl = "https://images.daqinjia.cn"; //七牛CDN域名
let isTestEnvironment = true; //true 为测试环境  false 为线上环境
let config = {
  base_circle: `${isTestEnvironment ? test : release}hysteria/api/v2/wxcircles/`,
  base_url: `${isTestEnvironment ? test : release}hysteria/api/v2/`,
  base_support: `${isTestEnvironment ? test : release}hysteria/api/support/`,
  base_match: `${isTestEnvironment ? test : release}wx-ls/api/match/`,
  domain: imageUrl
}
module.exports = {
  config,
  isTestEnvironment
};
