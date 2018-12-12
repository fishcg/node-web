var Fish = require('../fish/fish-route')
var path  = require('path')

exports.serve = function (req, res) {
    // 判断请求类型
    App(req, res)
}

function App(req, res) {
    // 渲染页面
    Fish.createPage(req, res)
}

function isStatic() {

}