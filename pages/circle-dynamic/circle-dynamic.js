/**
 * Created by Terris
 * https://github.com/qinglingzhiyu
 *
 * @date: 2018-12-28
 * @flow
 *
 * description:  这是circle-dynamic的逻辑
 *
 */

import {
  getStorageInfoPromisify,
  getStoragePromisify,
  jumpToPromisify,
  showLoadingPromisify,
  showToastPromisify,
  showModalPromisify
} from '../../api/promisify.js';
import {
  getFeedsDynamic,
  getMembersList,
  updateLike,
  createOrDeleteComment
} from '../../api/request.js';
import {
  occupationByNumber,
  timeCycle,
  sleep,
  MasterMapByThumbnail,
  thumbnailByMasterMap
} from '../../common/common.js';
import regeneratorRuntime, {
  async
} from '../../api/regeneratorRuntime.js';
import {
  expIsApp
} from '../../common/const';
import {
  isTestEnvironment
} from '../../api/config';

const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentTab: 0, //tab切换
    winHeight: 0,
    feedDynamicData: [], //动态数据
    memberList: [], //成员数据
    circleId: 0, //当前圈子
    memberPage: 1, //成员当前页
    memberTotalPages: 1, //成员的总页数
    dynamicPage: 1, //动态当前页
    dynamicTotalPages: 1, //动态的总页数
    isCloseByMask: false,
    isComment: false,
    commentInfo: {}, //评论内容
    showComment: true, //是否显示发布动态按钮
    isDynamic: true,
    isOpenImage: false, //true 放大过照片 false 为未放大照片
    isOpenText: false, // true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    let _this = this;
    let {
      circleId,
      navTitle
    } = options;
    try {
      if (typeof circleId === 'undefined' || !circleId) throw new Error(`circleId: ${circleId}`)
      if (typeof navTitle === 'undefined' || !navTitle) throw new Error(`navTitle: ${navTitle}`)
      circleId && navTitle && this.setData({
        circleId,
        navTitle
      })
    } catch (error) {
      console.log('error: ', error);
      isTestEnvironment && await showModalPromisify({
        title: '错误提示',
        content: String(error)
      })
    }

    //系统参数
    wx.getSystemInfo({
      success: function (res) {
        _this.setData({
          winHeight: res.windowHeight
        });
      }
    });

    wx.hideShareMenu(); //取消顶部分享
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: async function () {
    const {
      navTitle,
      circleId
    } = this.data;
    navTitle && wx.setNavigationBarTitle({
      title: navTitle
    });
    try {
      let result2 = await this.getDynamicListByRequest({
        circleId,
        dynamicPage: 1
      });

      if (typeof result2 === 'undefined' || !result2) throw new Error(`getDynamicListByRequest return值:${result}`)
      //获取动态的总页数
      let dynamicTotalPages = Math.ceil(result2.count / 5);
      this.setData({
        feedDynamicData: result2.results,
        dynamicPage: 1,
        dynamicTotalPages
      })

      let result = await this.getMemberListByRequest({
        circleId,
        memberPage: 1
      });
      if (typeof result === 'undefined' || !result) throw new Error(`getMemberListByRequest return值:${result}`)
      //获取成员列表的总页数
      let memberTotalPages = Math.ceil(result.count / 10);
      this.setData({
        memberList: result.results,
        memberTotalPages
      });
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        title: '错误提示',
        content: String(error)
      })
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 下拉刷新
   */
  loadShell: async function () {
    let {
      circleId,
      currentTab
    } = this.data;
    if (currentTab === 0) {
      try {
        let result0 = await this.getDynamicListByRequest({
          circleId,
          dynamicPage: 1
        });
        if (typeof result0 === 'undefined' || !result0) throw new Error(`getDynamicListByRequest return值:${result0}`)
        //获取动态的总页数
        let dynamicTotalPages = Math.ceil(result0.count / 5);
        this.setData({
          dynamicPage: 1,
          feedDynamicData: result0.results,
          dynamicTotalPages
        });
      } catch (error) {
        isTestEnvironment && await showModalPromisify({
          title: '错误提示',
          content: String(error)
        })
      }
    } else if (currentTab === 1) {
      try {
        let result = await this.getMemberListByRequest({
          circleId,
          memberPage: 1
        });
        if (typeof result === 'undefined' || !result) throw new Error(`getMemberListByRequest return值:${result}`)
        //获取成员列表的总页数
        let memberTotalPages = Math.ceil(result.count / 10);
        this.setData({
          memberList: result.results,
          memberPage: 1,
          memberTotalPages
        })
      } catch (error) {
        isTestEnvironment && await showModalPromisify({
          title: '错误提示',
          content: String(error)
        })
      }
    }
  },

  /**
   * 上拉获取更多
   */
  loadMore: async function () {
    let {
      circleId,
      currentTab,
      dynamicPage,
      memberPage,
      memberList,
      feedDynamicData,
      memberTotalPages,
      dynamicTotalPages
    } = this.data;

    if (currentTab === 0) {
      if (dynamicPage === dynamicTotalPages) {
        return await showToastPromisify({
          title: '暂无更多动态'
        });
      }
      dynamicPage += 1;
      try {
        let result0 = await this.getDynamicListByRequest({
          circleId,
          dynamicPage
        });
        if (typeof result0 === 'undefined' || !result0) throw new Error(`getDynamicListByRequest 的result值:${result0}`)
        result0.results.map(item => {
          feedDynamicData.push(item)
        })
        this.setData({
          dynamicPage,
          feedDynamicData
        })
      } catch (error) {
        isTestEnvironment && await showModalPromisify({
          title: '错误提示',
          content: String(error)
        })
      }
    } else if (currentTab === 1) {
      if (memberPage === memberTotalPages) {
        return await showToastPromisify({
          title: '暂无更多成员'
        });
      }
      memberPage += 1;
      try {
        let result = await this.getMemberListByRequest({
          circleId,
          memberPage
        });
        if (typeof result === 'undefined' || !result) throw new Error(`getMemberListByRequest 的result值:${result0}`)
        result.results.map(item => {
          memberList.push(item)
        });
        this.setData({
          memberList,
          memberPage
        })
      } catch (error) {
        isTestEnvironment && await showModalPromisify({
          title: '错误提示',
          content: String(error)
        })
      }
    }
  },

  /**
   * 获取动态列表
   */
  getDynamicListByRequest: async function (param) {
    let {
      circleId,
      dynamicPage
    } = param;
    showLoadingPromisify();
    try {
      let feedDynamic = circleId && await getFeedsDynamic({
        circleId,
        page: dynamicPage
      })
      if (typeof feedDynamic === 'undefined') throw new Error(`getFeedsDynamic api is ${feedDynamic}`)
      if (feedDynamic.statusCode === 200) {
        feedDynamic.data.results.map((item) => {
          item['time'] = timeCycle(item.create_time)
          item['avatar'] = MasterMapByThumbnail(item.avatar,100);
          let images = MasterMapByThumbnail(item.images.split(',').filter(Boolean),270)
          item['images'] =images.slice(0,9)
          if (item.content.gblen() >= 112) {
            item['isShowWithContent'] = true;
            item['isOpenText'] = true;
          } else {
            item['isShowWithContent'] = false;
            item['isOpenText'] = false;
          }
          item['isInterest'] = false;
          item.comment.map(item2 => {
            item2['user_id_avatar'] = MasterMapByThumbnail(item2.user_id_avatar,60)
          });
        })
        return feedDynamic.data
      } else {
        throw new Error(`statusCode of getFeedsDynamic is ${feedDynamic.statusCode}`)
      }
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        title: '错误提示',
        content: String(error)
      })
    }

  },

  /**
   * 获取成员列表
   */
  getMemberListByRequest: async function (param) {
    let storageInfo = await getStorageInfoPromisify();
    let {
      circleId,
      memberPage
    } = param;
    try {
      if (storageInfo.keys.includes('Token')) {
        showLoadingPromisify()
        let list = circleId && await getMembersList({
          circleId,
          page: memberPage
        })
        if (typeof list === 'undefined') throw new Error(`getMembersList api is ${list}`)
        if (list.statusCode === 200) {
          if (storageInfo.keys.includes('userId')) {
            let myuserid = (await getStoragePromisify('userId')).userId;
            list.data.results.map(item => {
              if (item.user_id === Number(myuserid)) item['ismy'] = true;
              else item['ismy'] = false;
              if (expIsApp.test(item.user.role)) item.user['isAPP'] = true;
              else item.user['isAPP'] = false;
              item.user.birthday && (item.user['birth_year'] = `${item.user.birthday.slice(0,4)}年`)
              let residence = occupationByNumber(Number(item.user.residence_new))
              item.user.residence_new && (item.user['residence'] = residence)
            })
            return list.data
          }
        } else {
          throw new Error(`statusCode of getMembersList is ${list.statusCode}`)
        }
      } else {
        let errModel = await showModalPromisify({
          title: '提示',
          content: '账号异常,点击确定返回首页',
          showCancel: false
        })
        errModel.confirm && jumpToPromisify('index', 'reLaunch')
      }
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        title: '错误提示',
        content: String(error)
      })
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (e) {
    const {
      feedid,
      sex,
      img
    } = e.target.dataset;
    if (e.from === 'button') {
      let title = '';
      sex === '男' && (title = '快来看看这家孩子适不适合你家小美女？我亲自挑的!');
      sex === '女' && (title = '快来看看这家孩子适不适合你家帅哥？我亲自挑的!')
      return {
        title: title,
        path: `/pages/dynamic-detail/dynamic-detail?feedId=${feedid}`,
        imageUrl: img.split('?')[0]
      }
    }
  },

  /**
   * 评论
   */
  oncomentBybtn: async function (e) {
    let {
      feedid,
      commentto,
      index,
      circleid
    } = e.currentTarget.dataset;
    try {
      let userId = wx.getStorageSync('userId');
      if (typeof userId === 'undefined' || !userId) throw new Error(`本地userid不存在`);
      if (userId === commentto) commentto = 0;
      this.setData({
        isCloseByMask: true,
        isComment: true,
        commentInfo: {
          feed_id: feedid,
          comment_to: Number(commentto),
          circleid,
          index
        }
      })
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        title: '错误提示',
        content: String(error)
      })
    }
  },

  /**
   * 关闭mask
   */
  closeMask: function (e) {
    e.detail === 'close' && this.setData({
      isCloseByMask: false,
      isComment: false
    })
  },


  /**
   * 评论
   */
  onComment: async function (e) {
    let {
      statusCode,
      data
    } = e.detail.result;
    let {
      feedDynamicData,
      commentInfo
    } = this.data;
    if (statusCode === 201) {
      if (feedDynamicData[commentInfo.index].comment.length < 5) {
        feedDynamicData[commentInfo.index].comment.push(data.results);
      }
      feedDynamicData[commentInfo.index].comment_count += 1;
      showToastPromisify({
        title: '评论成功',
        image: '/images/icon/success.png'
      });
    } else {
      showToastPromisify({
        title: '评论失败'
      })
    };
    this.setData({
      isCloseByMask: false,
      isComment: false,
      feedDynamicData,
    })
  },

  /**
   * 滑动切换tab
   */
  bindChange: function (e) {
    var _this = this;
    _this.setData({
      currentTab: e.detail.current,
      showComment: e.detail.current == '0',
    });

  },

  /**
   * 点击tab切换
   */
  swichNav: function (e) {
    var _this = this;
    if (_this.data.currentTab === e.target.dataset.current) {
      return false;
    } else {
      _this.setData({
        currentTab: e.target.dataset.current,
        showComment: e.target.dataset.current == '0'
      })
    }
  },

  /**
   * 预览图片
   */
  goPreview: function (e) {
    let {
      index,
      imageindex
    } = e.currentTarget.dataset;
    let {
      feedDynamicData
    } = this.data;
    let imgs = thumbnailByMasterMap(feedDynamicData[index].images)
    wx.previewImage({
      urls: imgs,
      current: imgs[imageindex]
    })
    this.setData({
      isOpenImage: true
    })
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
      let {
        userId
      } = await getStoragePromisify('userId');
      Number(userid) !== Number(userId) && jumpToPromisify('my-edit', 'navigate', {
        navTitle: 'TA的信息',
        bottomBtn: '留言',
        userId: userid,
        circleId: circleid
      });
      Number(userid) === Number(userId) && jumpToPromisify('my-edit', 'navigate', {
        navTitle: '我的相亲名片',
        bottomBtn: '编辑信息',
        userId: userid,
        circleId: circleid
      })
    } else {
      jumpToPromisify('my-edit', 'navigate', {
        navTitle: 'TA的信息',
        bottomBtn: '留言',
        userId: userid,
        circleId: circleid
      });
    }
  },

  /**
   * 控制查看全文
   */
  openContent: function (e) {
    let {
      index
    } = e.currentTarget.dataset;
    let {
      feedDynamicData
    } = this.data;
    feedDynamicData.map((item, i) => {
      index === i && (item['isOpenText'] = !item.isOpenText)
    });
    this.setData({
      feedDynamicData
    });
  },

  /**
   * 跳转动态详情
   */
  goPageWithDynamicDetail: function (e) {
    let {
      feedid
    } = e.currentTarget.dataset;
    if (typeof feedid === 'undefined' && !feedid) throw new Error(`feedid is ${feedid}`)
    feedid && jumpToPromisify('dynamic-detail', 'navigate', {
      feedId: feedid,
      fromTo: 'circle-dynamic'
    })
  },

  /**
   * 感兴趣
   */
  onisLike: async function (e) {
    let list = this.data.feedDynamicData;
    list[e.currentTarget.dataset.index].isInterest = true;
    list[e.currentTarget.dataset.index].like += 1;
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes('Token')) {
      showLoadingPromisify({
        title: '操作中'
      })
      let result = await updateLike({
        feed_id: e.currentTarget.dataset.feedid
      })
      if (result.statusCode === 200) {
        showToastPromisify({
          title: '点赞成功',
          icon: 'success',
        })
        this.setData({
          feedDynamicData: list
        })
      } else {
        showToastPromisify({
          title: '点赞失败',
          icon: 'fail',
        })
      }
    }
  },

  /**
   * 搜集formId
   */
  bindSubmit: function (e) {
    let {
      formId
    } = e.detail.formId
    formId && app.data.formID.push(formId);
  },

  /**
   * 跳转发布动态
   */
  goPageWithCircleDynamicRelease: function (e) {
    jumpToPromisify('circle-dynamic-release', 'navigate', {
      circleId: e.currentTarget.dataset.circleid
    })
  },

  /**
   * 跳转留言页
   */
  goPageWithMessageContent: function (e) {
    let {
      userid,
      navtitle
    } = e.currentTarget.dataset;
    jumpToPromisify('/subPackage_message/pages/message-content/message-content', 'navigate', {
      with_user_id: userid,
      navTitle: navtitle
    }, true)
  },

  /**
   * 删除评论
   * @param {*} e
   */
  deleteComment: async function (e) {

    let {
      commentid,
      index,
      userid,
      commentindex,
    } = e.currentTarget.dataset;
    let {
      feedDynamicData
    } = this.data;
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes('userId')) {
      let {
        userId
      } = await getStoragePromisify('userId');
      if (Number(userId) === Number(userid)) {
        let affirmComment = await showModalPromisify({
          title: '提示',
          content: '是否删除评论?'
        });
        if (affirmComment.confirm) {
          let result = await createOrDeleteComment({
            type: -1,
            comment_id: commentid
          })
          if (result.statusCode === 200) {
            if (result.data.detail === '操作成功') {
              showToastPromisify({
                title: '删除成功',
                image: '/images/icon/success.png'
              })
              feedDynamicData[index].comment.splice(commentindex, 1);
              feedDynamicData[index].comment_count -= 1;
              await sleep(1500);
              this.setData({
                feedDynamicData
              })
            } else {
              showToastPromisify({
                title: '删除失败',
                image: '/images/icon/fail.png'
              })
            }
          } else {
            showToastPromisify({
              title: '删除失败',
              image: '/images/icon/fail.png'
            })
          }
        }
      }
    } else {
      let errModal = await showModalPromisify({
        title: '提示',
        content: '账号异常,点击确认返回首页'
      })
      errModal.confirm && jumpToPromisify('index', 'reLaunch')
    }
  }

})
