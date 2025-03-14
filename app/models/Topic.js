const path = require('path')
const config = require(path.join(__dirname, '../../app/config'))
const baseModel = require(path.join(config.path.fish, 'mysql/baseModel'))

class Topic extends baseModel.model {
  getTable() {
    return 'lab_topic----------------5---------5---------5'
  }
  fields() {
    let fields = ['id', 'title', 'cover', 'create_time', 'update_time', 'status', 'sort']
    return fields
  }
  attributeLabels() {
    return {
      id: 'ID',
      title: '专题名称',
      cover: '专题封面',
      create_time: '创建时间',
      update_time: '修改时间',
      status: '状态',
      sort: '排序',
    }
  }

  /**
   * 通过ID查询专题
   * @param {number} id 专题ID
   * @returns {Promise<Object>} 专题信息
   */
  async findById(id) {
    try {
      return await this.find()
        .select('id, title, cover, create_time, update_time, status')
        .where('id = ?', [id])
        .one()
    } catch (error) {
      throw new Error(`查询专题失败: ${error.message}`)
    }
  }
}

exports.model = new Topic()

