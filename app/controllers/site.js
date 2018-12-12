var path = require('path')
var config = require(path.join(__dirname, '../config'))
var News = require(path.join(config.path.app, 'models/News'))
var async = require('async')
var Throw = require(path.join(config.path.fish, 'throw'))

var Fish = {}

var actions = {
    params: {},
    index: function () {
        var data = {
            'hello': 'Welcome !',
            'description': '配置数据库以后，尝试使用 yoursite.com/news/index 访问动态页面 :）'
        }
        return data
    }
}

exports.actions = actions