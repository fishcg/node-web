const AC = require('./lib/Acfun.js')
const KS = require('./lib/Ks.js')
const Utils = require('./lib/Utils.js')
const Logger  = require('./lib/Logger')
const Config = require('./config/system.js')

// AcFun主播
const USER_IDS = [23512715]

const GIFTS = {
  cola: 17,  // 可乐
}

class ACLive {

  constructor() {

  }

  async sendGift(userID, giftID, batchSize) {
    let userinfo = await AC.getLiveUserinfo(userID)
    if (!userinfo) {
      // 若获取失败，则不做处理
      return
    }
    let liveID = userinfo.liveId !== undefined ? userinfo.liveId : 0
    this.beforeLive(userinfo)
    if (!liveID) {
      Logger.info(`发送 AcLive 礼物失败，${userID}, ${giftID}, ${batchSize}`)
      // 未开播不做处理
      return
    }
    // 若开播则送出礼物
    // 发送失败已做日志，此处不做判断
    let send = await KS.sendGift(liveID, giftID, batchSize)
    if (send) {
      Logger.info(`发送 AcLive 礼物成功，用户 ID：${userID}，用户名：${userinfo.name}， 礼物 ID：${giftID}，礼物数量：${batchSize}`)
    }
    this.afterLive(userinfo)
  }

  /**
   * 开播后执行的方法
   *
   * @returns {Promise<void>}
   */
  async  beforeLive(userinfo) {
    // let username = userinfo.name
    // TODO：开播机器人提醒
  }

  /**
   * 关播后执行的方法
   *
   * @returns {Promise<void>}
   */
  async afterLive(userinfo) {
    // let username = userinfo.name
    // TODO：关播机器人提醒
  }
}

const AcLive = new ACLive()

function task() {
  for (let userID of Config.SendGiftUserIDS) {
    // 每个主播送出一个 AC 可乐
    AcLive.sendGift(userID, GIFTS.cola, 1)
  }
}

// 每分钟执行一次任务
Utils.timingTask(task, Config.sendGiftCycle)
