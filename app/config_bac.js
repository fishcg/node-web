var path  = require('path');

// 路径配置
var root = path.join(__dirname, '../')
var app = path.join(root, 'app')
var fish = path.join(root, 'fish')

exports.path = {
    root: root,
    app: app,
    fish: fish,
}
// 邮件配置
exports.email = {
    service: 'xxx',
    user: 'xxxxx@xxx.com',
    password: 'xxxxxxxxxxxx',
}
// mysql 配置
exports.mysql = {
    host     : '127.0.0.1',
    user     : 'xxxxx',
    password : 'xxxxx',
    port: '3306',
    database: 'test',
}
