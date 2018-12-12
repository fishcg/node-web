/**
 * 异常类
 *
 */
var HttpException = function (httpCode, message, code)
{
    var code = code || -1
    this.httpCode = httpCode;
    this.message = message;
    this.code = code;
}

exports.HttpException = HttpException
