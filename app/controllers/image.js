const Topic = require('../models/Topic.js')
const Image = require('../models/Image.js')
const Maimeng = require('../../lib/Maimeng')
const R = require('ramda')

var Fish = {}

var actions = {
  params: {},

  /**
   * 图片专题页
   *
   * @returns {Object}
   */
  topic: async function () {
    return {}
  },

  /**
   * 图片专题详情
   *
   * @returns {Object}
   */
  topicview: async function () {
    let id = this.params.request.get.id ? parseInt(this.params.request.get.id) : 0
    let topic = await Topic.model.find().select('id, title, create_time').where('id = ' + id).one()
    return {
      id: id,
      title: topic.title,
    }
  },

  /**
   * 获得图片专题
   *
   * @returns {Topic[]} 图片专题对象组成的数组
   */
  gettopics: async function () {
    let page = this.params.request.get.page ? parseInt(this.params.request.get.page) : 1
    let pageSize = this.params.request.get.page_size ? parseInt(this.params.request.get.page_size) : 20
    let offset = pageSize * (page - 1)
    let topics = await Topic.model.find()
      .select('id, title, cover')
      .limit(offset, pageSize)
      .order('id DESC')
      .all()
    R.map((topic) => {
      topic.cover = '/image/topic/' + topic.cover
    }, topics)
    return topics
  },

  /**
   * 获得专题详情
   *
   * @returns {Object} 图片信息
   */
  gettopicimages: async function () {
    if (!this.params.request.get.id) {
      return []
    }
    let id = parseInt(this.params.request.get.id)
    let images = await Image.model.find()
      .select('id, p_id, name, url, create_time')
      .where('topic_id = ?', [id])
      .order('id ASC')
      .all()
    R.map((image) => {
      image.url = '/image/topic/' + image.url
    }, images)
    return images
  },
  show: async function () {
    let name = this.params.request.get.name || '美图'
    let image = this.params.request.get.image
    let ect = this.params.request.get.ect
    return {
      'name': name,
      'image': Maimeng.static + '/' + image + '.' + ect,
    }
  },
  search: async function () {
    let str = this.params.request.get.s || '美图'
    let page = this.params.request.get.page || 1
    let pageSize = this.params.request.get.page_size || 100
    let images = await Maimeng.searchAsync(str, page, pageSize)
    if (images.code !== 0) {
      return ''
    }
    let imagesCount = images.data.length
    if (imagesCount === 0) {
      return ''
    }
    let random = Math.floor(Math.random() * imagesCount)
    let image = images.data[random].images
    let index = image.lastIndexOf('/')
    image = image.substring(index + 1)
    let imageInfo = image.split('.')
    image = imageInfo[0]
    return encodeURI(`http://127.0.0.1:8989/image/show?name=${str}&image=${image}&ect=${imageInfo.pop()}`)
  },
}

exports.actions = actions
