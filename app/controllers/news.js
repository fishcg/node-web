var path = require('path')
var path = require('path')
var config = require(path.join(__dirname, '../config'))
var News = require(path.join(config.path.app, 'models/News'))
var async = require('async')
var Throw = require(path.join(config.path.fish, 'throw'))

var Fish = {}

var actions = {
    params: {},
    index: async function () {
        var id = this.params.request.get.id
        // 查询数据
        var news = await News.model.select('id, title, cover, intro, creator').where('id < 10').all()
        console.log({news: news})
        return {news: news}
    },
    view: function () {
        var id = this.params.request.get.id
        if (!id) {
            return false
            // var HttpException = Throw.HttpException;
            throw 'error';
        }

        return new Promise((resolve, reject) => {
            var news = News.model.find.select('title, cover, intro').where('id = ?', [id]).all()
            resolve(news)
        })
        // 查询数据
        var news = News.model.find.select('title, cover, intro').where('id = ?', [id]).one()
        var news = News.findOne
        /*async.waterfall([
            function (callback) {
                var news = News.model.find.select('title, cover, intro').where('id = ?', [id]).one()
                callback(null, news);
            },
            function (news, null) {
             return 233
            }
        ], function (err) {
            console.log(err)
        })*/
        console.log(news)
        
        /*var news= null
        console.log(news)

        var data = {
            'name': news.title,
            'intro': news.intro
        }
        console.log(data)*/
        return {}
    },
    test: function () {
        return {
            fishData: {msg: "信息", intro: "简介", age: 10000}
        }
    }
}

exports.actions = actions