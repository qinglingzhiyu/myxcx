// components/emoticon/emotion.js
import { EmojiTextArray } from '../../common/const';
import { chunk } from '../../common/common';

Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    emjiList:[]
  },

  /**
   * 生命周期
   */
  lifetimes:{
    attached:function () {  }
  },

  /**
   * 所在页面的生命周期
   */
  pageLifetimes:{
    show:function () {
      let newArray = chunk(EmojiTextArray,20)
      console.log('aaaaa',newArray);
      this.setData({
        emjiList:newArray
      })
    }
  },



  /**
   * 组件的方法列表
   */
  methods: {
   

  }
})
