// pages/person-info/person-info.js
import {
  stature
} from "../../utils/util.js"
import {
  getUseridInfo,
  getQiNiuTokenWithToken,
  updatePersonInfo,
  userStatus,
  releaseDynamic
} from "../../api/request.js"
import regeneratorRuntime from "../../api/regeneratorRuntime.js"
import {
  chooseImagePromisify,
  getStorageInfoPromisify,
  setStoragePromisify,
  showLoadingPromisify,
  showToastPromisify,
  jumpToPromisify,
  getStoragePromisify,
  removeStoragePromisify
} from "../../api/promisify.js"
import {
  config
} from "../../api/config.js"
import {
  sleep
} from "../../common/common.js";
import {
  defaultImage
} from "../../common/const.js"

const qiniuUploader = require("../../common/qiniuUploader.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    heightRange: [],
    heightIndex: 0,
    educationRange: ["请选择", "高中及以下", "大专", "本科", "硕士", "硕士及以上"],
    educationIndex: 0,
    personInfo: {
      avatarUrl: "/images/touxiang.jpg", //用户头像
      birthday: "请选择", //出生日期
      occupation: "",
      residence: "请选择",
      education: "请选择",
      checked: false,
      disabled: false,
      images: [],
    },
    circleId: 0,
    circleName: '',
    checked: false,
    isUploading: true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function(options) {
    let _this = this;
    let {
      circleId,
      circleName,
      comeTo
    } = options;
    circleId && circleName && _this.setData({
      circleId,
      circleName
    });
    comeTo && _this.setData({
      comeTo
    })
    let heightRange = stature(150, 200) //身高范围
    _this.setData({
      heightRange
    })
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes("userId")) {
      let userId = wx.getStorageSync("userId");
      let result = await getUseridInfo({
        user_id: userId
      });
      
      let personInfo = _this.data.personInfo;
      if (result.statusCode === 200) {
        result.data.avatar && (personInfo["avatarUrl"] = result.data.avatar);
        result.data.child_gender !== "" && (personInfo["disabled"] = true);
        result.data.child_gender === "男" && (personInfo["checked"] = true);
        personInfo["child_gender"] = result.data.child_gender
        result.data.birthday && (personInfo["birthday"] = result.data.birthday);
        result.data.occupation && (personInfo["occupation"] = result.data.occupation);
        result.data.residence && (personInfo["residence"] = result.data.residence);
        result.data.residence_new && (personInfo["residence_new"] = result.data.residence_new);
        result.data.descr && (personInfo["descr"] = result.data.descr);
        result.data.images.length > 0 && (personInfo["images"] = result.data.images.slice(0,4));
        result.data.images.length >= 4 && (this.setData({
          isUploading: false
        }));
        result.data.height && heightRange.map((item, index) => {
          (result.data.height + "cm") === item && _this.setData({
            heightIndex: index
          });
        });
        result.data.education && _this.data.educationRange.map((item, index) => {
          item === result.data.education && _this.setData({
            educationIndex: index
          })
        })

        _this.setData({
          personInfo
        })
      }
    } else {
      showToastPromisify({
        title: "未登录,返回首页"
      })
      jumpToPromisify("index", "reLaunch")
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {
   
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  },

  /**
   * 选择头像
   */
  chooeseImage: async function() {
    let _this = this;
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes("qiniuToken")) {
      let qiniuToken = (await getStoragePromisify("qiniuToken")).qiniuToken;
      let result = await chooseImagePromisify({
        count: 1,
        sizeType: "compressed"
      })
      showLoadingPromisify({
        title: "上传中"
      })
      let filePath = result.tempFilePaths[0];
      qiniuUploader.upload(filePath, (res) => {
        wx.hideLoading()
        let {
          personInfo
        } = this.data;
        personInfo["avatarUrl"] = res.imageURL;
        result.errMsg === "chooseImage:ok" && this.setData({
          personInfo
        })
      }, (err) => {
        showToastPromisify({
          title: "上传失败!"
        })
      }, {
        region: 'ECN',
        domain: config.domain,
        uptoken: qiniuToken
      })
    }

  },

  /**
   * 选择性别
   */
  changeGender: function(e) {
    let {
      personInfo
    } = this.data;
    let {
      value
    } = e.detail;
    value === "男" && (personInfo["child_gender"] = "男", personInfo["checked"] = true);
    value === "女" && (personInfo["child_gender"] = "女", personInfo["checked"] = false)
    this.setData({
      personInfo
    })
  },

  /**
   * 选择出生日期
   */
  onDateChange: function(e) {
    let personInfo = this.data.personInfo;
    personInfo["birthday"] = e.detail.value;
    this.setData({
      personInfo
    })
  },

  /**
   * 选择职业
   */
  notBlur: function(e) {
    let {
      value
    } = e.detail;
    let {
      personInfo
    } = this.data;
    personInfo["occupation"] = value
    this.setData({
      personInfo
    })
  },

  /**
   * 选择居住地
   */
  onResidenceChange: function(e) {
    let personInfo = this.data.personInfo;
    personInfo["residence"] = `${e.detail.value[0]}-${e.detail.value[1]}`;
    personInfo["residence_new"] = e.detail.code[1];
    this.setData({
      personInfo
    })
  },

  /**
   * 选择身高
   */
  onHeightChange: function(e) {
    this.setData({
      heightIndex: e.detail.value
    })
  },

  /**
   * 选择学历
   */
  onEducationChange: function(e) {
    this.setData({
      educationIndex: e.detail.value
    })
  },

  /**
   * 生活照上传
   */
  choosePhoto: async function(e) {
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes("qiniuToken")) {
      let qiniuToken = (await getStoragePromisify("qiniuToken")).qiniuToken;
      let result = await chooseImagePromisify({
        count: 1,
        sizeType: "compressed"
      })
      showLoadingPromisify({
        title: "上传中"
      })
      let filePath = result.tempFilePaths[0];
      qiniuUploader.upload(filePath, (res) => {
        wx.hideLoading()
        let {
          personInfo
        } = this.data;
        personInfo.images.push({
          id: 0,
          src: res.imageURL,
          status: true
        });
        if (personInfo.images.length >= 4) this.setData({
          personInfo,
          isUploading: false
        });
        else this.setData({
          personInfo,
          isUploading: true
        })
      }, (err) => {
        showToastPromisify({
          title: "上传失败!"
        })
      }, {
        region: 'ECN',
        domain: config.domain,
        uptoken: qiniuToken
      })
    }

  },

  /**
   * 预览图片
   */
  goPreview: function(e) {
    let {
      index
    } = e.currentTarget.dataset;
    let {
      images
    } = this.data.personInfo;
    let imgs = [];
    images.map(item => {
      imgs.push(item.src)
    })
    wx.previewImage({
      urls: imgs,
      current: imgs[index]
    })
  },

  /**
   * 删除图片
   */
  closeImg: function(e) {
    let {
      index
    } = e.currentTarget.dataset;
    let {
      personInfo
    } = this.data;
    personInfo.images.splice(index, 1);
    showToastPromisify({
      title: "删除成功"
    })
    if (personInfo.images.length < 4) this.setData({
      personInfo,
      isUploading: true
    });
    else this.setData({
      personInfo
    })
  },

  /**
   * 个性介绍
   */
  changeTextarea: function(e) {
    let {
      value
    } = e.detail;
    let {
      personInfo
    } = this.data;
    personInfo["descr"] = value;
    this.setData({
      personInfo
    })

  },

  /**
   * 搜集formid和保存照片
   */
  bindSubmit: async function(e) {
    
    let {
      birthday,
      height,
      textarea,
      education,
      occupation,
      gender
    } = e.detail.value;
    let {
      residence,
      residence_new,
      images,
      avatarUrl
    } = this.data.personInfo;
    let {
      circleId,
      circleName,
      comeTo,
      educationRange,
      heightRange
    } = this.data;
    let storageInfo = await getStorageInfoPromisify();
    if(!storageInfo.keys.includes("userId")) {
      showToastPromisify({title:"登录失败",images:"/images/icon/fail.png"})
      await sleep(1500);
      jumpToPromisify("index","onLauch")
    } 
    let userId = wx.getStorageSync("userId")
    if (birthday === "请选择") {
      showToastPromisify({
        title: "请填写出生日期",
        image: "/images/icon/err.png"
      });
    } else if (occupation === "") {
      showToastPromisify({
        title: "请填写孩子职业",
        image: "/images/icon/err.png"
      });
    } else if (residence === "请选择") {
      showToastPromisify({
        title: "请填写孩子居住地",
        image: "/images/icon/err.png"
      })
    } else if (height === "0") {
      showToastPromisify({
        title: "请填写孩子身高",
        image: "/images/icon/err.png"
      })
    } else if (Number(education) === 0) {
      showToastPromisify({
        title: "请填写孩子学历",
        image: "/images/icon/err.png"
      })
    } else if (!images || images.length === 0) {
      showToastPromisify({
        title: "请添加生活照",
        image: "/images/icon/err.png"
      })
    } else if (textarea.length === 0) {
      showToastPromisify({
        title: "请填写个性介绍",
        image: "/images/icon/err.png"
      })
    } else {
      let info = {
        avatar: avatarUrl,
        birthday: birthday,
        occupation: occupation,
        residence: residence,
        residence_new: residence_new,
        education: educationRange[Number(education)],
        descr: textarea,
        images: images,
        child_gender: gender,
        height: heightRange[Number(height)].slice(0,3),
      }
      showLoadingPromisify({
        title: "请求中"
      })
      let result = await updatePersonInfo({
        info,
        userId
      })
      if (result.statusCode === 200) {
        showLoadingPromisify({ title: "保存中"})
        circleId && await userStatus(circleId);
        if (comeTo && comeTo !== "sale") {
          jumpToPromisify(1, "back");
          return
        };
        let img = [];
        images.map(item => {
          img.push(item.src)
        })
        if (comeTo && comeTo === "sale") {
          showLoadingPromisify({title:"保存中"})
          await releaseDynamic({
            type: 0,
            circle_id: circleId,
            content: textarea,
            images: img.join(",")
          })
        };
        showToastPromisify({
          title: "保存成功",
          duration: 1500
        });
        await sleep(1500);
        let jump = wx.getStorageSync("jump");
        let withUserid = wx.getStorageSync("withUserid");
        let messageNavTitle = wx.getStorageSync("messageNavTitle");
        jump && jump === "messageContent" && jumpToPromisify("message-content", "redirect", {
          with_user_id: withUserid,
          navTitle:messageNavTitle
        }), removeStoragePromisify(['jump', 'withUserid','messageNavTitle']);
        jump && jump === "circleDynamic" && jumpToPromisify("circle-dynamic", "redirect", {
          circleId,
          navTitle: circleName
        }), removeStoragePromisify('jump');
        jump && jump === "dynamic" && jumpToPromisify("dynamic", "redirect", {
          userId: withUserid,
          navTitle: "TA的动态"
        }), removeStoragePromisify(['jump', 'withUserid','messageNavTitle']);

      } else {
        showToastPromisify({
          title: "保存失败,请稍后再试",
          duration: 2000
        })
      }
    }
  },
})
