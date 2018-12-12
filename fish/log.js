var path = require('path')
var fs = require('fs')
var config = require('../app/config')

const __APP__ = 'app'

class Log {
  // 构造函数
  constructor(req) {
    this.request = req
  }
  
  /**
   * 新增普通日志
   *
   * @param {String} messsage 日志要记录的信息
   * @param {String} catelog 日志分类
   */
  info(messsage, catelog) {
    var catelog = catelog || __APP__
    var log_file_name = path.join(config.path.app, 'runtime/' + __APP__ + '.log')
    var now = new Date().toLocaleString()
    var info = JSON.stringify({
      time: now,
      header: this.request,
      message: messsage
    })
    var msg = `\n>>> ${info}`
    fs.appendFile(log_file_name, msg, 'utf8', function () {})
  }

  warn(messsage, catelog) {
    
  }
}

module.exports = Log
