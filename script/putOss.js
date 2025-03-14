const util = require('util')
const fs = require('fs')
const path = require('path')
const oss = require('../component/OSS')
const Image = require('../app/models/Image')
const Music = require('../app/models/Music')
const Http =  require('../lib/Http')
const { hash_hmac, date } = require('../lib/Utils')
const { TEMP_PATH } = require('../config/system')

let writeFileASync = util.promisify(fs.writeFile)

/*fs.writeFile('test.mp3',data,res=>{
  console.log(res,11111);
})*/


const HEADERS = {
  'Host': 'static.missevan.com',
  'User-Agent': 'MissEvanApp/4.1.9 (iOS;12.0;iPhone9,1)',
  'Accept-Language': 'zh-Hans-CN;q=1',
  'Content-Type': 'application/x-www-form-urlencoded',
  'token': '5c6ad91e7b8e438d6d84e4b2|88d3d1cff2551560|1550506270|b58a4b155756a1dd'
}


async function download() {
  let result = await oss.get('topic/8aab3913b46e6015b123c18b4338872e.png', '../app/runtime/aa2.png')
}

async function putSound() {
  let musics = await Music.model.find()
    .select('id, url')
    .where('id < ?', [564])
    .all()
  let ossDir = 'sound/' + date(Date.parse(new Date()) / 1000, 'yyyyMM/dd') + '/'
  let downloadDir = path.join(TEMP_PATH, 'sound')
  if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir)
  let putMusicCout = 0
  for (let music of musics) {
    try {
      let musicUrl = music.url.replace('http://static.missevan.com', '')
      if (music.url.length === musicUrl.length) {
        continue
      }
      let extName = path.extname(musicUrl);
      let musicName = hash_hmac('md5', musicUrl) + extName
      let saveName =  ossDir + musicName
      let downloadName = path.join(downloadDir, musicName)
      let res = await Http.ajaxAsync({
        hostname: 'static.missevan.com',
        path: musicUrl,
        method: 'GET',
        headers: this.header,
      }, 'binary')
      if (!res.success) {
        continue
      }
      await writeFileASync(downloadName, res.data, 'binary')
      let body =  await oss.put(saveName, downloadName)
      if (200 === body.res.status) {
        music.url = saveName
        let saveData = await Music.model.updateByPk(music.id, { url: `'${saveName}'` })
        putMusicCout += 1
        // TODO: 修改失败是删除 OSS 相应资源
      }
      // 删除音频
      fs.unlink(downloadName, err => {})
    } catch (e) {
      console.log(e)
    }
  }
  console.log(`音频上传完成，上传数量${putMusicCout}`)
  return
}


async function putImage() {
  let images = await Image.model.find()
    .select('id, p_id, name, url, create_time')
    .where('topic_id >= ? AND topic_id <= ?', [2531, 999999])
    .order('id ASC')
    .all()
  console.log(`需要上传数量：${images.length}`)
  let i = 0
  for (let image of images) {
    let imagePath = './public/image/topic/' + image.url
    let ossPath = 'topic/' + image.url
    try {
      await oss.put(ossPath, imagePath)
    } catch (e) {
      console.log(`上传失败：${image.id}`)
    }
    console.log(i++)
  }
  console.log('上传完成！')
}
// putSound()
putImage()
return false
