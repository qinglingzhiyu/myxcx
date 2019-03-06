/**
 * Created by Terris
 * https://github.com/qinglingzhiyu
 *
 * @date: 2019-01-09
 * @flow
 *
 * description: 这是首页index的逻辑
 *
 */

import {
  jumpToPromisify,
  showToastPromisify,
  showModalPromisify,
  authorizePromisify,
  getSettingPromisify,
  setStoragePromisify,
  getStoragePromisify,
  getLocationPromisify,
  showLoadingPromisify,
  checkSessionPromisify,
  getStorageInfoPromisify,
} from '../../api/promisify.js'
import regeneratorRuntime, {
  async
} from '../../api/regeneratorRuntime.js'
import {
  login,
  selectFeed,
  updateLike,
  indexBanner,
  isJoinCircle,
  updatePersonInfo,
} from '../../api/request.js'
import {
  isAuthor,
  QiniuToken,
  sleep,
  thumbnailByMasterMap,
  MasterMapByThumbnail
} from '../../common/common.js'
import {
  isTestEnvironment
} from '../../api/config';
import allCity from '../../common/allCity';
import QQMapWX from '../../common/qqmap-wx-jssdk';

let qqmapsdk;
const app = getApp()
const tabBar = require('../../template/tabBar-template/tabbar.js')

