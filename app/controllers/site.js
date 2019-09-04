var path = require('path')
var config = require(path.join(__dirname, '../config'))
var News = require(path.join(config.path.app, 'models/News'))
var async = require('async')
var Throw = require(path.join(config.path.fish, 'throw'))

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
  draw: function () {
    return {}
  },
  drawCard: function () {
    let allNewCoupon = 0
    let allRepeatCoupon = 0
    let newTimes = 0
    let repeatTimes = 0
    let getAllTimes = 0
    let data = this.params.request.post
    for (let i in data) {
      data[i] = parseInt(data[i])
    }
    let length = data.ssrNum + data.srNum + data.rNum + data.nNum
    let cards = []
    for (let i = 1; i <= length; i++) {
      let card = { id: i, repeateCoupon: 0 }
      if (i <= data.ssrNum) {
        card.repeateCoupon = data.ssrCoupon
      } else if (i <= (data.srNum + data.ssrNum)) {
        card.repeateCoupon = data.srCoupon
      } else if (i <= (data.srNum + data.ssrNum + data.rNum)) {
        card.repeateCoupon = data.rCoupon
      } else {
        card.repeateCoupon = data.nCoupon
      }
      cards.push(card)
    }
    let repeatCardIds = []

    for (let i = 0; i < data.drawTimes; i++) {
      let index = Math.floor((Math.random() * cards.length))
      let card  = cards[index]
      if (repeatCardIds.indexOf(card.id) === -1) {
        allNewCoupon += data.newCoupon
        newTimes += 1
        repeatCardIds.push(card.id)
      } else {
        repeatTimes += 1
        allRepeatCoupon += (data.newCoupon + card.repeateCoupon)
      }
      if (getAllTimes === 0 && repeatCardIds.length === length) {
        getAllTimes = i + 1
      }
    }
    let allCoupon = allNewCoupon + allRepeatCoupon
    return {
      allCoupon: allCoupon,
      allNewCoupon: allNewCoupon,
      allRepeatCoupon: allRepeatCoupon,
      newTimes: newTimes,
      repeatTimes: repeatTimes,
      getAllTimes: getAllTimes,
    }
  },
  draw2: function () {
    return {}
  },
  drawCard2: function () {
    let log = ''
    let allNewCoupon = 0
    let allRepeatCoupon = 0
    let newTimes = 0
    let repeatTimes = 0
    let getAllTimes = 0
    let data = this.params.request.post
    let maxRepeatTimes = data.maxRepeatTimes
    for (let i in data) {
      data[i] = parseInt(data[i])
    }
    let length = data.ssrNum + data.srNum + data.rNum + data.nNum
    let ssrCards = []
    let srCards = []
    let rCards = []
    let NCards = []
    for (let i = 1; i <= length; i++) {
      let card = { id: i, repeateCoupon: 0 }
      if (i <= data.ssrNum) {
        card.repeateCoupon = data.ssrCoupon
        ssrCards.push(card)
      } else if (i <= (data.srNum + data.ssrNum)) {
        card.repeateCoupon = data.srCoupon
        srCards.push(card)
      } else if (i <= (data.srNum + data.ssrNum + data.rNum)) {
        card.repeateCoupon = data.rCoupon
        rCards.push(card)
      } else {
        card.repeateCoupon = data.nCoupon
        NCards.push(card)
      }
    }

    let drawRepeatTimes = 0
    let baodiTimes = 0
    let continueTimes = 0
    let needNewCard = false

    let repeatCardIds = []
    /**
     * ssr sr r n
     * 8 16 48 28
     */
    let ssrP = data.ssrP
    let srP = data.srP
    let rP = data.rP
    let nP = data.nP

    for (let i = 0; i < data.drawTimes; i++) {
      let cards = []
      let p = Math.floor((Math.random() * (ssrP + srP + rP + nP)))
      if (ssrP != 0 && p <= ssrP) {
        cards = ssrCards
      } else if ((srP + ssrP) != 0 && p <= (srP + ssrP)) {
        cards = srCards
      } else if ((ssrP + srP + rP) !=0 && p <= (ssrP + srP + rP)) {
        cards = rCards
      } else {
        cards = NCards
      }
      let index = Math.floor((Math.random() * cards.length))
      let card  = cards[index]
      if (repeatCardIds.indexOf(card.id) === -1) {
        log += `<span style="color: #82c486">${i + 1 - continueTimes}. 抽到了新卡片</span>：${card.id}</br>`
        drawRepeatTimes = 0
        allNewCoupon += data.newCoupon
        newTimes += 1
        repeatCardIds.push(card.id)
        needNewCard = false
      } else {
        if (getAllTimes === 0) {
          // console.log('还未集齐重复了：' + card.id)
          // 未集齐卡时，采用保底策略
          if (needNewCard) {
            // 需要必顶为新卡时，重新获取卡直到为新卡
            data.drawTimes += 1
            continueTimes += 1
            continue
          }
          if (drawRepeatTimes >= maxRepeatTimes) {
            // 重复次数到保底时，计数清零，重新进行一次循环
            log += `<span style="color: #6ebdff">触发保底：</span>还未集齐时连续抽到了 ${maxRepeatTimes} 次重复卡</br>`
            needNewCard = true
            drawRepeatTimes = 0
            baodiTimes += 1
            log += `保底次数 +1，当前保底次数${baodiTimes}</br>`
            log += `当前重复卡数量 ${repeatCardIds.length}</br>`
            log += `当前重复卡为: ${repeatCardIds.join(', ')}</br>`
            continueTimes += 1
            data.drawTimes += 1
            continue
          } else {
            drawRepeatTimes += 1
          }
        }
        log += `<span style="color: #ff9a6c">${i + 1 - continueTimes}. 抽到了重复卡片</span>：${card.id}</br>`
        repeatTimes += 1
        allRepeatCoupon += (data.newCoupon + card.repeateCoupon)
      }
      if (getAllTimes === 0 && repeatCardIds.length === length) {
        log += `<b style="color: #6162cb">集齐啦</b></br>`
        getAllTimes = i + 1 - continueTimes
      }
    }
    let allCoupon = allNewCoupon + allRepeatCoupon
    // console.log('-------------------------------------------------')
    // console.log(log)
    return {
      allCoupon: allCoupon,
      allNewCoupon: allNewCoupon,
      allRepeatCoupon: allRepeatCoupon,
      newTimes: newTimes,
      repeatTimes: repeatTimes,
      getAllTimes: getAllTimes,
      baodiTimes: baodiTimes,
      loginfo: log,
    }
  },
}

function removeRepeatCard(cards, repeatCard) {

  return
}

exports.actions = actions