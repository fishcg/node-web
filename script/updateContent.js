"use strict";

const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')
const { promisify } = require('util')
const nedb = require('../lib/NedbConnection')
const logger = require('../lib/Logger')
const Email = require('../lib/Email')
const { base64_decode, date } = require('../lib/Utils')
const { TEMP_PATH, PYTHON, BASE_PATH } = require('../config/system')
const Topic = require('../app/models/Topic.js')
const Image = require('../app/models/Image.js')
const oss = require('../component/OSS')
const webParams = require('../app/webParams')

const execAsync = promisify(childProcess.exec)
const pixivPath = path.join(TEMP_PATH, 'pixiv')

// 邮件通知收件人
let recipients = ['353740902@qq.com']
/**
 * 发送 PIXIV 图片到指定邮箱
 *
 */
async function updateTopic() {
    let cmdPath = path.join(BASE_PATH, 'script/python/pixiv/newPixiv.py')
    let cmd = `${PYTHON} ${cmdPath} ${pixivPath}`;
    let stdoutInfo = await execAsync(cmd)
    let stdout = stdoutInfo.stdout.replace(/[\r\n]/g, '')
    if (stdout === 'None') {
      logger.warn('获取 PIXIV 图片页地址出错');
      return
    }
    let pixivInfo = JSON.parse(stdout)
    let pageUrl = pixivInfo.url
    let titleBase64 = pixivInfo.title
    let title = base64_decode(titleBase64)
    // 查询最新的图片页面记录
    let pixiv = await nedb.findOneASync({ doc_type: nedb.docTypes.PIXIV })
    if (!pixiv) {
      // 若不存在，创建新记录
      await nedb.insertASync({ doc_type: nedb.docTypes.PIXIV, page_url: pageUrl, isSend: false })
    } else if (pixiv.page_url === pageUrl && pixiv.isSend) {
      logger.info("need't add topic")
      return
    }
    logger.info('准备新增美图专题')
    // 若记录值不同，替换为最新图片页面地址并下载
    await nedb.updateASync({ doc_type: nedb.docTypes.PIXIV}, { $set: { page_url: pageUrl } })
    let filesPath = await getPixivFile()
    if (!filesPath) {
      logger.warn('美图专题图片文件夹地址出错')
      return
    }
    let topic = null
    let imageCount = 0
    // 存入数据库并将图片上传至 OSS
    // TODO: 优化回调为 Promise
    fs.readdir(filesPath, async function (err, files) {
      if (err) {
        logger.error(err)
        return
      }
      //遍历读取到的文件列表
      let timeStamp = Date.parse(new Date()) / 1000
      for (let imageName of files) {
        let saveName = date(Date.parse(new Date()) / 1000, 'yyyyMMdd') + '/' + imageName
        let imagePath = path.join(filesPath, imageName)
        if (!topic) {
          // 创建专题
          topic = await createTopic(title, saveName, timeStamp)
          if (!topic) {
            continue
          }
        }
        await putImage(topic.insertId, title, timeStamp, saveName, imagePath)
        // 删除文件
        fs.unlink(imagePath, err => {})
        imageCount += 1
      }
      // 发送邮件通知维护工作完成
      // 修改为已发送状态
      await nedb.updateASync({ doc_type: nedb.docTypes.PIXIV}, { $set: { isSend: true } })
      let subject = '美图更新'
      let href = `<a href="${webParams.domain}/image/topicview?id=${topic.insertId}">${title}(${topic.insertId})</a>`
      let content = `<b style="color: #6c9e71">[更新主题]</b><br />
        <a href="${webParams.domain}/image/topicview?id=${topic.insertId}">${title}</a>(${topic.insertId})
        <br /><b style="color: #6c9e71">[图片数量]</b><br />${imageCount}`
      sendEmail(subject, content, recipients)
      fs.rmdir(filesPath, err => {})
      await logger.info(`专题美图更新完成：${title}(${topic.insertId})`)
    })
}

/**
 * 创建美图专题
 *
 * @param {String} title 专题名
 * @param {String} cover 封面图
 * @param {Number} timeStamp 创建时的时间戳
 * @returns {Promise<void>}
 */
async function createTopic(title, cover, timeStamp) {
  var topic = Topic.model
  topic.attrs = {
    title: title,
    cover: cover,
    create_time: timeStamp,
    update_time: timeStamp,
  }
  return await topic.save()
}

/**
 * 保存图片到数据库并上传至 OSS
 *
 * @param {Topic} topic 图片所属专题对象
 * @param {String} saveName 图片地址
 * @param {String} filePath 文件实际路径
 * @returns {Promise<void>}
 */
async function putImage(topicID, name, timeStamp, saveName, imagePath) {
  try {
    // 上传到 OSS
    let ossPath = 'topic/' + saveName
    let body =  await oss.put(ossPath, imagePath)
    if (200 !== body.res.status) {
      logger.warn(`专题 ${name}（${topicID}） 图片上传 OSS 失败，${body.res.statusMessage}`)
      return
    }
    var image = Image.model
    image.attrs = {
      p_id: null,
      url: saveName,
      topic_id: topicID,
      name: name,
      create_time: timeStamp,
      update_time: timeStamp,
    }
    let imageData = await image.save()
    // TODO: 保存失败删除对应 OSS 对象
  } catch (e) {
    logger.error(`创建图片失败：${e}`)
  }
}

/**
 * 发送内容更新邮件
 *
 * @param {String} subject 邮件标题
 * @param {String} content 邮件内容，支持 HTML
 * @param {String} recipients 收件人
 * @returns {Promise<void>}
 */
async function sendEmail(subject, content, recipients) {
  // 发送邮件通知维护工作完成
  let email = new Email(recipients)
  await email.send(subject, content)
}

/**
 * 获取 pixiv 图片文件夹地址
 *
 * @param pageUrl
 *
 * @returns {String} pixiv 图片压缩包地址
 */
async function getPixivFile() {
    let cmdPath = path.join(BASE_PATH, 'script/python/pixiv/getFile.py')
    let cmd = `${PYTHON} ${cmdPath} ${pixivPath}`;
    let stdoutInfo = await execAsync(cmd, { encoding: 'utf8' })
    let stdout = stdoutInfo.stdout.replace(/[\r\n]/g, '')
    if (stdout === 'None') {
        return null
    }
    return stdout
}
try {
  updateTopic()
  return
} catch(e) {
  logger.error(`美图投稿邮件错误，错误原因：${e.stack || e}`)
}

