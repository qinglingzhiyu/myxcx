function e(e) {
  var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
  return function() {
    var n = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
    return new Promise(function(i, o) {
        n.success = t.success ? t.success(i) : function(e) {
            i(e);
        }, n.fail = t.fail ? t.fail(o) : function(e) {
            o(e);
        }, e(n);
    });
  };
}

module.exports = {
    loginPromisify: e(wx.login),
    requestPromisify: function() {
        var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
        return new Promise(function(t, n) {
            e.success = function(e) {
                t(e.data);
            }, e.fail = function(e) {
                n(e);
            }, e.method && "POST" === e.method.toUpperCase() && (e.header = e.header || {}, 
              e.header["Content-Type"] = "application/json"), wx.request(e);
        });
    },
    setClipboardDataPromisify: e(wx.setClipboardData),
    getStoragePromisify: e(wx.getStorage),
    getStorageInfoPromisify: e(wx.getStorageInfo),
    getSettingPromisify: e(wx.getSetting),
    getUseInfoPromisify: e(wx.getUserInfo),
    getShareInfoPromisify: e(wx.getShareInfo),
    getShowToastPromisify: e(wx.showToast),
    
};