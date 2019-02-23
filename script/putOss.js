const oss = require('../component/OSS')
const Image = require('../app/models/Image')

async function download() {
  let result = await oss.get('topic/8aab3913b46e6015b123c18b4338872e.png', '../app/runtime/aa2.png')
}

async function put() {
  let images = await Image.model.find()
    .select('id, p_id, name, url, create_time')
    // .where('topic_id = ?', [567])
    .order('id ASC')
    .all()
  for (image of images) {
    let imagePath = '../public/image/topic/' + image.url
    let ossPath = 'topic/' + image.url
    // let output_file = '../app/runtime/aa.png'
    try {
      let res =  await oss.put(ossPath, imagePath)
    } catch (e) {
      console.log(`上传失败：${image.id}`)
    }
  }
  console.log('上传完成！')
}
put()
