const path = require('path')
const R = require('ramda')
const config = require(path.join(__dirname, '../config'))
const News = require(path.join(config.path.app, 'models/News'))
const Throw = require(path.join(config.path.fish, 'throw'))
const webParams = require('../webParams')
const { date } = require('../../lib/Utils')

var Fish = {}

var actions = {
  params: {},
  index: async function () {
    let id = this.params.request.get.id
    // 查询数据
    let newss = await News.model.find().select('id, title, ctime, cover, intro, author').order('id DESC').limit(20).all()
    R.map((news) => {
      news.cover = webParams.staticPath + '/' + news.cover
      news.citme = date(news.ctime, 'yyyy-MM-dd HH:mm:ss')
    }, newss)
    return {news: JSON.stringify(newss)}
  },
  view: async function () {
    let id = this.params.request.get.id
    if (!id) {
      return false
    }
    let news = await News.model.find().select('id, title, cover, content').where('id = ?', [id]).one()
    return {
      id: news.id,
      title: news.title,
      content: news.content,
    }
  },
}

exports.actions = actions