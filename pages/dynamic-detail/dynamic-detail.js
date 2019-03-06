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
  getDynamicDetail,
  updateLike,
  deleteDynamic,
  isJoinCircle,
  createOrDeleteComment
} from '../../api/request.js'
import regeneratorRuntime, {
  async
} from '../../api/regeneratorRuntime.js'
import {
  jumpToPromisify,
  getStorageInfoPromisify,
  showLoadingPromisify,
  showToastPromisify,
  getStoragePromisify,
  setStoragePromisify,
  showModalPromisify
} from '../../api/promisify.js'
import {
  isAuthor,
  QiniuToken,
  sleep,
  MasterMapByThumbnail,
  thumbnailByMasterMap
} from '../../common/common.js'
import {
  isTestEnvironment
} from '../../api/config';

const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    del: false,
    isCloseByMask: false,
    delAffirm: false,
    isCloseByMask: false,
    isCloseBytoast: false,
    isComment: false,
    feedDetailData: {}, //页面数据
    commentInfo: {},
    isFromIndex: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    let {
      fromTo
    } = options;
    console.log('fromTo: ', fromTo);
    if (fromTo === 'index') this.setData({
      isFromIndex: true,
      options
    })
    else this.setData({
      options
    });
    wx.hideShareMenu(); //取消顶部分享
  },

  /**
   * 请求数据
   */
  getDataByRequest: async function (param) {
    showLoadingPromisify()
    let feedDetail = await getDynamicDetail({
      ...param
    });
    if (feedDetail.statusCode === 200) {
      //如果动态不存在,则提醒并退出
      if (feedDetail.data.detail === '动态不存在') {
        showToastPromisify({
          title: '动态已删除'
        })
        await sleep(1000);
        wx.navigateBack({
          delta: 1
        });
        return
      }
      //动态存在情况
      let ownUserId = wx.getStorageSync('userId');
      if (ownUserId == feedDetail.data.user_id) {
        feedDetail.data['isShowWithMore'] = true
      } else {
        feedDetail.data['isShowWithMore'] = false
      }
      feedDetail.data['isInterest'] = false
      feedDetail.data['avatar'] = MasterMapByThumbnail(feedDetail.data.avatar, 100);
      let images = MasterMapByThumbnail(feedDetail.data.images.split(',').filter(Boolean), 264)
      feedDetail.data['images'] = images.slice(0, 9);
      feedDetail.data.comment.map(item => {
        item['user_id_avatar'] = MasterMapByThumbnail(item.user_id_avatar, 60)
      });
      this.setData({
        feedDetailData: feedDetail.data
      })
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: async function () {
    let {
      feedId,
      selectFeedId
    } = this.data.options;
    try {
      if (typeof feedId === 'undefined' || !feedId) throw new Error(`feedId is ${feedId}`);
      if (!selectFeedId) this.getDataByRequest({
        feed_id: feedId
      });
      else this.getDataByRequest({
        select_feed_id: selectFeedId
      });
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
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (e) {
    let {
      sex,
      feedid,
      img
    } = e.target.dataset;
    let title = '';
    sex === '男' && (title = '快来看看这家孩子适不适合你家小美女？我亲自挑的!');
    sex === '女' && (title = '快来看看这家孩子适不适合你家帅哥？我亲自挑的!')
    return {
      title: title,
      path: `/pages/dynamic-detail/dynamic-detail?feedId=${feedid}`,
      imageUrl: img.split('?')[0]
    }
  },


  /**
   * 关闭mask
   */
  closeMask: function (e) {
    e.detail === 'close' && this.setData({
      isCloseByMask: false,
      isCloseBytoast: false,
      isComment: false,
      delAffirm: false,
    })
  },

  /**
   * 关闭toast 并跳转圈子规则
   */
  mytoast: function (e) {
    e.detail === 'close' && this.setData({
      isCloseByMask: false,
      isCloseBytoast: false
    })
    let {
      circle_id
    } = this.data.feedDetailData;
    e.detail === 'navgiteWithClose' && jumpToPromisify('circle-introduce', 'navigate', {
      circleId: circle_id
    }), this.setData({
      isCloseByMask: false,
      isCloseBytoast: false
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
      feedDetailData,
      commentInfo
    } = this.data
    if (statusCode === 201) {
      data.results['circle_id'] = commentInfo.circleid;
      feedDetailData.comment.push(data.results);
      feedDetailData.comment_count += 1;
      showToastPromisify({
        title: '评论成功'
      });
    } else {
      showToastPromisify({
        title: '评论失败'
      })
    };
    this.setData({
      isCloseByMask: false,
      isComment: false,
      feedDetailData
    })
  },

  /**
   * 跳转个人信息页
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
      feedid,
      commentto,
      userid
    } = info.currentTarget.dataset;
    try {
      let authorStatus = await isAuthor({
        encryptedData: info.detail.encryptedData,
        iv: info.detail.iv
      })
      if (authorStatus.statusCode === 'isOk' || authorStatus.statusCode === 200) {
        if (cometo === 'interest') {
          if (typeof feedid === 'undefined' || !feedid) throw new Error(`feedid is ${feedid}`);
          feedid && this.onInterest({
            feedid
          });
        } else if (cometo === 'comment') {
          if (typeof feedid === 'undefined' || !feedid) throw new Error(`feedid is ${feedid}`);
          if (typeof commentto === 'undefined') throw new Error(`commentto is ${commentto}`);
          if (typeof circleid === 'undefined' || !circleid) throw new Error(`circleid is ${circleid}`)
          feedid && circleid && this.onCommentByBtn({
            feedid,
            commentto,
            circleid,
            authorStatus
          })
        } else if (cometo === 'contact') {
          if (typeof circleid === 'undefined' || !circleid) throw new Error(`circleid is ${circleid}`);
          if (typeof userid === 'undefined' || !userid) throw new Error(`userid is ${userid}`);
          circleid && userid && this.contact({
            circleid,
            userid,
            authorStatus
          })
        }
      }
      if (authorStatus.statusCode === 200) QiniuToken()
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        title: '错误提示',
        content: String(error)
      })
    }
  },

  /**
   * 点击感兴趣操作
   * 
   */
  onInterest: async function (param) {
    let {
      feedid
    } = param
    let {
      feedDetailData
    } = this.data;
    feedDetailData.isInterest = true;
    feedDetailData.like += 1;
    showLoadingPromisify({
      title: '操作中'
    })
    try {
      let result = await updateLike({
        feed_id: feedid
      })
      if (typeof result === 'undefined' || !result) throw new Error(`updateLike api is ${result}`)
      if (result.statusCode === 200) {
        showToastPromisify({
          title: '点赞成功',
          icon: 'success',
        })
        this.setData({
          feedDetailData
        })
      } else {
        throw new Error(`statusCode of updateLike :${result.statusCode}`)
      }
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        title: '错误提示',
        content: String(error)
      })
    }
  },

  /**
   * 点击评论按钮
   * 如果加入圈子则评论
   * 如果未加入圈子则弹出入圈规则
   */
  onCommentByBtn: async function (param) {
    let {
      circleid,
      commentto,
      feedid,
      authorStatus
    } = param;
    try {
      let result = await isJoinCircle({
        circle_id: circleid
      });
      if (typeof result === 'undefined' || !result) throw new Error(`isJoinCircle api is ${result}`)
      if (result.statusCode === 200) {
        if (result.data.joined) {
          let myUserid = wx.getStorageSync('userId');
          if (typeof myUserid === 'undefined' || !myUserid) throw new Error(`本地userid不存在`);
          if (myUserid === commentto) commentto = 0;
          this.setData({
            isCloseByMask: true,
            isComment: true,
            commentInfo: {
              feed_id: feedid,
              comment_to: commentto,
              circleid,
            }
          })
        } else {
          authorStatus.statusCode === 'isOk' && (
            showToastPromisify({
              title: '您需要先加入该圈子才能评论哦'
            }), await sleep(1000), jumpToPromisify('circle-introduce', 'navigate', {
              circleId: circleid
            }), setStoragePromisify({
              jump: 'circleDynamic'
            })
          );
          authorStatus.statusCode === 200 && (
            this.setData({
              isCloseByMask: true,
              isCloseBytoast: true,
            }), setStoragePromisify({
              jump: 'circleDynamic'
            })
          )
        }
      } else {
        throw new Error(`isJoinCircle api statusCode:${result.statusCode}`)
      }
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        title: '错误提示',
        content: String(error)
      })
    }
  },

  /**
   * 联系TA
   * 如果加入圈子则跳转到留言页,
   * 如果未加入圈子则弹出入圈规则
   */
  contact: async function (param) {
    let {
      circleid,
      userid,
      authorStatus
    } = param;
    try {
      let result = await isJoinCircle({
        circle_id: circleid
      });
      if (typeof result === 'undefined' || !result) throw new Error(`isJoinCircle api is ${result}`);
      if (result.statusCode === 200) {
        if (result.data.joined) {
          let storageInfo = await getStorageInfoPromisify();
          if (storageInfo.keys.includes('userId')) {
            let myUserId = (await getStoragePromisify('userId')).userId;
            if (userid !== myUserId) jumpToPromisify('/subPackage_message/pages/message-content/message-content', 'navigate', {
              with_user_id: userid
            }, true)
            else showToastPromisify({
              title: '不能跟自己联系哦'
            })
          }
        } else {
          if (authorStatus.statusCode === 'isOk' || authorStatus.statusCode === 200) this.setData({
            isCloseByMask: true,
            isCloseBytoast: true,
          }), await setStoragePromisify({
            jump: 'messageContent',
            withUserid: userid
          })
        }
      } else {
        throw new Error(`isJoinCircle api statusCode:${result.statusCode}`)
      }
    } catch (error) {
      isTestEnvironment && await showModalPromisify({
        title: '错误提示',
        content: String(error)
      })
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
    } = this.data.feedDetailData;
    let imgs = thumbnailByMasterMap(images)
    wx.previewImage({
      urls: imgs,
      current: imgs[index]
    })
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
   * 跳回首页
   */
  goPageWithIndex: function () {
    let { options } = this.data;
    if (options.fromTo)  jumpToPromisify(1, 'back')
    else jumpToPromisify('index', 'reLaunch')
  },

  /**
   * 弹出删除动态弹窗
   */
  popDel: function () {
    this.setData({
      isCloseByMask: true,
      delAffirm: true,
    })

  },

  /**
   * 删除动态
   */
  deleteDynamic: async function (e) {
    let {
      feedid
    } = e.currentTarget.dataset;
    let result = await deleteDynamic({
      type: -1,
      feed_id: feedid
    })
    if (result.statusCode === 200) {
      showToastPromisify({
        title: '删除成功',
        image: '/images/icon/success.png'
      })
      this.setData({
        isCloseByMask: false,
        delAffirm: false,
      })

      wx.navigateBack({
        delta: 1
      })
    } else {
      showToastPromisify({
        title: '网络异常',
        image: '/images/icon/fail.png'
      })
    }
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
    } = e.currentTarget.dataset;
    let {
      feedDetailData
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
              feedDetailData.comment.splice(index, 1);
              feedDetailData.comment_count -= 1;
              await sleep(1500);
              this.setData({
                feedDetailData
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
      showModalPromisify({
        content: '请先点击评论内容授权哦!',
        showCancel: false
      })
    }
  }
})
