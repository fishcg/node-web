const Topic = require('../models/Topic.js')
const Maimeng = require('../../lib/Maimeng')
const R = require('ramda')

var Fish = {}

var actions = {
  params: {},
  topic: async function () {
    return {}
  },
  gettopics: async function () {
    let page = this.params.request.get.page ? parseInt(this.params.request.get.page) : 1
    let pageSize = this.params.request.get.page_size ? parseInt(this.params.request.get.page_size) : 20
    let offset = pageSize * (page - 1)
    let topics = await Topic.model.find()
      .select('id, title, cover')
      .limit(offset, pageSize)
      .order('id ASC')
      .all()
    R.map((topic) => {
      topic.cover = '/image/topic/' + topic.cover
    }, topics)
    return topics
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
