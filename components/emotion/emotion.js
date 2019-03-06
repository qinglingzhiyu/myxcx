// components/emoticon/emotion.js
import {
  EmojiTextArray
} from '../../common/const';
import {
  chunk
} from '../../common/common';

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
    emojiList: []
  },

  /**
   * 生命周期
   */
  lifetimes: {
    attached: function () {
      let newArray = chunk(EmojiTextArray, 20)
      this.setData({
        emojiList: newArray
      })
    }
  },

  /**
   * 所在页面的生命周期
   */
  pageLifetimes: {},

  /**
   * 组件的方法列表
   */
  methods: {
    chooseEmoji: function (e) {
      let {
        index,
        itemindex
      } = e.currentTarget.dataset
      let {
        emojiList
      } = this.data
      let emojiObj = emojiList[index][itemindex]
      this.triggerEvent('selectedEmoji', {
        emojiObj,
        type: 'add'
      })
    },

    delEmoji: function () {
      this.triggerEvent('selectedEmoji', {
        type: 'delete'
      })
    }

  }
})
