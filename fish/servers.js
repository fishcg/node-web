var http = require('http')
var static = require('node-static')
var url = require('url')
var util = require('util')
var index = require('./public/index')



var file = new static.Server()
var handleReq = function (req, res) {
    console.log(req.files)
    if(url.parse(req.url).path=='/favicon.ico') return
    console.log(12)
    index.serve(req, res)
    // file.serve(req, res)
}

app.listen(8081, function (req, res) {

    console.log(req.files)
    if(url.parse(req.url).path=='/favicon.ico') return
    console.log(12)
    index.serve(req, res)

})

/*http.createServer(handleReq).listen(80, '127.0.0.1')*/
console.log('This servers is running !')