/**
 * Created by Terris
 * https://github.com/qinglingzhiyu
 *
 * @date: 2018-12-28
 * @flow
 *
 * description: 这是公共文件
 *
 */

import regeneratorRuntime from "../api/regeneratorRuntime.js"
import {
  host
} from "./const.js"
import {
  getStorageInfoPromisify,
  getStoragePromisify,
  checkSessionPromisify,
  setStoragePromisify,
  showLoadingPromisify
} from "../api/promisify.js"
import {
  login,
  getQiNiuTokenWithToken,
  updatePersonInfo
} from "../api/request.js"
import md5 from "../common/md5.js"
module.exports = {

  /**
   * 判断是否登录
   */
  isAuthor: async (param) => {
    let storageInfo = await getStorageInfoPromisify();
    if (!storageInfo.keys.includes("Token")) {
      showLoadingPromisify();
      let sessionStatus = await checkSessionPromisify();
      let result = sessionStatus.errMsg === "checkSession:ok" && await login({
        ...param
      })
      result.data.token && await setStoragePromisify({
        "Token": result.data.token,
        "userId": result.data.id
      })
      //登录过后把选更新用户信息location
      let userId = result.data.id
      let info = {};
      let {
        SELECTED_CITY
      } = await getStoragePromisify('SELECTED_CITY')
      SELECTED_CITY.adcode && (info = {
        location: SELECTED_CITY.adcode + '00'
      });
      !SELECTED_CITY.adcode && (info = {
        location: '110100,120100,310100,500100'
      });
      updatePersonInfo({
        userId,
        info
      });
      return result
    } else {
      return {
        statusCode: "isOk"
      }
    }
  },

  /**
   * 居住地转换
   * @param {Number} param 
   * @returns result
   */
  occupationByNumber: (param) => {
    let result;
    host.map(item => {
      item.sub.map(item2 => {
        if (item2.value === param) {
          result = `${item.label}-${item2.label}`
          return
        }
      })
    })

    return result
  },

  /**
   * 授权后本地保存七牛云token
   */
  QiniuToken: async () => {
    let storageInfo = await getStorageInfoPromisify();
    if (!storageInfo.keys.includes("qiniuToken")) {
      let qiniuToken = await getQiNiuTokenWithToken();
      setStoragePromisify({
        "qiniuToken": qiniuToken.data.token,
      })
    }
  },

  /**
   * 倒计时
   */
  countDown: function (time) {
    let timestamp = new Date(time).getTime() - new Date().getTime();
    let allSecond = parseInt(timestamp / 1000);
    let newTime = [];
    allSecond -= 1;
    if (allSecond > 0) {
      let hour = Math.floor(allSecond / 3600);
      let minute = Math.floor(allSecond / 60) % 60;
      let second = allSecond % 60;
      newTime[0] = hour >= 10 ? String(hour) : "0" + hour;
      newTime[1] = minute >= 10 ? String(minute) : "0" + minute;
      newTime[2] = second >= 10 ? String(second) : "0" + second;
      return newTime.join(":")
    } else {
      return "time out"
    }
  },

  /**
   * 签名
   */
  signPay: (data) => {
    let {
      appid,
      nonce_str,
      prepay_id,
      timeStamp
    } = data;
    let result = `appId=${appid}&nonceStr=${nonce_str}&package=prepay_id=${prepay_id}&signType=MD5&timeStamp=${timeStamp}&key=JbXAzDijmbdSUf87l3gz6fpf5NQQVgck`
    return md5.hex_md5(result);
  },

  /**
   * 时间转换
   */
  timeCycle: function (e) {
    let DATE = new Date();
    let Y = DATE.getFullYear(); //年
    let M = (DATE.getMonth() + 1 < 10 ? '0' + (DATE.getMonth() + 1) : DATE.getMonth() + 1); //月
    let D = DATE.getDate() < 10 ? '0' + DATE.getDate() : DATE.getDate(); //日
    // var h = DATE.getHours(); //时
    // var m = DATE.getMinutes();  //分
    // var s = DATE.getSeconds();  //秒
    let newDate;
    let newTime;
    let b = e.split(" ");
    let date = b[0].split("/").join("");
    let time = b[1].split(":", 2).join("");
    let nowDate = "" + Y + M + D;
    if (Number(nowDate) - Number(date) >= 2) newDate = `${b[0].split("/")[1]}月 ${b[0].split("/")[2]}日`;
    else if (Number(nowDate) - Number(date) === 1) newDate = "昨天";
    else newDate = "";
    if (Number(time) >= 0 && Number(time) <= 559) newTime = "凌晨" + b[1].slice(0, 5);
    else if (Number(time) > 559 && Number(time) <= 1159) newTime = "上午" + b[1].slice(0, 5);
    else if (Number(time) > 1159 && Number(time) <= 1259) newTime = "中午" + b[1].slice(0, 5);
    else if (Number(time) > 1259 && Number(time) <= 1759) newTime = "下午" + b[1].slice(0, 5);
    else if (Number(time) > 1759 && Number(time) <= 2359) newTime = "晚上" + b[1].slice(0, 5);
    return `${newDate} ${newTime}`
  },


  /**
   * sleep()
   * @param {*} ms
   */
  sleep: (ms) => {
    return new Promise(resolve => {
      return setTimeout(resolve, ms)
    })
  },

  /**
   * 排序-正序
   */
  compareBySequence: property => {
    return (a, b) => {
      let value1 = a[property];
      let value2 = b[property];
      return value1 - value2;
    }
  },

  /**
   * 排序-反序
   */
  compareByAntitone: property => {
    return (a, b) => {
      let value1 = a[property];
      let value2 = b[property];
      return value2 - value1
    }
  },


  /**
   * 判读是否是空格
   * @param {String} str 
   */
  isNull: (str) => {
    if (str == "") return true;
    var regu = "^[ ]+$";
    var re = new RegExp(regu);
    return re.test(str);
  },

  /**
   * 大叔组转换为小数组
   * @param {*} arr  大数组
   * @param {*} size  小数组的长度
   */
  chunk: (arr, size) =>
    Array.from({
        length: Math.ceil(arr.length / size)
      }, (v, i) =>
      arr.slice(i * size, i * size + size)
    ),

  /**
   * 缩略图转原图
   * @param {[Array,String]} images 缩略图
   */
  thumbnailByMasterMap: (images) => {
    if (images.constructor === String) {
      return `${images.split('?')[0]}`
    } else if (images instanceof Array) {
      let imgs = [];
      images.map((item) => {
        imgs.push(item.split('?')[0])
      })
      return imgs
    }
  },

  /**
   * 原图转换缩略图
   * @param {[Array,String]} images //原图
   * @param {Number} size 转为缩略图尺寸
   */
  MasterMapByThumbnail: (images, size) => {
    if (images.constructor === String) {
      if (/[?]/.test(images)) return `${images.split('?')[0]}?imageView2/0/w/${size}/h/${size}`
      else return `${images}?imageView2/0/w/${size}/h/${size}`
    } else if (images instanceof Array) {
      let imgs = [];
      images.map((item) => {
        if (/[?]/.test(item)) {
          imgs.push(`${item.split('?')[0]}?imageView2/0/w/${size}/h/${size}`)
        } else {
          imgs.push(`${item}?imageView2/0/w/${size}/h/${size}`)
        }
      });
      return imgs
    }
  },

  /**
   * 防抖函数
   * @param method 事件触发的操作
   * @param delay 多少毫秒内连续触发事件，不会执行
   * @returns {Function}
   */
  debounce: function (method, delay) {
    let timer = null;
    return function () {
      let self = this,
        args = arguments;
      timer && clearTimeout(timer);
      timer = setTimeout(function () {
        method.apply(self, args);
      }, delay);
    }
  }
}
