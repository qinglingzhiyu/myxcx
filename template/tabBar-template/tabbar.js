//初始化数据
function tabbarinit() {
  return [
    {
      "current": 0,
      "pagePath": "index",
      "iconPath": "/images/tabbar-icon/main.png",
      "selectedIconPath": "/images/tabbar-icon/main_on.png",
      "text": "首页",
      "userInfo":"",
      "withPoint":false
    },
    {
      "current": 0,
      "pagePath": "circle",
      "iconPath": "/images/tabbar-icon/circle.png",
      "selectedIconPath": "/images/tabbar-icon/circle_on.png",
      "text": "圈子",
      "userInfo": "",
      "withPoint": false
    },
    {
      "current": 0,
      "pagePath": "message",
      "iconPath": "/images/tabbar-icon/message.png",
      "selectedIconPath": "/images/tabbar-icon/message_on.png",
      "text": "消息",
      "userInfo": "getUserInfo",
      "withPoint": false
    },
    {
      "current": 0,
      "pagePath": "my",
      "iconPath": "/images/tabbar-icon/my.png",
      "selectedIconPath": "/images/tabbar-icon/my_on.png",
      "text": "我的",
      "userInfo": "getUserInfo",
      "withPoint": false
    }
  ]
}

module.exports = {
  tabbarmain: function (bindName = "tabdata", id, target,status) {
    var that = target;
    var bindData = {};
    var otabbar = tabbarinit();
    otabbar[id]['iconPath'] = otabbar[id]['selectedIconPath']//换当前的icon
    otabbar[id]['current'] = 1;
    otabbar[2]["withPoint"] = status;
    bindData[bindName] = otabbar
    that.setData({ bindData });
  },
}