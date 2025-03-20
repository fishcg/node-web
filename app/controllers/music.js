const path = require('path')
const fs = require('fs')
const md5 = require('md5')
const R = require('ramda')
const webParams = require('../webParams')
const { Apm } = require('../../component/Apm')

var config = require(path.join(__dirname, '../config.js'))
var Music = require(path.join(config.path.app, 'models/Music.js'))
// var Throw = require(path.join(config.path.fish, 'throw.js'))
var mutils = require(path.join(config.path.fish, 'mutils.js'))

var date = mutils.date
var Fish = {}

const CATALOG_ID_ASMR = 100
const CATALOG_ID_VOCALOID = 101
const CATALOG_ID_LIGHT = 102

var actions = {
  params: {},
  index: async() => {
    // 查询推荐音数据
    let recommendSounds = await Music.model.find()
      .select('id, subject, author, views, photo')
      .where('top = ?', [1])
      .order('id DESC')
      .limit(4)
      .all()
    let newSounds = await Music.model.find()
      .select('id, subject, photo')
      .limit(5)
      .order('created DESC')
      .all()
    let vocaloidSounds = await Music.model.find()
      .select('id, subject, photo')
      .where('music_category_id = ?', [CATALOG_ID_ASMR])
      .limit(10)
      .order('RAND()')
      .all()
    let hotSounds = await Music.model.find()
      .select('id, subject, photo')
      .where('music_category_id = ?', [CATALOG_ID_VOCALOID])
      .limit(10)
      .order('RAND()')
      .all()
    let lightSounds = await Music.model.find()
      .select('id, subject, photo')
      .where('music_category_id = ?', [CATALOG_ID_LIGHT])
      .limit(10)
      .order('RAND()')
      .all()
    let otherSounds = await Music.model.find()
      .select('id, subject, photo')
      .limit(10)
      .order('RAND()')
      .all()
    let data = JSON.stringify({
      recommendSounds: recommendSounds,
      newSounds: newSounds,
      vocaloidSounds: vocaloidSounds,
      hotSounds: hotSounds,
      lightSounds: lightSounds,
      otherSounds: otherSounds,
    })
    return {
      data: data,
    }
  },

  // 播放页
  play: async function () {
    let id = this.params.request.get.id ? this.params.request.get.id : 1
    let sound = await Music.model.find()
      .select('id, subject, author, views, photo, url, created, replies')
      .where('id = ?', [id])
      .one()
    sound.created = date(sound.created, 'y-MM-dd HH:mm:ss')
    if (sound.url.substr(0, 5) === 'sound') {
      sound.url = webParams.staticPath + '/' + sound.url
    }
    return{
      fishData: JSON.stringify({ sound: sound }),
    }
  },
  create: async function () {
    return {}
  },
  upload: async function () {
    var files = this.params.request.files
    let filesName = ''
    if (files.length > 0) {
      filesName = path.join(config.path.app, 'runtime/files/' + files[0].originalname)
      fs.readFile(files[0].path, function (err, data) {
        fs.writeFile(filesName, data, function (err) {
          if (err) {
            Apm.captureError(err)
          }
        })
      })
    } else {
      return '文件上传失败'
    }
    return filesName
  },
  createmusic: async function () {
    var subject = this.params.request.post.subject
    var summary = this.params.request.post.summary
    var category_id = parseInt(this.params.request.post.categoryId)
    var photoFile = this.params.request.files.photo
    var soundFile = this.params.request.files.sound
    if (!photoFile) {
      return '请上传图片'
    }
    if (!soundFile) {
      return '请上传音频'
    }
    var photo = await
    uploadFile(photoFile, 'photo')
    var soundUrl = await
    uploadFile(soundFile, 'sound')
    if (!photo || !soundUrl) {
      return '文件类型错误'
    }
    // console.log(this.params.request.post)
    addMusic(subject, summary, category_id, photo, soundUrl)
    return '歌曲创建成功'
  }
}

async function addMusic(subject, summary, category_id, photo, soundUrl) {
    var music = Music.model
    var timeStamp = Date.parse(new Date()) / 1000;
    music.attrs = {
        uid: 349524,
        music_id: 233,
        music_category_id: category_id,
        subject: subject,
        summary: summary,
        author: '鱼鱼鱼',
        url: soundUrl,
        created: timeStamp,
        status: 1,
        top: 1,
        hot: 0,
        photo: photo
    }
    music.save()
    return {}
}

// 同步写入
async function uploadFile(files, type) {
    // @TODO: 需改造成可同时写多个文件
    if (files.length > 0) {
        // @ TODO: 之后改为临时文件，上传到 OSS 以后删除
        var exts = type === 'photo' ? ['.jpg', '.png', '.gif', '.jpeg'] : ['.mp3', '.wav', '.MP3', '.flac']
        var extname = path.extname(files[0].originalname);
        if (!mutils.inArray(extname, exts)) {
            return false
        }
        var fileName = '/tem/' + md5(new Date().getTime() + files[0].originalname) + extname;
        var filesPath = path.join(config.path.root, 'public' + fileName)
        var data = fs.readFileSync(files[0].path);
        fs.writeFileSync(filesPath, data);
    } else {
        return false
    }
    return fileName
}

// 异步写入
function uploadFileAsync(files, db) {
    // @TODO: 需改造成可同时写多个文件
    if (files.length > 0) {
        // @ TODO: 之后改为临时文件，上传到 OSS 以后删除

        var extname = path.extname(files[0].originalname);
        var fileName = '/tem/' + md5(new Date().getTime() + files[0].originalname) + extname;
        var filesPath = path.join(config.path.root, 'public' + fileName)
        fs.readFile(files[0].path, function (err, data) {
            fs.writeFile(filesPath, data, function (err) {
                if (err) {
                    console.log(err)
                } else {
                    db()
                }
            });
        });
    } else {
        return '文件上传失败'
    }
    return fileName
}

exports.actions = actions