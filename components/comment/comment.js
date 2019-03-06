// components/comment/comment.js
import {
  createOrDeleteComment
} from '../../api/request.js'
import regeneratorRuntime from '../../api/regeneratorRuntime.js'
import {
  getStorageInfoPromisify,
  showToastPromisify,
  jumpToPromisify
} from '../../api/promisify.js'

const app = getApp();
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    commentInfo: {
      type: Object,
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    value:'',
    disabled:true,
    on:'',
    animatedType:'fadeInUp'
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 改变内容 
     */
    changeValue:function(e){
      let { value } = e.detail;
      if(value.length >0){
        this.setData({
          disabled: false,
          on: 'on'
        })
      }else{
        this.setData({
          disabled: true,
          on: ''
        })
      }
    },

    /**
     * 搜集formId 提交评论
     */
    bindSubmit: async function(e) {
      let {
        content
      } = e.detail.value;
      let {
        feed_id,
        comment_to
      } = this.data.commentInfo;
      if (content === '') {
        showToastPromisify({
          title: '内容不为空哦'
        })
      } else {
        let storageInfo = await getStorageInfoPromisify();
        if (storageInfo.keys.includes('Token')) {
          let result = await createOrDeleteComment({
            feed_id,
            comment_to,
            content,
            type: 0
          })
          this.triggerEvent('myComment', {
            result
          })

        } else {
          showToastPromisify({
            title: '未登录,请返回!'
          })
          jumpToPromisify('index', 'reLaunch')
        }
      }
      
      //收集fromid
      let {
        formId
      } = e.detail;
      formId && app.data.formID.push(formId);
    },
  }
})