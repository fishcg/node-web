const path = require('path')
const config = require(path.join(__dirname, '../../app/config'))
const baseModel = require(path.join(config.path.fish, 'mysql/baseModel'))

class Image extends baseModel.model {
  getTable() {
    return 'lab_image'
  }
  fields() {
    let fields = ['id', 'p_id', 'url', 'topic_id', 'name', 'create_time', 'update_time']
    return fields
  }
  attributeLabels() {
    return {
      id: 'ID',
      p_id: 'P站 ID',
      url: '图片地址',
      topic_id: '归属专题 ID',
      name: '名称',
      create_time: '创建时间',
      update_time: '修改时间',
    }
  }
}

exports.model = new Image()
