var mysql  = require('mysql');
var async = require('async')
var path = require('path')
var config = require(path.join(__dirname, '../../app/config.njs'))
var mutils = require(path.join(config.path.fish, 'mutils.njs'))

const DB_POOL = mysql.createPool(config.mysql)

class Model {
    // 构造函数
    constructor() {
        this.queryObj = {
            select: '*',
            where: '',
            params: [],
            order: '',
            limit: null
        }
        this.attrs = {}
    }
    attributeLabels() {
        return {}
    }
    fields() {
        return [];
    }
    getTable() {
        return ''
    }
    getDb() {
        return 'music'
    }
    find() {
        this.queryObj = {
            select: '*',
            where: '',
            params: [],
            order: '',
            limit: null
        }
        return this
    }
    select(str) {
        // @TODO: 需要预处理查询语句
        this.queryObj.select = str
        return this
    }
    where(str, params) {
        params = params || this.queryObj.params
        // @TODO: 需要预处理查询语句
        this.queryObj.where = str
        if (params.length > 0) {
            this.queryObj.params = params
        }
        return this
    }
    limit(number) {
        number = parseInt(number)
        if (number < 0) number = 0
        this.queryObj.limit = number
        return this
    }
    order(str) {
        this.queryObj.order = str
        return this
    }
    async one() {
        this.queryObj.limit = 1
        var data = await this.query()
        data = data[0]
        return data
    }
    async all() {
        return await this.query()
    }
    async save() {
        return await this.saveData()
    }
    async saveAsync(db) {
        var data = await this.saveData()
        db(data)
    }
    //
    async saveData() {
        var table = this.getTable()
        var db = this.getDb()
        var fieldsArr = this.fields()
        var fields = ''
        var values = ''
        var attrsNameArr = []
        var valuesArr = []
        var attrs = this.attrs
        for (var attr in attrs) {
            if (mutils.inArray(attr, fieldsArr)) {
                attrsNameArr.push(attr)
                valuesArr.push('"' + attrs[attr] + '"')
            }
        }
        fields = attrsNameArr.join(', ')
        values = valuesArr.join(', ')
        var sql = 'INSERT INTO `' + db + '`.`' + table + '` (' + fields + ') VALUES (' + values + ')'
        console.log(sql)
        var data = await this.queryDB(sql, this.queryObj.params)
        return data
    }

    async query() {
        var table = this.getTable()
        var db = this.getDb()
        var sql = 'SELECT ' + this.queryObj.select + ' FROM `' + db + '`.`' + table + '`';
        if (this.queryObj.where) {
            sql += ' WHERE ' + this.queryObj.where
        }
        if (this.queryObj.order) {
            sql += ' ORDER BY ' + this.queryObj.order
        }
        if (this.queryObj.limit !== null) {
            sql += ' LIMIT ' + this.queryObj.limit
        }
        console.log(sql)
        var data = await this.queryDB(sql, this.queryObj.params)
        return data
    }
    async queryDB(sql, params) {
        var that = this

        return new Promise((resolve, reject) => {
            DB_POOL.getConnection(function(err, connection) {
                if (err) {
                    reject(err)
                } else {
                    connection.query(sql, params, (err, rows) => {
                        if (err) {
                            reject(err)
                        } else {
                            // that.data = rows
                            resolve(rows)
                        }
                        // 结束会话
                        connection.release()
                    })
                }
            })
        })
    }
}
exports.model = Model;
