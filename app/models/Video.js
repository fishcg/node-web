const path = require('path')
const config = require(path.join(__dirname, '../../app/config'))
const baseModel = require(path.join(config.path.fish, 'mysql/baseModel'))

class Video extends baseModel.model {
  getTable() {
    return 'video'
  }
  fields() {
    let fields = ['id', 'cid', 'title', 'intro', 'cover', 'duration', 'path', 'ctime', 'utime', 'views', 'point', 'point_times', 'uid']
    return fields
  }
  attributeLabels() {
    return {
      id: 'ID',
      title: '名称',
    }
  }
}

module.exports = new Video()
// exports.model = new Video()
