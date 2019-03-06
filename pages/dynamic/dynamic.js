/**
 * Created by Terris
 * https://github.com/qinglingzhiyu
 *
 * @date: 2019-01-09
 * @flow
 *
 * description: dynamic 的逻辑
 *
 */

import {
  updateLike,
  isJoinCircle,
  deleteDynamic,
  getUserAllDynamic,
  createOrDeleteComment
} from '../../api/request.js'
import {
  jumpToPromisify,
  showToastPromisify,
  showModalPromisify,
  getStoragePromisify,
  setStoragePromisify,
  showLoadingPromisify,
  getStorageInfoPromisify
} from '../../api/promisify.js'
import regeneratorRuntime, {
  async
} from '../../api/regeneratorRuntime.js'
import {
  sleep,
  MasterMapByThumbnail,
  thumbnailByMasterMap
} from '../../common/common.js'
import {
  isTestEnvironment
} from '../../api/config';

const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    del: false,
    delAffirm: false,
    isCloseByMask: false,
    isComment: false,
    dynamicData: [], //动态数据
    page: 1, //当前页
    index: 0, //当前动态列表的位置
    commentInfo: {}, //评论信息
    userId: 0, //当前用户
    isEmpty: false,
    isEmptyByHe:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    let {
      navTitle,
      userId
    } = options;
    try {
      if (typeof userId === 'undefined' || !userId) throw new Error(`userId is ${userId}`)
      userId && this.setData({
        userId
      });
      navTitle && this.setData({
        navTitle
      })
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        title: '错误提示',
        content: String(error)
      })
    }

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: async function () {
    let {
      userId,
      navTitle
    } = this.data;
    navTitle && wx.setNavigationBarTitle({
      title: navTitle
    })
    try {
      let result = await this.getAllDynamic({
        user_id: userId,
        page: 1,
        navTitle
      });
      if (typeof result === 'undefined' || !result) throw new Error(`getAllDynamic 的return值${result}`)
      //获取动态的总页数
      let totalPages = Math.ceil(result.count / 5);
      this.setData({
        dynamicData: result.results,
        totalPages
      })
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        title: '错误提示',
        content: String(error)
      })
    }

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 请求页面数据
   */
  getAllDynamic: async function (param) {
    let _this = this;
    let {
      user_id,
      navTitle,
      page
    } = param;
    showLoadingPromisify()
    try {
      let result = user_id && await getUserAllDynamic({
        user_id,
        page
      });
      if (typeof result === 'undefined' || !result) throw new Error(`getUserAllDynamic api is ${result} param=${String(param)}`)
      if (result.statusCode === 200) {
        
        if (result.data.results.length > 0) {
          _this.setData({
            isEmpty: false
          })
        } else {
          let storageInfo = await getStorageInfoPromisify();
          if(storageInfo.keys.includes('userId')) {
            let { userId } = await getStoragePromisify('userId');
            Number(userId) === Number(user_id) && _this.setData({
              isEmpty: true,
              isEmptyByHe:false,
            });
            Number(userId) !== Number(user_id) && _this.setData({
              isEmpty: false,
              isEmptyByHe:true,
            });
          }
        }
        result.data.results.map((item) => {
          if (navTitle && navTitle === 'TA的动态') item['isown'] = false;
          else item['isown'] = true;
          item['avatar'] = MasterMapByThumbnail(item.avatar,100);
          let images = MasterMapByThumbnail(item.images.split(',').filter(Boolean),270)
          item['images'] =images.slice(0,9)
          if (item.content.gblen() >= 112) {
            item['isShowWithContent'] = true;
            item['isOpen'] = true;
          } else {
            item['isShowWithContent'] = false;
            item['isOpen'] = false;
          }
          item.comment.map(item1 => {
            item1['user_id_avatar'] = MasterMapByThumbnail(item1.user_id_avatar,60)
          });
          item['isInterest'] = false;
          item['del'] = false;
        })
        return result.data
      } else throw new Error(`statusCode of getUserAllDynamic is ${result.statusCode}`)
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        title: '错误提示',
        content: String(error)
      })
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
      dynamicData
    } = this.data;
    dynamicData.map((item, i) => {
      index === i && (item['isOpen'] = !item.isOpen)
    });
    this.setData({
      dynamicData
    });
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
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: async function () {
    let {
      page,
      dynamicData,
      userId,
      navTitle,
      totalPages
    } = this.data;
    if (totalPages === page) return await showToastPromisify({
      title:'暂无更多动态'
    })

    page += 1;
    try {
      let result = await this.getAllDynamic({
        user_id: userId,
        page,
        navTitle
      })
      if (typeof result === 'undefined' || !result) throw new Error(`getAllDynamic的return值:${result}`)
      result.results.map(item => {
        dynamicData.push(item)
      })
      this.setData({
        dynamicData,
        page
      }) 
    } catch (error) {
      isTestEnvironment &&await showModalPromisify({
        title:'错误提示',
        content:String(error)
      })
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (e) {
    let {
      feedid,
      img,
      sex,
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
   * 弹出上部弹窗
   */
  popDel: function (e) {
    let {
      index
    } = e.currentTarget.dataset;
    this.setData({
      isCloseByMask: true,
      delAffirm: true,
      index,
    })
  },


  /**
   * 确认删除
   */
  deleteAffirm: async function () {
    let {
      page,
      dynamicData,
      index
    } = this.data;
    let {
      feed_id,
      user_id
    } = dynamicData[index]
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes('Token')) {
      showLoadingPromisify({
        title: '操作中'
      })
      let result = await deleteDynamic({
        type: -1,
        feed_id
      })
      this.setData({
        isCloseByMask: false,
        delAffirm: false,
      })
      if (result.statusCode === 200) {
        showToastPromisify({
          title: '删除成功',
          image: '/images/icon/success.png'
        });
        wx.vibrateShort(); //删除成功手机短震动
        dynamicData.splice(index,1) //删除指定一项
        if (dynamicData.length === 0) this.setData({
          isEmpty:true
        })
        else this.setData({
          dynamicData
        })
        // await sleep(1000);
        // let data = await this.getAllDynamic({
        //   user_id,
        //   page
        // })
        // if (data) this.setData({
        //   dynamicData: data.results,
        // })
      } else showToastPromisify({
        title: '网络错误,请重试!'
      })
    } else {
      let errModel = await showModalPromisify({
        title:'提示',
        content:'账号异常,点击确认返回首页',
        showCancel:false
      })
      errModel.confirm && jumpToPromisify('index','reLaunch')
    }
  },

  /**
   * 点赞
   */
  onInterest: async function (e) {
    let {
      dynamicData
    } = this.data;
    let {
      index,
      feedid
    } = e.currentTarget.dataset;
    dynamicData[index].isInterest = true;
    dynamicData[index].like += 1;
    showLoadingPromisify({
      title: '操作中'
    })
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes('Token')) {
      let result = await updateLike({
        feed_id: feedid
      })
      if (result && result.statusCode === 200) {
        showToastPromisify({
          title: '点赞成功',
          icon: 'success',
        })
        this.setData({
          dynamicData
        })
      } else {
        showToastPromisify({
          title: '点赞失败',
          icon: 'fail',
        })
      }
    } else {
      let errModel = await showModalPromisify({
        title:'提示',
        content:'账号异常,点击确认返回首页',
        showCancel:false
      })
      errModel.confirm && jumpToPromisify('index','reLaunch')
    }
  },

  /**
   * 预览图片
   */
  goPreview: function (e) {
    let {
      imageindex,
      index
    } = e.currentTarget.dataset;
    let {
      dynamicData
    } = this.data;
    let imgs = thumbnailByMasterMap(dynamicData[index].images)
    wx.previewImage({
      urls: imgs,
      current: imgs[imageindex]
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
   * 保存formid
   */
  bindSubmit: async function (e) {
    let {
      formId
    } = e.detail;
    formId && app.data.formID.push(formId);
  },

  /**
   * 跳转圈子动态
   */
  goPageWithCircleDynamic: async function (e) {
    let {
      circleid,
      circlename
    } = e.currentTarget.dataset;
    let storageInfo = await getStorageInfoPromisify();
    if (storageInfo.keys.includes('Token')) {
      showLoadingPromisify()
      let result = await isJoinCircle({
        circle_id: circleid
      });
      if (!result) throw new Error(`isJoinCircle api is ${result}`);
      if (result.statusCode === 200) {
        if (result.data.joined) {
          jumpToPromisify('circle-dynamic', 'navigate', {
            circleId: circleid,
            navTitle: circlename,
          })
        } else {
          showToastPromisify({
            title: '您需要先加入该圈子才能评论哦'
          }), await sleep(1000), jumpToPromisify('circle-introduce', 'navigate', {
            circleId: circleid
          }), setStoragePromisify({
            jump: 'circleDynamic'
          })
        }
      } else showToastPromisify({
        title: '网络错误,请重试'
      })
    } else {
      let errModel = await showModalPromisify({
        title:'提示',
        content:'账号异常,点击确认返回首页',
        showCancel:false
      })
      errModel.confirm && jumpToPromisify('index','reLaunch')
    }
  },

  /**
   *  跳转动态详情页
   */
  goPageWithDynamicDetail: function (e) {
    jumpToPromisify('dynamic-detail', 'navigate', {
      circleId: e.currentTarget.dataset.circleid,
      feedId: e.currentTarget.dataset.feedid,
      fromTo: 'dynamic'
    })
  },

  /**
   * 关闭弹窗
   */
  closeMask: function (e) {
    e.detail === 'close' && this.setData({
      isCloseByMask: false,
      delAffirm: false,
      isComment: false
    })
  },

  /**
   * 评论
   */
  onComment: async function (e) {
    let {
      feedid,
      commentto,
      circleid,
      index,
    } = e.currentTarget.dataset;
    let isJoin = await isJoinCircle({
      circle_id: circleid
    });
    if (isJoin.statusCode === 200) {
      if (isJoin.data.joined) {
        this.setData({
          isCloseByMask: true,
          isComment: true,
          commentInfo: {
            feed_id: feedid,
            comment_to: commentto || 0,
            index,
            circleid
          }
        })
      } else {
        showToastPromisify({
          title: '您需要先加入该圈子才能评论哦'
        })
      }

    }

  },

  /**
   * 评论弹窗
   */
  openCommentToast: async function (e) {
    let {
      dynamicData,
      commentInfo
    } = this.data;
    let {
      statusCode,
      data
    } = e.detail.result;
    if (statusCode === 201) {
      showToastPromisify({
        title: '评论成功'
      });
      data.results['circle_id'] = commentInfo.circleid;
      if (dynamicData[commentInfo.index].comment.length < 5) {
        dynamicData[commentInfo.index].comment.push(data.results);
      }
      dynamicData[commentInfo.index].comment_count += 1;
      this.setData({
        dynamicData,
      })
    } else showToastPromisify({
      title: '评论失败'
    })
    this.setData({
      isCloseByMask: false,
      isComment: false,
    })
  },

  /**
   * 发布动态
   */
  goPageWithCircle: function () {
    jumpToPromisify('circle', 'reLaunch')
  },

  /**
   * 删除评论
   * @param {*} e
   */
  deleteComment: async function (e) {
    let {
      index,
      userid,
      commentid,
      commentindex
    } = e.currentTarget.dataset;
    let {
      dynamicData
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
              dynamicData[index].comment.splice(commentindex, 1);
              dynamicData[index].comment_count -= 1;
              await sleep(1500);
              this.setData({
                dynamicData
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
        content: '账号异常,点击确认返回首页'
      })
      if (errModal.confirm) {
        jumpToPromisify('index', 'reLaunch')
      }
    }
  }
})
