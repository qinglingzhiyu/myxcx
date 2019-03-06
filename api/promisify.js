    /**
 * Created by Terris
 * https://github.com/qinglingzhiyu
 *
 * @date: 2018-12-28
 * @flow
 *
 * description: 封装了常用 的微信小程序的api
 *
 */

import regeneratorRuntime from "./regeneratorRuntime.js"

/**
 * defaultProps为默认属性，extraProps为定制化的属性
 * promisify 微信内置函数
 * @param fn
 * @returns { promise }
 */
const promisify = fn => defaultProps => extraProps => new Promise((resolve, reject) => fn({
  ...defaultProps,
  ...extraProps,
  success: res => resolve(res),
  fail: err => reject(err)
}));

/**
 * 登录
 */
const loginPromisify = promisify(wx.login)();

/**
 * 获取系统信息
 */
const getSystemInfoPromisify = promisify(wx.getSystemInfo)();

/**
 *  获取用户的当前设置
 */
const getSettingPromisify = promisify(wx.getSetting)();

/**
 * 设置界面
 */
const openSettingPromisify = promisify(wx.openSetting)();

/**
 * 授权
 */
const authorizePromisify = promisify(wx.authorize)();

/**
 * 页面滚动
 */
const pageScrollToPromisify = promisify(wx.pageScrollTo)();

/**
 * 在当前页面显示导航条加载动画
 * 
 */
const showNavigationBarLoadingPromisify = promisify(wx.showNavigationBarLoading)();

/**
 * 在当前页面隐藏导航条加载动画
 * 
 */
const hideNavigationBarLoadingPromisify = promisify(wx.hideNavigationBarLoading)();

/**
 * 显示消息提示框
 * @param {*} params 
 */
const showToastPromisify = promisify(wx.showToast)({
  title: '',
  icon: "none",
  duration: 1000,
  confirmColor: '#ff673f',
  mask: true
});

/**
 * 显示loading提示框
 * @param {*} params 
 */
const showLoadingPromisify = promisify(wx.showLoading)({
  title: "加载中",
  mask: true
});

/**
 * 隐藏loading提示框
 * @param {*} params 
 */
const hideLoadingPromisify = promisify(wx.showLoading)();

/**
 * 支付
 * @param {*} params 
 */
const payPromisify = promisify(wx.requestPayment)();

/**
 * 模态框
 */
const showModalPromisify = promisify(wx.showModal)({
  title: "提示"
})

/**
 *  获取当前的地理位置
 */
const getLocationPromisify = promisify(wx.getLocation)({
  type: "wgs84",
})
/**
 * 数据请求
 * @param {*} params 
 */
const requestPromisify = promisify(wx.request)({
  header: {
    'Content-Type': 'application/json'
  },
  method: 'GET',
  complete: () => wx.hideLoading()
});

/**
 * 检查是否授权
 * @param {*} params 
 */
const checkSessionPromisify = promisify(wx.checkSession)();

/**
 * 获取本地缓存信息
 * @param {*} params 
 */
const getStorageInfoPromisify = promisify(wx.getStorageInfo)();

/**
 * 选择照片
 * @param {*} params 
 */
const chooseImagePromisify = promisify(wx.chooseImage)();

/**
 *
 * @param 需要往LocalStorage里面存数据
 * @returns {Promise<any[] | never>}
 * setStorage({ a:1, b:2 });
 */
const setStoragePromisify = (param = {}) => {
  if (!Object.keys(param).length) throw new Error('输入的对象不为空');
  return Promise.all(Object.entries(param)
    .map(item => promisify(wx.setStorage)({
      key: item[0],
      data: item[1]
    })()));
};

/**
 *
 * @param 需要从storage 读取的key。
 * 单个值直接传string, 多个值传数组
 * eg. ['key1', 'key2', 'key3'] 或者 'key1' ;
 * @returns {key1: value1, key2: value2, key3: key3 }
 */
const getStoragePromisify = param => Promise.all(
    Object.entries(((typeof param) === 'string') ? [param] : param)
    .map(item => promisify(wx.getStorage)({
        key: item[1]
      })()
      .then(res => ({
        [`${item[1]}`]: res.data
      }))))
  .then(res => res.reduce((prev, curr) => ({ ...prev,
    ...curr
  }), {}));

/**
 * 删除本地缓存
 * @param {*} params 
 */
const removeStoragePromisify = param => Promise.all(
  Object.entries(((typeof param) === 'string') ? [param] : param)
  .map(item => promisify(wx.removeStorage)({
    key: item[1]
  })()));

/**
 * 用法:
 * jumpToPromisify('a'); // navigateTo到a页面
 * jumpToPromisify('a', 'navigate', { m: 'm' }); // navigateTo到a页面 ,路径参数为?m=m
 * jumpToPromisify('a', 'redirect', { m: 'm' }); // redirectTo到a页面 ,路径参数为?m=m
 * jumpToPromisify(1, 'back', { m: 'm' }); // back 上一步 ,路径参数为?m=m
 *
 * @param page 需要跳转的页面或者页面路径(如果是"pages/a/b/b"这样的路径，page='pages/a/b/b', specialUrl=true )
 * @param type
 * @param params
 * @param specialUrl
 * @return {*}
 *
 */
const jumpToPromisify = (page = 'index', type = 'navigate', params = '', specialUrl = false) => {
  const {
    navigateTo,
    redirectTo,
    navigateBack,
    reLaunch,
    switchTab
  } = wx;
  const types = {
    navigate: url => promisify(navigateTo)({
      url
    })(),
    redirect: url => promisify(redirectTo)({
      url
    })(),
    reLaunch: url => promisify(reLaunch)({
      url
    })(),
    switchTab: url => promisify(switchTab)({
      url
    })(),
    back: delta => promisify(navigateBack)({
      delta
    })(),
  };
  params = obj2Url(params);
  if (specialUrl) return types[type](params ? `${page}?${params}` : page);
  // 获取跳转参数，如果为数字，则为navigateBack，反之为 navigateTo 或 navigateBack。
  const jumpPram = (typeof page === 'number') ? page : `/pages/${page}/${page}${params ? `?${params}` : ''}`;
  //console.log(`%c**跳转参数**jumpPram** ${jumpPram}`, 'color:white;background:green');
  return types[type](jumpPram);
}

/**
 * 路径参数的拼接
 * @param {*} params 
 */
const obj2Url = params => {
  if (params instanceof Array || typeof params === 'number') throw new Error('跳转参数限制于string和对象');
  // 如果路径参数为 object, 做以下转换
  if (typeof params === 'object') {
    const rawParams = Object.entries(params).reduce((acc, cur) => {
      if ((!cur[1]) && ((typeof cur[1]) !== 'boolean')) console.warn(`${cur[0]}的值为空， 请检查原因！`);
      return `${acc + cur[0]}=${cur[1]}&`;
    }, '');
    params = rawParams.substr(0, rawParams.length - 1);
  }
  return params;
};

module.exports = {
  payPromisify,
  loginPromisify,
  jumpToPromisify,
  requestPromisify,
  showToastPromisify,
  showModalPromisify,
  setStoragePromisify,
  chooseImagePromisify,
  showLoadingPromisify,
  hideLoadingPromisify,
  checkSessionPromisify,
  getSystemInfoPromisify,
  getStorageInfoPromisify,
  removeStoragePromisify,
  getStoragePromisify,
  getSettingPromisify,
  authorizePromisify,
  getLocationPromisify,
  openSettingPromisify,
  pageScrollToPromisify,
  showNavigationBarLoadingPromisify,
  hideNavigationBarLoadingPromisify
}
