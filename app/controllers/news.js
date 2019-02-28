const path = require('path')
const R = require('ramda')
const config = require(path.join(__dirname, '../config'))
const News = require(path.join(config.path.app, 'models/News'))
const Throw = require(path.join(config.path.fish, 'throw'))
const webParams = require('../webParams')

var Fish = {}

var actions = {
  params: {},
  index: async function () {
    let id = this.params.request.get.id
    // 查询数据
    let newss = await News.model.select('id, title, cover, intro, author').order('id DESC').limit(20).all()
    R.map((news) => {
      news.cover = webParams.staticPath + '/' + news.cover
    }, newss)
    return {news: JSON.stringify(newss)}
  },
  view: async function () {
    let id = this.params.request.get.id
    if (!id) {
      return false
    }
    let news = await News.model.select('id, title, cover, content').where('id = ?', [id]).one()
    return {
      id: news.id,
      title: news.title,
      content: news.content,
    }
  },
}

exports.actions = actions