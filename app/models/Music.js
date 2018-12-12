var util = require('util')
var url = require('url')
var fs = require('fs')
var mysql  = require('mysql');
var path = require('path')
var config = require(path.join(__dirname, '../../app/config'))
var baseModel = require(path.join(config.path.fish, 'mysql/baseModel'))

class Music extends baseModel.model {
    getTable() {
        return 'lab_music'
    }
    fields() {
        var fields = ['id', 'uid', 'music_id', 'music_category_id', 'subject', 'summary', 'author', 'url', 'created',
            'status', 'top', 'hot' , 'photo']
        return fields;
    }
    attributeLabels() {
        return {
            id: 'ID',
            uid: '用户 ID',
            music_id: '作品 ID',
            music_category_id: '所属分类 ID',
            subject: '作品名称',
            summary: '作品简介',
            author: '创作者',
            url: '作品地址',
            created: '创建时间',
            status: '状态',
            top: '是否置顶',
            hot: '是否热门',
            photo: '封面地址'
        }
    }
}
exports.model = new Music()
