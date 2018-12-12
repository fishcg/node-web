const path = require('path')
const fs = require('fs')
const R = require('ramda')
const superagent = require('superagent')
const https = require("https")
var iconv = require("iconv-lite");
var querystring = require("querystring")
var syncRequest = require('sync-request')

const config = require(path.join(__dirname, '../config.js'))
const mutils = require(path.join(config.path.fish, 'mutils.js'))
const Log = require(path.join(config.path.fish, 'log.js'))

const MAOER_DOMAIN = 'www.missevan.com'
const MAOER_STATIC = 'http://static.missevan.com'

// @todo: 需要在基类定义
var Fish = {}
var date = mutils.date

var actions = {
    params: {},
    index: async function () {
        let idsStr = this .params.request.get.ids || '337512,2,156,4,337511,349524,337512,337513,327511,427511,467523,567523'
        let ids = idsStr.split(',')
        let sounds = []
        let url = MAOER_DOMAIN + '/sound/getsound'
        for (let id of ids) {
            let result = await superagent.get(url).query({soundid: id}).set('Accept', 'application/json')
            let data = JSON.parse(result.text)
            let sound = {
                url: MAOER_STATIC + '/sound/' + data.info.sound.soundurl,
                image: data.info.sound.front_cover,
                subject: data.info.sound.soundstr
            }
            sounds.push(sound)
        }
        return {
            sounds: sounds
        }
    },
    login: async function () {
        /*let url = 'https://' + MAOER_DOMAIN + '/account/login'
        const postData = querystring.stringify({
            login_name: '15685598480',
            password: 'cg147258',
            remember_me: '1'
        })
        var res = syncRequest('POST', url, {
            headers: {
                // 'user-agent': 'example-user-agent',
                'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'
            },
            body: postData
        })
        console.log(res.headers)*/

        const options = {
            hostname: 'www.missevan.com',
            path: '/account/login',
            method: 'POST',
            headers:{
                'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'
            }
        }
        const postData = querystring.stringify({
            login_name: '15685598480',
            password: 'cg147258',
            remember_me: '1'
        })
        const req = https.request(options, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                console.log(`BODY: ${chunk}`);
            });
            res.on('end', () => {
                console.log('No more data in response.');
            });
        });
        req.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
        });
        req.write(postData);
        req.end();
       /* // 浏览器请求报文头部部分信息
        var browserMsg={
            "User-Agent":"Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.62 Safari/537.36",
            'Content-Type':'application/x-www-form-urlencoded'
        };
        let url = MAOER_DOMAIN + '/account/login'
        console.log(url)
        let result = await superagent.get(url).query().set(browserMsg).send({
            login_name: '15685598480',
            password: 'cg147258',
            remember_me: '1'
        })
        console.log(result.headers)*/
    },
    getSound: async function () {
        let idsStr = this.params.request.get.ids
        let ids = idsStr.split(',')
        let sounds = []
        let url = MAOER_DOMAIN + '/sound/getsound'
        for (let id of ids) {
            let result = await superagent.get(url).query({soundid: id}).set('Accept', 'application/json')
            let data = JSON.parse(result.text)
            let sound = {
                url: MAOER_STATIC + '/sound/' + data.info.sound.soundurl,
                image: data.info.sound.front_cover,
                subject: data.info.sound.soundstr
            }
            sounds.push(sound)
        }
        return sounds
    },
    createmusic: async function () {
        var subject = this.params.request.post.subject
        var summary = this.params.request.post.summary
        var category_id = parseInt(this.params.request.post.category_id)
        var photoFile = this.params.request.files.photo
        var soundFile = this.params.request.files.sound
        if (!photoFile) {
            return '请上传图片'
        }
        if (!soundFile) {
            return '请上传音频'
        }
        var photo = await uploadFile(photoFile, 'photo')
        var soundUrl = await uploadFile(soundFile, 'sound')
        if (!photo || !soundUrl) {
            return '文件类型错误'
        }
        // console.log(this.params.request.post)
        addMusic(subject, summary, category_id, photo, soundUrl)
        return '歌曲创建成功'
    }
}

exports.actions = actions
