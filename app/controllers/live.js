const path = require('path')
const R = require('ramda')
const config = require(path.join(__dirname, '../config'))
const Live = require(path.join(config.path.app, 'models/Live'))
const Throw = require(path.join(config.path.fish, 'throw'))
const webParams = require('../webParams')
const { date } = require('../../lib/Utils')

let Fish = {}

let actions = {
  params: {},
  room: async function () {
    let id = this.params.request.get.id || 1
    // 查询数据
    let live = await Live.find().select('id, title, create_time').where('id = ?', id).order('id DESC').one()
    if (live) {
      live.date = date(live.create_time, 'yyyy-MM-dd HH:mm:ss')
      live.rtmpUrl = `rtmp://39.105.231.208/live/${live.id}`
    }
    return {live: JSON.stringify({live})}
  },
}

exports.actions = actions