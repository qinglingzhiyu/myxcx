/**
 * Created by Terris
 * https://github.com/qinglingzhiyu
 *
 * @date: 2019-01-11
 * @flow
 *
 * description: 这是定位组件的逻辑
 *
 */
import allCity from '../../common/allCity';
import regeneratorRuntime, {
  async
} from '../../api/regeneratorRuntime';
import {
  getSettingPromisify,
  openSettingPromisify,
  getLocationPromisify,
  showModalPromisify,
  showToastPromisify
} from '../../api/promisify';
import {
  isTestEnvironment
} from '../../api/config';
import QQMapWX from '../../common/qqmap-wx-jssdk';
import {
  sleep
} from '../../common/common';

let qqmapsdk;

Component({

  /**
   * 组件的属性列表
   */
  properties: {
    chooseCity: {
      type: String,
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    ifLocal: '',
    allCity,
    onChinese: '',
    localColor: true,
    defaultText: '',
    isDefaultStatus: false, //是否获取定位状态
    animatedType: 'slideInRight', //动画初始状态
  },

  /**
   * 组件的生命周期
   */
  lifetimes: {

    /**
     * 在组件实例刚刚被创建时执行
     */
    created: function () {
      qqmapsdk = new QQMapWX({
        key: 'HHXBZ-FJWWX-6TM4D-Z5QLP-BQ62O-MZB6F'
      });
    },

    /**
     * 在组件实例进入页面节点树时执行
     */
    attached: async function () { },

    /**
     * 在组件在视图层布局完成后执行
     */
    ready: async function () {
      let _this = this;
      let {
        allCity,
        chooseCity
      } = _this.data;
      let getCity = _this.getAllCity(allCity); //获取新的所有城市
      let locationStatus = await _this.getUserLocationStatus(); //获取定位状态
      if (locationStatus) _this.setData({
        isDefaultStatus: false,
        allCity: getCity,
        ifLocal: chooseCity
      });
      else _this.setData({
        isDefaultStatus: true,
        allCity: getCity,
        defaultText: '点击获取当前定位'
      })
    },

    /**
     * 在组件实例被从页面节点树移除时执行
     */
    detached: function () {  }
  },

  /**
   * 组件的方法列表
   */
  methods: {

    //点击定位
    onChooseCity: async function () {
      let _this = this;
      await openSettingPromisify();
      await sleep(1500)
      let {
        latitude,
        longitude
      } = await getLocationPromisify();
      if (typeof latitude === 'undefined') throw new Error(`latitude is ${latitude}`);
      if (typeof longitude === 'undefined') throw new Error(`longitude is ${longitude}`);
      _this.getCityNameAndCode(latitude, longitude)
    },

    //点击标题
    clickProv: function (e) {
      let {
        index
      } = e.currentTarget.dataset;
      let {
        allCity
      } = this.data;
      allCity.map((item, i) => {
        if (index === i) {
          if (item.isShowWithChild) item.isShowWithChild = false, item.img = '/images/icon/down.png'
          else item.isShowWithChild = true, item.img = '/images/icon/up.png'
        } else item.isShowWithChild = false, item.img = '/images/icon/down.png'
      });
      this.setData({
        allCity
      })
    },

    //点击城市
    cityOne:async function (e) {
      let {
        index,
        subindex,
        city,
        adcode
      } = e.currentTarget.dataset;
      let {
        allCity
      } = this.data;
      allCity.map((item0, i0) => {
        if (index === i0) {
          item0.sub.map((item, i) => {
            if (subindex === i) {
              item['on'] = 'on'
            } else item['on'] = ''
          })
        } else {
          item0.sub.map((item) => {
            item['on'] = ''
          })
        }
      })
      this.setData({
        allCity,
        onChinese: '',
        animatedType: 'slideOutRight'
      });
      let selectedCity = {
        adcode,
        city,
      }
      await sleep(500);
      this.triggerEvent('myLocation', {
        selectedCity,
      })

    },

    /**
     * 获取新的城市
     * @param {*} allCity 
     */
    getAllCity: function (allCity) {
      allCity.map(item => {
        item['isShowWithChild'] = false,
          item['img'] = '/images/icon/down.png'
      })
      return allCity
    },

    /**
     * 获取获取位置的状态
     */
    getUserLocationStatus: async function () {
      try {
        let getSetting = await getSettingPromisify()
        if (getSetting.authSetting['scope.userLocation']) {
          return true
        } else {
          return false
        }
      } catch (error) {
        isTestEnvironment && await showModalPromisify({
          title: '错误提示',
          content: JSON.stringify(error)
        })
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
          let selectedCity = {
            adcode: adcodeSub,
            city,
          }
          _this.setData({
            ifLocal: city,
            isDefaultStatus: false,
            animatedType:'slideOutRight'
          })
          await sleep(500);
          _this.triggerEvent('myLocation', {
            selectedCity,
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
     * 选择全国
     */
    chooseChinese: async function () {
      this.setData({
        onChinese: 'on-chinese',
        animatedType: 'slideOutRight',
      });
      let selectedCity = {
        adcode: '',
        city: '全国',
      }
      await sleep(500);
      this.triggerEvent('myLocation', {
        selectedCity,
      })

    },

    /**
     * 点击mask
     */
    closeMask:async function (e) {
      this.setData({
        animatedType: 'slideOutRight'
      });
      await sleep(500);
      this.triggerEvent('myLocation', {
        type:'close',
      })
    },
  },
})
