var path = require('path')
var config = require(path.join(__dirname, '../../app/config.js'))
var baseModel = require(path.join(config.path.fish, 'mysql/baseModel.js'))

class News extends baseModel.model {
  getTable() {
    return 'news'
  }
  fields() {
    return['id', 'user_id', 'catalog_id', 'author', 'cover', 'title', 'intro', 'content',
      'ctime', 'utime', 'cltimes']
  }
  attributeLabels() {
    return {
      id: 'ID',
      user_id: '用户 ID',
      catalog_id: '所属分类 ID',
      author: '作者名称',
      title: '新闻标题',
      intro: '简介',
      cover: '封面地址',
      content: '内容',
      ctime: '创建时间',
      utime: '修改时间',
      cltimes: '发布时间',
    }
  }
}

exports.model = new News()