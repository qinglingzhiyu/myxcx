/**
 * Created by Terris
 * https://github.com/qinglingzhiyu
 *
 * @date: 2019-01-09
 * @flow
 *
 * description:
 *
 */

import {
  stature
} from "../../utils/util.js";
import {
  getUseridInfo,
  updatePersonInfo,
  userStatus,
  releaseDynamic,
  getCurrentUser
} from "../../api/request.js";
import regeneratorRuntime, {
  async
} from "../../api/regeneratorRuntime.js";
import {
  jumpToPromisify,
  showModalPromisify,
  showToastPromisify,
  getStoragePromisify,
  chooseImagePromisify,
  showLoadingPromisify,
  removeStoragePromisify,
  getSystemInfoPromisify,
  getStorageInfoPromisify
} from "../../api/promisify.js";
import {
  config
} from "../../api/config.js";
import {
  sleep,
  isNull,
  QiniuToken,
  MasterMapByThumbnail,
  thumbnailByMasterMap
} from "../../common/common.js";
import {
  host
} from "../../common/const.js";
import {
  isTestEnvironment
} from "../../api/config";

const qiniuUploader = require("../../common/qiniuUploader.js");

Page({
  /**
   * 页面的初始数据
   */
  data: {
    heightRange: [],
    heightIndex: 0,
    educationRange: [
      "请选择",
      "高中及以下",
      "大专",
      "本科",
      "硕士",
      "硕士及以上"
    ],
    educationIndex: 0,
    personInfo: {
      avatarUrl: "", //用户头像
      birthday: "请选择", //出生日期
      occupation: "",
      residence: "请选择",
      education: "请选择",
      checked: false,
      disabled: false,
      images: []
    },
    multiArray: [],
    multiIndex: [0, 0],
    affirmVal: "请选择",
    circleId: 0,
    circleName: "",
    checked: false,
    isUploading: true,
    windowHeight: 0, //设置scroll-view的高度
    isTextarea: false,
    distanceToKeyboard: "270rpx", //最底下个性介绍到键盘的距离
    focus: false //textarea 是否获取焦点
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    let {
      circleId,
      circleName,
      comeTo
    } = options;
    circleId &&
      this.setData({
        circleId
      });
    circleName &&
      this.setData({
        circleName
      });
    comeTo &&
      this.setData({
        comeTo
      });
    let heightRange = stature(150, 200); //身高范围
    try {
      let result = await getSystemInfoPromisify();
      let windowHeight = result.windowHeight * (750 / result.windowWidth) - 88; //px转换为rpx
      heightRange &&
        windowHeight &&
        this.setData({
          heightRange,
          windowHeight
        });
    } catch (error) {
      let content;
      if (error instanceof Object) content = JSON.stringify(error);
      else content = String(content);
      isTestEnvironment &&
        (await showModalPromisify({
          title: "错误提示",
          content
        }));
    }

    wx.hideShareMenu(); //取消顶部分享
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: async function () {
    let {
      personInfo,
      heightRange
    } = this.data;
    //初始化选择城市
    let provinces = [];
    let city = host[0].sub;
    host.map(item => {
      provinces.push({
        label: item.label
      });
    });
    this.setData({
      provinces,
      multiArray: [provinces, city]
    });
    let storageInfo = await getStorageInfoPromisify();
    try {
      if (storageInfo.keys.includes("userId")) {
        let userId = wx.getStorageSync("userId");
        let result = await getCurrentUser();
        console.log('result: ', result);
        if (typeof result === "undefined" || !result)
          throw new Error(`getCurrentUser api is ${result}`);
        if (result.statusCode === 200) {
          result.data.avatar &&
            (personInfo["avatarUrl"] = MasterMapByThumbnail(
              result.data.avatar,
              120
            )); //头像
          result.data.sexHasChanged === 1 && (personInfo["disabled"] = true);
          result.data.child_gender === "男" && (personInfo["checked"] = true);
          personInfo["child_gender"] = result.data.child_gender;
          result.data.birthday &&
            (personInfo["birthday"] = result.data.birthday);
          result.data.occupation &&
            (personInfo["occupation"] = result.data.occupation);
          result.data.residence_new &&
            (personInfo["residence_new"] = result.data.residence_new);
          if (Number(result.data.residence_new) !== 540000) {
            //获取具体位置
            let city;
            let index;
            host.map((item, i) => {
              item.sub.map(item1 => {
                if (item1.value === Number(result.data.residence_new)) {
                  city = item1.label;
                  index = i;
                  return;
                }
              });
            });
            personInfo["residence"] = host[index].label + "-" + city;
          }
          result.data.descr && (personInfo["descr"] = result.data.descr);
          if (result.data.images.length > 0) {
            let img = result.data.images.slice(0, 4).reverse();
            img.map(item => {
              item["src"] = MasterMapByThumbnail(item.src, 153);
            });
            personInfo["images"] = img;
          }
          result.data.images.length >= 4 &&
            this.setData({
              isUploading: false
            });
          result.data.height &&
            heightRange.map((item, index) => {
              result.data.height + "cm" === item &&
                this.setData({
                  heightIndex: index
                });
            });
          result.data.education &&
            this.data.educationRange.map((item, index) => {
              item === result.data.education &&
                this.setData({
                  educationIndex: index
                });
            }),
            (personInfo["education"] = result.data.education);
          this.setData({
            personInfo,
            userId
          });
        } else
          throw new Error(
            `statusCode of getUseridInfo is ${result.statusCode}`
          );
      } else {
        let errModel = await showModalPromisify({
          title: "提示",
          content: "账号异常,点击确认返回首页"
        });
        errModel.confirm && jumpToPromisify("index", "reLaunch");
      }
    } catch (error) {
      isTestEnvironment &&
        (await showModalPromisify({
          title: "错误提示",
          content: String(error)
        }));
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: async function () {
    let storageInfo = await getStorageInfoPromisify();
    if (!storageInfo.keys.includes("qiniuToken")) {
      QiniuToken();
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this.savePersonInfo();
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    this.savePersonInfo();
  },

  /**
   *  保存信息
   */
  savePersonInfo: async function () {
    let {
      personInfo,
      userId
    } = this.data;
    let info = {
      avatar: personInfo.avatarUrl,
      birthday: personInfo.birthday,
      occupation: personInfo.occupation,
      residence: personInfo.residence,
      residence_new: personInfo.residence_new,
      education: personInfo.education,
      descr: personInfo.descr,
      images: personInfo.images,
      child_gender: personInfo.child_gender,
      height: personInfo.height
    };
    try {
      if (typeof userId === "undefined") throw new Error(`userId is ${userId}`);
      userId &&
        (await updatePersonInfo({
          info,
          userId
        }));
    } catch (error) {
      let content;
      if (error instanceof Object) content = JSON.stringify(error);
      else content = String(content);
      isTestEnvironment &&
        (await showModalPromisify({
          title: "错误提示",
          content
        }));
    }
  },

  /**
   * 选择头像
   */
  chooeseImage: async function () {
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes("qiniuToken")) {
      let {
        qiniuToken
      } = await getStoragePromisify("qiniuToken");
      try {
        let result = await chooseImagePromisify({
          count: 1,
          sizeType: "compressed"
        });
        showLoadingPromisify({
          title: "上传中"
        });
        let filePath = result.tempFilePaths[0];
        qiniuUploader.upload(
          filePath,
          res => {
            wx.hideLoading();
            result.errMsg === "chooseImage:ok" &&
              this.setData({
                ["personInfo.avatarUrl"]: res.imageURL
              });
          },
          err => {
            showToastPromisify({
              title: "上传失败!"
            });
          }, {
            region: "ECN",
            domain: config.domain,
            uptoken: qiniuToken
          }
        );
      } catch (error) {
        if (error.errMsg !== "chooseImage:fail cancel")
          await showModalPromisify({
            content: "微信客户端未授权相机权限，请授权",
            showCancel: false
          });
      }
    } else {
      await showModalPromisify({
        content: "账号异常,请返回重试",
        showCancel: false
      });
    }
  },

  /**
   * 选择性别
   */
  changeGender: function (e) {
    let {
      value
    } = e.detail;
    value === "男" &&
      this.setData({
        ["personInfo.child_gender"]: "男",
        ["personInfo.checked"]: true
      });
    value === "女" &&
      this.setData({
        ["personInfo.child_gender"]: "女",
        ["personInfo.checked"]: false
      });
  },

  /**
   * 选择出生日期
   */
  onDateChange: function (e) {
    let {
      value
    } = e.detail;
    this.setData({
      ["personInfo.birthday"]: value
    });
  },

  /**
   * 选择职业
   */
  notBlur: function (e) {
    let {
      value
    } = e.detail;
    this.setData({
      ["personInfo.occupation"]: value
    });
  },

  /**
   * 选择居住地滑动
   * @param {*} e
   */
  bindMultiPickerColumnChange: function (e) {
    let {
      column,
      value
    } = e.detail;
    let {
      multiArray,
      multiIndex
    } = this.data;
    multiIndex[column] = value;
    if (column === 0) {
      //如果更新的是第一列“省”，第二列“市”的数组下标置为0
      multiIndex = [value, 0];
      multiArray[1] = host[value].sub;
    } else if (column === 1) {
      //如果更新的是第二列“市”，第一列“省”的下标不变
      multiIndex = [multiIndex[0], value];
    }
    this.setData({
      multiIndex,
      multiArray
    });
  },

  /**
   * 选择居住地
   */
  bindMultiPickerChange: function (e) {
    let {
      value
    } = e.detail;
    let {
      multiArray
    } = this.data;
    this.setData({
      multiIndex: value,
      ["personInfo.residence"]: multiArray[0][value[0]].label + "-" + multiArray[1][value[1]].label,
      ["personInfo.residence_new"]: multiArray[1][value[1]].value
    });
  },

  /**
   * 选择身高
   */
  onHeightChange: function (e) {
    let {
      value
    } = e.detail;
    let {
      heightRange
    } = this.data;
    this.setData({
      heightIndex: value,
      ["personInfo.height"]: heightRange[Number(value)].slice(0, 3)
    });
  },

  /**
   * 选择学历
   */
  onEducationChange: function (e) {
    let {
      value
    } = e.detail;
    let {
      educationRange
    } = this.data;
    this.setData({
      educationIndex: value,
      ["personInfo.education"]: educationRange[value]
    });
  },

  /**
   * 生活照上传
   */
  choosePhoto: async function (e) {
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes("qiniuToken")) {
      try {
        let {
          qiniuToken
        } = await getStoragePromisify("qiniuToken");
        let result = await chooseImagePromisify({
          count: 1,
          sizeType: "compressed"
        });
        console.log("result: ", result);
        showLoadingPromisify({
          title: "上传中"
        });
        let filePath = result.tempFilePaths[0];
        qiniuUploader.upload(
          filePath,
          res => {
            wx.hideLoading();
            let {
              personInfo
            } = this.data;
            personInfo.images.push({
              id: 0,
              src: MasterMapByThumbnail(res.imageURL, 153),
              status: true
            });
            if (personInfo.images.length >= 4)
              this.setData({
                personInfo,
                isUploading: false
              });
            else
              this.setData({
                personInfo,
                isUploading: true
              });
          },
          err => {
            showToastPromisify({
              title: "上传失败!"
            });
          }, {
            region: "ECN",
            domain: config.domain,
            uptoken: qiniuToken
          }
        );
      } catch (error) {
        if (error.errMsg !== "chooseImage:fail cancel")
          await showModalPromisify({
            content: "微信客户端未授权相机权限，请授权",
            showCancel: false
          });
      }
    } else {
      await showModalPromisify({
        content: "账号异常,请返回重试",
        showCancel: false
      });
    }
  },

  /**
   * 预览图片
   */
  goPreview: function (e) {
    let {
      index
    } = e.currentTarget.dataset;
    let {
      images
    } = this.data.personInfo;
    let imgs = [];
    images.map(item => {
      imgs.push(thumbnailByMasterMap(item.src));
    });
    wx.previewImage({
      urls: imgs,
      current: imgs[index]
    });
  },

  /**
   * 删除图片
   */
  closeImg: function (e) {
    let {
      index
    } = e.currentTarget.dataset;
    let {
      personInfo
    } = this.data;
    personInfo.images.splice(index, 1);
    showToastPromisify({
      title: "删除成功"
    });
    if (personInfo.images.length < 4)
      this.setData({
        personInfo,
        isUploading: true
      });
    else
      this.setData({
        personInfo
      });
  },

  /**
   * 个性介绍
   */
  changeTextarea: function (e) {
    let {
      value
    } = e.detail;
    this.setData({
      ["personInfo.descr"]: value
    });
  },

  /**
   * 失去焦点触发
   */
  blurTextarea: function () {
    this.setData({
      isTextarea: false,
      focus: false
    });
  },

  /**
   * 编辑个性介绍
   * @param {*} e
   */
  editIntroduce: function () {
    this.setData({
      isTextarea: true,
      focus: true
    });
  },

  /**
   * 输入框行数变化时调用
   * @param {*} e
   */
  lineChangeTextarea: function (e) {
    let {
      lineCount
    } = e.detail;
    let distance = 300 - lineCount * 50 > 0 ? 300 - lineCount * 50 : 0;
    this.setData({
      distanceToKeyboard: distance + "rpx"
    });
  },

  /**
   * 搜集formid和保存照片
   */
  bindSubmit: async function (e) {
    let {
      birthday,
      height,
      education,
      occupation,
      gender
    } = e.detail.value;
    let {
      residence,
      residence_new,
      images,
      avatarUrl,
      descr
    } = this.data.personInfo;
    let {
      circleId,
      circleName,
      comeTo,
      educationRange,
      heightRange
    } = this.data;
    let storageInfo = await getStorageInfoPromisify();
    if (!storageInfo.keys.includes("userId")) {
      showToastPromisify({
        title: "登录失败",
        images: "/images/icon/fail.png"
      });
      await sleep(1500);
      jumpToPromisify("index", "onLauch");
    }
    let userId = wx.getStorageSync("userId");
    if (birthday === "请选择") {
      showToastPromisify({
        title: "请填写出生日期",
        image: "/images/icon/err.png"
      });
    } else if (isNull(occupation)) {
      showToastPromisify({
        title: "请填写孩子职业",
        image: "/images/icon/err.png"
      });
    } else if (residence === "请选择") {
      showToastPromisify({
        title: "请填写孩子居住地",
        image: "/images/icon/err.png"
      });
    } else if (height === "0") {
      showToastPromisify({
        title: "请填写孩子身高",
        image: "/images/icon/err.png"
      });
    } else if (Number(education) === 0) {
      showToastPromisify({
        title: "请填写孩子学历",
        image: "/images/icon/err.png"
      });
    } else if (!images || images.length === 0) {
      showToastPromisify({
        title: "请添加生活照",
        image: "/images/icon/err.png"
      });
    } else if (!descr || isNull(descr)) {
      showToastPromisify({
        title: "请填写个性介绍",
        image: "/images/icon/err.png"
      });
    } else {
      images.map(item => {
        //保存生活照时候是原图
        item["src"] = thumbnailByMasterMap(item.src);
      });
      let info = {
        avatar: avatarUrl,
        birthday: birthday,
        occupation: occupation,
        residence: residence,
        residence_new: residence_new,
        education: educationRange[Number(education)],
        descr: descr,
        images: images,
        child_gender: gender,
        height: heightRange[Number(height)].slice(0, 3)
      };
      showLoadingPromisify({
        title: "请求中"
      });
      try {
        let result = await updatePersonInfo({
          info,
          userId
        });
        if (typeof result === "undefined" || !result)
          throw new Error(`updatePersonInfo api is ${result}`);
        if (result.statusCode === 200) {
          showToastPromisify({
            title: "保存成功",
            image: "/images/icon/success.png",
            duration: 1500
          });
          await sleep(1500);
          circleId && (await userStatus(circleId)); //更新圈子用户的资料状态
          if (comeTo && comeTo !== "sale" && comeTo !== "circle") {
            jumpToPromisify(1, "back");
            return;
          }
          //自动发送动态
          let img = [];
          images.map(item => {
            img.push(item.src);
          });
          if (comeTo && (comeTo === "sale" || comeTo === "circle")) {
            await releaseDynamic({
              type: 0,
              circle_id: circleId,
              content: descr,
              images: img.join(",")
            });
          }
          let jump = wx.getStorageSync("jump");
          let withUserid = wx.getStorageSync("withUserid");
          let messageNavTitle = wx.getStorageSync("messageNavTitle");
          jump &&
            jump === "messageContent" &&
            jumpToPromisify(
              "/subPackage_message/pages/message-content/message-content",
              "redirect", {
                with_user_id: withUserid,
                navTitle: messageNavTitle
              },
              true
            ),
            removeStoragePromisify(["jump", "withUserid", "messageNavTitle"]);
          jump &&
            jump === "circleDynamic" &&
            jumpToPromisify("circle-dynamic", "redirect", {
              circleId,
              navTitle: circleName
            }),
            removeStoragePromisify("jump");
          jump &&
            jump === "dynamic" &&
            jumpToPromisify("dynamic", "redirect", {
              userId: withUserid,
              navTitle: "TA的动态"
            }),
            removeStoragePromisify(["jump", "withUserid", "messageNavTitle"]);
        } else {
          showToastPromisify({
            title: "保存失败,请稍后再试",
            duration: 2000
          });
        }
      } catch (error) {
        isTestEnvironment &&
          (await showModalPromisify({
            title: "错误提示",
            content: String(error)
          }));
      }
    }
  }
});
