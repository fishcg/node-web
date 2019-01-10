var url = require('url')
var fs = require('fs')
var config = require('../app/config')
var path  = require('path')
var Throw = require(path.join(config.path.fish, 'throw'))

const PATH = config.path

var Fish = {
    request: {
        method: null,
        url: null,
        get: {},
        post: {},
        files: [],
        header: {}
    },
    response: {
        'content-type': 'text/html; charset=utf-8',
        'Accept-Encoding': 'UTF-8'
    }
}

var app = {

}

/**
 * 根据请求进行响应
 *
 * @param req 请求信息
 * @param res 响应信息
 */
var createPage = async function (req, res) {

    // 初始化请求与响应参数
    await initFish(req)
    // 通过路由获取要请求的控制器及动作
    var actionInfo = await getActionInfo(req)
    // 获取动态数据
    var pageData = await getPageData(actionInfo)

    var pageString = ''
    // 获取静态数据
    if (pageData === undefined) {
        // 若动作或控制器不存在，404
        var viewPath = path.join(PATH.app, '404.html')
        pageString = fs.readFileSync(viewPath, 'utf-8')
    } else {
        pageString = await getStaticData(actionInfo, pageData)
    }
    if (typeof(pageString) !== 'string') {
        // TODO: 若不存在视图，暂时返回 json 格式数据
        Fish.response['content-type'] = 'text/json; charset=utf-8'
        pageString =  JSON.stringify(pageString)
    } else {
        Fish.response['content-type'] = 'text/html; charset=utf-8'
        // 动态数据填充
        pageString = await replaceDatas(pageData, pageString)
    }
   // return
    // 响应请求
    response(pageString, res)

}

/**
 * 获取请求动作信息
 *
 * @param req 请求信息
 * @return 数组对象
 */
async function getActionInfo(req) {
    var uri = url.parse(req.url)
    var page = uri.pathname.substring(1).split('/')
    if (page.length === 1 && !page[0]) {
        // @TODO: 默认控制器与方法，后面改为配置中对此项进行配置
        return ['music', 'index']
        // return ['news', 'index']
    }
    return page
}


/**
 * 获取页面动态数据
 *
 * @param {[]} actionInfo 路由信息
 * @returns {}|bool 若路由存在返回数据对象，否则返回 false
 */
async function getPageData(actionInfo) {
    var controllerPath = path.join(PATH.app, 'controllers/' + actionInfo[0] + '.js')
    // TODO: 暂时不考虑区分模块，以后需做完善
    // 判断控制器文件是否存在
    var exists = fs.existsSync(controllerPath)
    if (exists) {
        var controller = require(controllerPath)
        // var actionName = 'action' + actionInfo[1].substring(0, 1).toUpperCase() + actionInfo[1].substring(1)h)
        controller.actions.params = Fish;
        var func = 'controller.actions.' + actionInfo[1] + '()'
        //try {
            // console.log(func)
            var data = eval(func)
            /*if (!data) {
                var HttpException = new Throw.HttpException(400, '参数错误');
                throw  HttpException
            }*/
            return data
        //} catch (err) {
            console.log(err.message)
            return undefined
        //}
    } else {
        return undefined
    }
}

/**
 * 获取页面静态数据
 *
 * @todo 需要完善请求类型
 * @param {[]} actionInfo 路由信息
 * @param {[]} data 动态数据
 * @param string format 页面编码
 * @returns Object|string 若请求页面，则返回页面字符串，否则返回 json 对象
 */
async function getStaticData(actionInfo, data, format) {
    var format = format || 'utf-8'
    var viewPath = path.join(PATH.app, 'views/' + actionInfo[0] + '/' + actionInfo[1] + '.html')
    // 判断视图文件是否存在
    var exists = fs.existsSync(viewPath)
    if (exists) {
        var str = fs.readFileSync(viewPath, format)
        return str
    } else {
        var jsonObj = {
            'success': true,
            'code': 0,
            'info': data
        }
        return jsonObj
    }
}

/**
 * 将动态数据填充至静态页面
 *
 * @param {[]} data 动态页面数据
 * @param string str
 * @returns {Promise<*>}
 */
async function replaceDatas(data, str){
    if (!data) return str
    // $matchs = str.match(/{{.*?}}/g)
    var i = 0
    var length = Object.getOwnPropertyNames(data).length
    for (var attr in data) {
        str = str.replace(eval('/{=' + attr + '=}/g'), JSON.stringify(data[attr]))
    }
    return str
}

/**
 * 初始化请求参数与响应头信息
 *
 * @todo 还需要处理 post 参数和完善响应头
 * @param req
 * @returns {Promise<void>}
 */
async function initFish(req) {
    Fish.request.get = url.parse(req.url, true).query
    Fish.request.files = req.files
    Fish.request.post = req.body
    Fish.request.header = req.headers
    Fish.request.method = req.method
    Fish.request.url = req.url
    // console.log(req.body)
}

function response(data, res) {
    var contentType =  Fish.response.contentType
    res.writeHead(200, Fish.response)
    res.end(data)
}
exports.createPage = createPage