Page({
  data: {
    bannerList: [],
    selectList: [],
    gender: ['不限', '男', '女'],
    genderIndex: 0,
    provinceIndex: 0,
    isCloseBytoast: false,
    isCloseByMask: false,
    isLocation: false, //打开定位
    currentCircleId: 0, // 当前圈子Id
    currentPage: 1, //当前页
    totalPages: 1, //总页数
    chooseCitySub: '全国', //选择城市 默认是全国
    isContent: true, //是否有动态,默认有
  },

  onLoad: async function () {

    //底部导航false
    let pointStatus = wx.getStorageSync('pointStatus') || false;
    tabBar.tabbarmain('tabBar', 0, this, pointStatus);

    //配置腾讯地图
    qqmapsdk = new QQMapWX({
      key: 'HHXBZ-FJWWX-6TM4D-Z5QLP-BQ62O-MZB6F'
    });

    //从大家来牵线
    let {
      receiveData
    } = app.data;
    if (typeof receiveData !== 'undefined' && receiveData.from === '牵线') {
      let storageInfo = await getStorageInfoPromisify();
      if (storageInfo.keys.includes('userId')) {
        let myUserld = (await getStoragePromisify('userId')).userId //获取本地的userid
        Number(myUserld) === Number(receiveData.userId) && jumpToPromisify('my-edit', 'navigate', {
          userId: receiveData.userId,
          circleId: receiveData.circleId,
          bottomBtn: '编辑信息',
          navTitle: '我的相亲名片'
        });
        Number(myUserld) !== Number(receiveData.userId) && jumpToPromisify('my-edit', 'navigate', {
          userId: receiveData.userId,
          circleId: receiveData.circleId,
          shareId: receiveData.lineShareid,
          bottomBtn: '留言',
          navTitle: 'TA的信息'
        });
      } else {
        jumpToPromisify('my-edit', 'navigate', {
          userId: receiveData.userId,
          circleId: receiveData.circleId,
          shareId: receiveData.lineShareid,
          bottomBtn: '留言',
          navTitle: 'TA的信息'
        });
      };

      //如果从牵线小程序过来则缓存lineShareid
      receiveData.lineShareid && await setStoragePromisify({
        'lineShareid': receiveData.lineShareid
      });
      receiveData.from = '';
      return
    }
    wx.hideShareMenu(); //取消顶部分享
  },

  onReady: async function () {
    //获取banner
    let banner = await this.bannerDataByRequest();
    this.setData({
      bannerList: banner
    });
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes('SEX') && storageInfo.keys.includes('SELECTED_CITY')) {
      let {
        SELECTED_CITY,
        SEX
      } = await getStoragePromisify(['SELECTED_CITY', 'SEX']);
      this.setData({
        chooseCitySub: SELECTED_CITY.city.length > 4 ? SELECTED_CITY.city.slice(0, 4) + '...' : SELECTED_CITY.city,
        chooseCity: SELECTED_CITY.city
      });
      //第一次精选动态请求
      let {
        totalPages,
        currentPage
      } = await this.getTotalPagesAndCurrentPages({
        sex: SEX,
        city: SELECTED_CITY.adcode
      });
      if (totalPages === 0) {
        this.setData({
          isContent: false,
        });
        return
      }
      //第二次精选动态请求
      let select = await this.getSelectList({
        sex: SEX,
        city: SELECTED_CITY.adcode,
        page: currentPage
      });
      this.setData({
        totalPages,
        currentPage,
        isContent: true,
        firstPage: currentPage,
        selectList: select.results,
      });

    } else {
      let result = await getSettingPromisify();
      if (result.authSetting['scope.userLocation']) {
        isTestEnvironment && showModalPromisify({
          title: '错误提示',
          content: JSON.stringify(result)
        })
      } else {
        try {
          let authorize = await authorizePromisify({
            scope: 'scope.userLocation'
          });
          let {
            latitude,
            longitude
          } = authorize.errMsg === 'authorize:ok' && await getLocationPromisify();
          latitude && longitude && this.getCityNameAndCode(latitude, longitude)
        } catch (error) {

          // 第一次精选动态请求
          let {
            totalPages,
            currentPage
          } = await this.getTotalPagesAndCurrentPages({
            sex: '',
            city: '',
          });
          //第二次精选动态请求
          let select = await this.getSelectList({
            sex: '',
            city: '',
            page: currentPage
          });
          setStoragePromisify({
            'SEX': '',
            'SELECTED_CITY': {
              adcode: '',
              city: '全国'
            },
          });
          this.setData({
            totalPages,
            currentPage,
            firstPage: currentPage,
            selectList: select.results,
          })
        }
      }
    }
  },

  /**
   * 获取城市name和code
   * @param {*} latitude 经度
   * @param {*} longitude 纬度
   */
  getCityNameAndCode: function (latitude, longitude) {
  let _this = this;
    qqmapsdk.reverseGeocoder({
      location: {
        latitude,
        longitude
      },
      success: async function (res) {
        let {
          adcode
        } = res.result.ad_info;
        let adcodeSub = adcode.slice(0, 4);
        let city = _this.getCityByCode(adcodeSub) //通过code获取城市
        _this.setData({
          chooseCitySub: city.length > 4 ? city.slice(0, 4) + '...' : city,
        })
        //第一次精选动态请求
        let {
          totalPages,
          currentPage
        } = await _this.getTotalPagesAndCurrentPages({
          sex: '',
          city: adcodeSub,
        });

        let select = await _this.getSelectList({
          sex: '',
          city: adcodeSub,
          page: currentPage
        });
        _this.setData({
          totalPages,
          currentPage,
          firstPage: currentPage,
          selectList: select.results,
          chooseCity: city
        })
        let selectedCity = {
          adcode: adcodeSub,
          city,
        }
        setStoragePromisify({
          'SELECTED_CITY': selectedCity,
          'SEX': ''
        })
      },
      fail: async function () {
        showToastPromisify({
          title: '获取位置失败请重试'
        })
      },
    });
  },

  /**
   * 通过code获取city
   * @param {String} code 
   */
  getCityByCode: function (code) {
    let city;
    allCity.map((item) => {
      item.sub.map((item1) => {
        if (Number(code) === item1.value) {
          city = item1.label;
          return
        }
      })
    })
    return city
  },

  /**
   * 点击城市
   */
  selectCity: function () {
    this.setData({
      isLocation: true,
    })
  },

  /**
   *  首页banner
   */
  bannerDataByRequest: async function () {
    try {
      let banner = await indexBanner();
      if (banner.statusCode === 200) {
        return banner.data
      } else {
        throw new Error(`statusCode of indexBanner is ${banner.statusCode}`)
      }
    } catch (error) {
      isTestEnvironment && showModalPromisify({
        title: '错误提示',
        content: String(error)
      })
    }
  },

  /**
   * 获取总页数和当前页
   * @param {*} param 
   * 
   */
  getTotalPagesAndCurrentPages: async function (param) {
    let firstSelect = await this.getPageByRequest({
      ...param
    })
    let totalPages = Math.ceil(firstSelect.count / 5); //获取总页数
    let currentPage = Math.floor(1 + Math.random() * (totalPages - 1)); //获取当前页
    return {
      totalPages,
      currentPage
    }
  },

  /**
   * 选择性别
   * @param {*} e 
   */
  genderChange: async function (e) {
    let {
      value
    } = e.detail;
    this.setData({
      genderIndex: value,
      currentPage: 1
    });
    let sex = e.detail.value == '0' ? '' : e.detail.value;
    let city;
    setStoragePromisify({
      'SEX': sex
    });
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes('SELECTED_CITY')) {
      let {
        SELECTED_CITY,
      } = await getStoragePromisify('SELECTED_CITY');
      city = SELECTED_CITY.adcode;
    }

    //第一次精选动态请求
    let {
      totalPages,
      currentPage
    } = await this.getTotalPagesAndCurrentPages({
      sex,
      city
    });
    if (totalPages === 0) {
      this.setData({
        isContent: false,
      });
      return
    }

    //第二次请求
    let select = await this.getSelectList({
      sex,
      city,
      page: currentPage
    });
    this.setData({
      isContent: true,
      totalPages,
      currentPage,
      firstPage: currentPage, //记录第一次当前页
      selectList: select.results
    })
  },

  /**
   * 选择城市
   */
  onSelectedLocation: async function (e) {
    let {
      selectedCity,
      type
    } = e.detail;
    await setStoragePromisify({
      'SELECTED_CITY': selectedCity
    })
    if (type === 'close') {
      this.setData({
        isLocation: false,
      });
      return
    }
    this.setData({
      chooseCitySub: selectedCity.city.length > 4 ? selectedCity.city.slice(0, 4) + '...' : selectedCity.city,
      chooseCity: selectedCity.city,
    })
    try {
      let storageInfo = await getStorageInfoPromisify();
      if (storageInfo.keys.includes('SEX')) {
        let {
          SEX
        } = await getStoragePromisify('SEX');
        //第一次精选动态请求
        let {
          totalPages,
          currentPage
        } = await this.getTotalPagesAndCurrentPages({
          sex: SEX,
          city: selectedCity.adcode
        });
       
        if (totalPages === 0) {
          this.setData({
            isContent: false,
            isLocation: false,
            isCloseByMask: false,
          });
          return
        }
        //第二次精选动态请求
        let select = await this.getSelectList({
          sex: SEX,
          city: selectedCity.adcode,
          page: currentPage
        });
        console.log('selectedCity: ', selectedCity);
        this.setData({
          totalPages,
          currentPage,
          isLocation: false,
          isContent: true,
          isCloseByMask: false,
          firstPage: currentPage, //记录第一次当前页
          selectList: select.results
        });

        //更新个人资料
        if (storageInfo.keys.includes('Token') && storageInfo.keys.includes('userId')) {
          let {
            userId
          } = await getStoragePromisify('userId');
          let info = {};
          selectedCity.adcode && (info = {
            location: selectedCity.adcode + '00'
          });
          !selectedCity.adcode && (info = {
            location: '110100,120100,310100,500100'
          });
          await updatePersonInfo({
            userId,
            info
          });
        }
      }
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        title: "错误提示",
        content: JSON.stringify(error)
      })
    }
  },

  /**
   * @description: 第一次请求 获取总页数和当前页
   * @param {type} param
   * @return: select.data
   */  
  getPageByRequest:async function (param) {
    try {
      let select = await selectFeed({
        ...param
      });
      if (typeof select === 'undefined' || !select) throw new Error(`selectFeed api is ${select} and param:${String(param)}`);
      if (select.statusCode === 200) {
        return select.data
      }
    } catch (error) {
      
    }
  },

  /**
   * 获取精选圈子列表
   */
  getSelectList: async function (param) {
    showLoadingPromisify()
    try {
      let select = await selectFeed({
        ...param
      });
      if (typeof select === 'undefined' || !select) throw new Error(`selectFeed api is ${select} and param:${String(param)}`)
      if (select.statusCode === 200) {
        select.data.results.map(item => {
          item['avatar'] = MasterMapByThumbnail(item.avatar, 100); //压缩头像
          let images = MasterMapByThumbnail(item.images.split(',').filter(Boolean), 264) //压缩照片
          item['images'] = images.slice(0, 9)
          item.comment.map(item2 => {
            item2['user_id_avatar'] = MasterMapByThumbnail(item2.user_id_avatar, 60)
            item2['circle_id'] = item.circle_id
          })
          if (item.content.gblen() >= 160) {
            item['isOverflow'] = true
            item['isOpen'] = true
          } else {
            item['isOverflow'] = false;
            item['isOpen'] = false
          };
        });
        return select.data
      }
    } catch (error) {

    }
  },

  /**
   * 上拉刷新
   */
  onReachBottom: async function () {
    let {
      currentPage,
      totalPages,
      firstPage
    } = this.data;
    if (totalPages === currentPage) currentPage = 0; //如果上一页最后一页 则请求第一页
    if (currentPage + 1 === firstPage) {
      showToastPromisify({
        title: '暂无更多动态哦!'
      })
      return
    }
    currentPage += 1;
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes('SELECTED_CITY') && storageInfo.keys.includes('SEX')) {
      let {
        SELECTED_CITY,
        SEX
      } = await getStoragePromisify(['SELECTED_CITY', 'SEX']);
      let selectList = this.data.selectList;
      let select = await this.getSelectList({
        city: SELECTED_CITY.adcode,
        sex: SEX,
        page: currentPage
      });
      select && select.results.map(item => {
        selectList.push(item);
      });
      this.setData({
        selectList,
        currentPage
      });
    }
  },

  /**
   *是否授权
   */
  getUseInfo: async function (info) {
    if (info.detail.errMsg === 'getUserInfo:fail auth deny') return
    let {
      nickName
    } = info.detail.userInfo;
    setStoragePromisify({
      'NICKNAME': nickName
    })
    let {
      cometo,
      circleid,
      navtitle,
      index,
      feedid,
      commentto
    } = info.currentTarget.dataset;
    let authorStatus = await isAuthor({
      encryptedData: info.detail.encryptedData,
      iv: info.detail.iv
    });
    if (authorStatus.statusCode === 'isOk' || authorStatus.statusCode === 200) {
      if (cometo === 'location') {
        if (typeof circleid === 'undefined' || !circleid) throw new Error(`circleid is ${circleid}`);
        if (typeof navtitle === 'undefined' || !navtitle) throw new Error(`navtitle is ${navtitle}`);
        circleid && navtitle && this.goPageWithCircleDynamic({
          circleid,
          navtitle,
        });
      } else if (cometo === 'interest') {
        if (typeof index === 'undefined') throw new Error(`index is ${index}`);
        if (typeof feedid === 'undefined' || !feedid) throw new Error(`feedid is ${feedid}`);
        index !== 'undefined' && feedid && this.onInterest({
          index,
          feedid
        });
      } 
    } else {
      showToastPromisify({
        title: '账号异常,返回首页',
        image: '/images/icon/fail.png'
      })
      await sleep(2000)
      jumpToPromisify('index', 'reLaunch')
    }
    if (authorStatus.statusCode === 200) QiniuToken();
  },

  /**
   * 点击来自xxxx后跳转圈子动态
   * 如果加入圈子则跳转到圈子动态
   * 如果未加入圈子则弹出入圈规则
   */
  goPageWithCircleDynamic: async function (param) {
    let {
      circleid,
      navtitle
    } = param;
    let result = await isJoinCircle({
      circle_id: circleid
    });
    if (!result) throw new Error(`isJoinCircle api is ${result}`);
    if (result.statusCode === 200) {
      if (result.data.joined) jumpToPromisify('circle-dynamic', 'navigate', {
        navTitle: navtitle,
        circleId: circleid
      });
      else this.setData({
        currentCircleId: circleid,
        isCloseByMask: true,
        isCloseBytoast: true,
      }), setStoragePromisify({
        'jump': 'circleDynamic'
      });
    } else new Error(`isJoinCircle api statusCode:${result.statusCode}`), showToastPromisify({
      title: '网络错误,请重试!'
    })
  },

  /**
   * 点击感兴趣操作
   */
  onInterest: async function (param) {
    let {
      index,
      feedid
    } = param
    let {
      selectList
    } = this.data;
    selectList[index].isInterest = true;
    selectList[index].like += 1;
    showLoadingPromisify({
      title: '操作中'
    })
    showLoadingPromisify();
    let result = await updateLike({
      feed_id: feedid
    });
    if (!result) throw new Error(`updateLike api is ${result}`);
    if (result.statusCode === 200) {
      showToastPromisify({
        title: '点赞成功',
        icon: 'success',
      });
      this.setData({
        selectList
      });
    } else throw new Error(`updateLike api statusCode:${result.statusCode}`), showToastPromisify({
      title: '点赞失败',
      icon: 'fail',
    });
  },

  /**
   * 关闭toast
   */
  closeTosat: function (e) {
    e.detail === 'close' && this.setData({
      isCloseByMask: false,
      isCloseBytoast: false
    })
  },

  /**
   * 关闭toast 并跳转圈子规则
   */
  mytoast: function (e) {
    let circleId = this.data.currentCircleId;
    e.detail === 'close' && this.setData({
      isCloseByMask: false,
      isCloseBytoast: false
    });
    e.detail === 'navgiteWithClose' && jumpToPromisify('circle-introduce', 'navigate', {
      circleId
    }), this.setData({
      isCloseByMask: false,
      isCloseBytoast: false
    });
  },

  /**
   * 控制查看全文
   */
  openContent: function (e) {
    let {
      index
    } = e.currentTarget.dataset;
    let {
      selectList
    } = this.data;
    selectList.map((item, i) => {
      index === i && (item['isOpen'] = !item.isOpen)
    });
    this.setData({
      selectList
    });
  },

  /**
   * 保存formid
   */
  bindSubmit: async function (e) {
    let {
      formId
    } = e.detail;
    formId && app.data.formID.push(formId);
  },
  /**
   * 跳转TA的信息页
   */
  goPageWithMyEdit: async function (e) {
    let {
      userid,
      circleid
    } = e.currentTarget.dataset;
    let storageInfo = await getStorageInfoPromisify();

    if (storageInfo.keys.includes('userId')) {
      let myUserId = (await getStoragePromisify('userId')).userId;
      Number(userid) !== Number(myUserId) && jumpToPromisify('my-edit', 'navigate', {
        navTitle: 'TA的信息',
        bottomBtn: '留言',
        userId: userid,
        circleId: circleid
      });
      Number(userid) === Number(myUserId) && jumpToPromisify('my-edit', 'navigate', {
        navTitle: '我的相亲名片',
        bottomBtn: '编辑信息',
        userId: userid,
        circleId: circleid
      })
    } else jumpToPromisify('my-edit', 'navigate', {
      navTitle: 'TA的信息',
      bottomBtn: '留言',
      userId: userid,
      circleId: circleid
    });
  },

  /**
   * 跳转动态详情页
   */
  goPageWithDynamicDetail: function (e) {
    let {
      selectfeedid,
      feedid
    } = e.currentTarget.dataset;
    jumpToPromisify('dynamic-detail', 'navigate', {
      selectFeedId: selectfeedid,
      feedId: feedid,
      fromTo: 'index'
    })
  },

  /**
   * 跳转不带授权页面
   */
  goOtherPages: function (e) {
    e.currentTarget.dataset.url == 'circle' && jumpToPromisify(e.currentTarget.dataset.url, 'reLaunch');
  },

  /**
   * 跳转带授权的页面
   */
  goOtherPagesWithAuthor: async function (info) {
    if (info.detail.errMsg === 'getUserInfo:fail auth deny') return;
    let {
      nickName
    } = info.detail.userInfo;
    setStoragePromisify({
      'NICKNAME': nickName
    })
    let storageInfo = await getStorageInfoPromisify();
    if (!storageInfo.keys.includes('Token')) {
      let sessionStatus = await checkSessionPromisify();
      let result = sessionStatus.errMsg === 'checkSession:ok' && await login({
        encryptedData: info.detail.encryptedData,
        iv: info.detail.iv
      });
      result.data && await setStoragePromisify({
        'Token': result.data.token,
        'userId': result.data.id
      });

      //登录过后把选更新用户信息location
      let userId = result.data.id
      let cityInfo = {};
      let {
        SELECTED_CITY
      } = await getStoragePromisify('SELECTED_CITY')
      SELECTED_CITY.adcode && (cityInfo = {
        location: SELECTED_CITY.adcode + '00'
      });
      !SELECTED_CITY.adcode && (cityInfo = {
        location: '110100,120100,310100,500100'
      });
      updatePersonInfo({
        userId,
        info: cityInfo
      });
      QiniuToken();
      info.detail.errMsg === 'getUserInfo:ok' && jumpToPromisify(info.currentTarget.dataset.url, 'reLaunch')
    } else jumpToPromisify(info.currentTarget.dataset.url, 'reLaunch')
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (e) {
    let {
      feedid,
      img,
      sex,
      selectfeedid
    } = e.target.dataset;
    if (e.from === 'button') {
      let title = '';
      sex === '男' && (title = '快来看看这家孩子适不适合你家小美女？我亲自挑的!');
      sex === '女' && (title = '快来看看这家孩子适不适合你家帅哥？我亲自挑的!')
      return {
        title: title,
        path: `/pages/dynamic-detail/dynamic-detail?selectFeedId=${selectfeedid}&feedId=${feedid}`,
        imageUrl: img.split('?')[0]
      }
    }
  },

  /**
   * 预览图片
   */
  goPreview: function (e) {
    let {
      selectList
    } = this.data;
    let {
      index,
      photoindex
    } = e.currentTarget.dataset;
    let imgs = thumbnailByMasterMap(selectList[index].images)
    wx.previewImage({
      urls: imgs,
      current: imgs[photoindex]
    })
  },

  /**
   * 关闭蒙层
   */
  closeMask: function (e) {
    e.detail === 'close' && this.setData({
      isCloseBytoast: false,
      isCloseByMask: false,
      // isComment: false,
      isLocation: false
    })
  },

  /**
   * 顶部link跳转
   * banner_type 0: 小程序, 1: appid, 2: 微信公众号
   */
  goLink: async function (e) {
    let {
      index
    } = e.currentTarget.dataset;
    let {
      bannerList
    } = this.data;
    let {
      banner_type,
      link
    } = bannerList[index];
    if (banner_type === 0) {
      wx.navigateTo({
        url: link,
      })
    } else if (banner_type === 1) {
      wx.navigateToMiniProgram({
        appId: link,
      });
    } else if (banner_type === 2) {
      setStoragePromisify({
        link
      })
      await sleep(500);
      jumpToPromisify('web')
    }
  },

  /** 
   * 阻止冒泡 
   */
  notTouched: function () {},

})
