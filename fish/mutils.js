/**
 * 格式化时间
 *
 * @param {Object} time 时间戳
 * @param {Object} fmt 格式
 * @return {String} 格式化后的日期时间
 */
var date = function(time, fmt) {
    time = time === undefined ? new Date() : time * 1000;
    var now = new Date();
    if( (now - time)<=80000){
        return '刚刚'
    }
    if ((now - time) < 3600000) {
        return Math.ceil((now - time)/60000) + '分钟前'
    }
    time = typeof time == 'number' ? new Date(time) : time;
    fmt = fmt || 'yyyy-MM-dd HH:mm:ss';
    var obj =
        {
            'y': time.getFullYear(), // 年份，注意必须用getFullYear
            'M': time.getMonth() + 1, // 月份，注意是从0-11
            'd': time.getDate(), // 日期
            'q': Math.floor((time.getMonth() + 3) / 3), // 季度
            'w': time.getDay(), // 星期，注意是0-6
            'H': time.getHours(), // 24小时制
            'h': time.getHours() % 12 == 0 ? 12 : time.getHours() % 12, // 12小时制
            'm': time.getMinutes(), // 分钟
            's': time.getSeconds(), // 秒
            'S': time.getMilliseconds() // 毫秒
        };
    var week = ['天', '一', '二', '三', '四', '五', '六'];
    for(var i in obj)
    {
        fmt = fmt.replace(new RegExp(i+'+', 'g'), function(m)
        {
            var val = obj[i] + '';
            if(i == 'w') return (m.length > 2 ? '星期' : '周') + week[val];
            for(var j = 0, len = val.length; j < m.length - len; j++) val = '0' + val;
            return m.length == 1 ? val : val.substring(val.length - m.length);
        });
    }
    return fmt;
}

/**
 * 使用循环的方式判断一个元素是否存在于一个数组中
 *
 * @param {Object[]} arr 数组
 * @param {Object} value 元素值
 * @param {Boolean} validateType 是否验证类型
 * @return {Boolean} 是否为数组中元素
 */
var inArray = function (value, arr, validateType) {
    var type = type || false
    for(var i = 0; i < arr.length; i++){
        if((value === arr[i] && validateType) || (value == arr[i] && !validateType)){
            return true;
        }
    }
    return false;
}

exports.date = date;
exports.inArray = inArray;