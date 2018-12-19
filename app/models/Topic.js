const path = require('path')
const config = require(path.join(__dirname, '../../app/config'))
const baseModel = require(path.join(config.path.fish, 'mysql/baseModel'))

class Music extends baseModel.model {
  getTable() {
    return 'lab_topic'
  }
  fields() {
    let fields = ['id', 'title', 'cover', 'create_time', 'update_time']
    return fields
  }
  attributeLabels() {
    return {
      id: 'ID',
      title: '专题名称',
      cover: '专题封面',
      create_time: '创建时间',
      update_time: '修改时间',
    }
  }
}

exports.model = new Music()
