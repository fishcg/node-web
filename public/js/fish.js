'use strict'

var Fish = {
  getDate: function (dataJsonStr) {
    var data = {}
    try {
      dataJsonStr = dataJsonStr.replace(/\n|\t|\r/g, "")
      data =  JSON.parse(dataJsonStr)
      // data = eval('({"msg":"信息","intro":"简介","age":10000})')
    } catch (e) {
      throw ('数据名 ' + dataJsonStr + '不存在')
    }
    return data
  },
  showModel: function (str) {
    document.body.innerHTML += '<div id="model"></div>'
    var html = str ? '<div class="tip">' + str + '</div>' : ''
    document.getElementById('model').innerHTML += html
  },
  hideModel: function () {
    document.getElementById('model').style.display = 'none'
  },

  // 滚动条在Y轴上的滚动距离
  getScrollTop: function (){
    return document.documentElement.scrollTop || document.body.scrollTop
  },

  // 文档的总高度
  getScrollHeight: function (){
    return document.documentElement.scrollHeight || document.body.scrollHeight
  },

  // 浏览器视口的高度
  getWindowHeight: function () {
    return document.documentElement.clientHeight || document.body.clientHeight

  },
q
  // 滚动条是否到了底部
  isBottom: function () {
    return this.getScrollTop() + this.getWindowHeight() == this.getScrollHeight()
  },
}
