// pages/program/program.js
import { getConfig } from "../../api/request";
import regeneratorRuntime, { async } from "../../api/regeneratorRuntime";
import { jumpToPromisify, setStoragePromisify, getStoragePromisify, getStorageInfoPromisify} from "../../api/promisify";
import { sleep } from '../../common/common'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    style:"",
    animationData:{},
    images:'',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad:async function () {
    let storageInfo = await getStorageInfoPromisify();
    let images;
    // 如果本地是否有开屏页图片的缓存
    if (storageInfo.keys.includes("SCREEN")) {
      images = (await getStoragePromisify("SCREEN")).SCREEN;
    }else{
      let result = await getConfig({
        key:"screen"
      });
      images = result.data.detail;
    }
    let { windowHeight } = wx.getSystemInfoSync(); //获取可视范围的高度
    let style=`height:${windowHeight}px;margin-top:${windowHeight}px;`
    let animation = wx.createAnimation({
      duration:2000,
      timingFunction:"ease",
      transformOrigin:"0 0 0"
    })
    animation.translateY(-windowHeight).step();
    this.setData({
      style,
      animationData: animation.export(),
      images:images
    });
    await sleep(2000);
    let result0 = await getConfig({
      key:"fake"
    });
    if(result0.data.detail === "1"){
      jumpToPromisify("coast-index","switchTab")
    }else{
      jumpToPromisify("index","reLaunch")
    }
   await setStoragePromisify({"SCREEN":images})
  },
})