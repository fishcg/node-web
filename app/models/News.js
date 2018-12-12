var util = require('util')
var url = require('url')
var fs = require('fs')
var mysql  = require('mysql');
var path = require('path')
var config = require(path.join(__dirname, '../../app/config.js'))
var baseModel = require(path.join(config.path.fish, 'mysql/baseModel.js'))

class News extends baseModel.model {
    getTable() {
        return 'news'
    }
}
exports.model = new News();
