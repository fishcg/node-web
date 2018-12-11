const path = require('path')
const Maimeng = require('../../lib/Maimeng')

var Fish = {}

var actions = {
    params: {},
    index: function () {
        var data = {
            'hello': 'Welcome !',
            'description': '配置数据库以后，尝试使用 yoursite.com/news/index 访问动态页面 :）'
        }
        return data
    },
    search: async function () {
    	let str = this.params.request.get.s || '美女'
		let page = this.params.request.get.page || 1
		let pageSize = this.params.request.get.page_size || 100
        let images = await Maimeng.searchAsync(str, page, pageSize)
        console.log(images)
        if (images.code !== 0) {
        	return ''
        }
        let images_count = images.data.length
        if (images_count === 0) {
        	return ''
        }
        let random = Math.floor(Math.random() * images_count)
        let image = images.data[random].images
        return image
    }
}

exports.actions = actions
