const path = require('path')
const config = require(path.join(__dirname, '../../app/config'))
const baseModel = require(path.join(config.path.fish, 'mysql/baseModel'))

class Live extends baseModel.model {
  getTable() {
    return 'lab_live'
  }
  fields() {
    let fields = ['id', 'room_id', 'title', 'status', 'create_time', 'modified_time']
    return fields
  }
  attributeLabels() {
    return {
      id: '用户 ID',
      room_id: '房间号',
      title: '房间名',
      status: '房间状态',  // 0：关闭；1：开播；2：录播
      create_time: '创建时间',
      modified_time: '修改时间',
    }
  }
}

module.exports = new Live()
// exports.model = new Music()
