const Https = require('./Https')
const Logger  = require('./Logger')

const HEADERS = {
  'accept': 'application/json, text/plain, */*',
  'accept-encoding': 'gzip, deflate, br',
  'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,ja;q=0.6',
  'cache-control': 'no-cache',
  'Content-Length': '86',
  'Content-Type': 'application/x-www-form-urlencoded',
  'Host': 'api.kuaishouzt.com',
  'Origin': 'https://live.acfun.cn',
  'Pragma': 'no-cache',
  'Referer': 'https://live.acfun.cn/',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'cross-site',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
}



class Ks {

  constructor() {
    this.header = HEADERS
    this.CODES = {
      sendGiftSuccess: 1,
    }
  }

  /**
   * AcFun 直播送出直播礼物
   *
   * @param liveID
   * @param giftID
   * @param batchSize
   * @returns boolean 是否成功送出
   */
  async sendGift(liveID, giftID, batchSize) {
    let res = await Https.ajaxAsync({
      method: 'POST',
      hostname: 'api.kuaishouzt.com',
      path: "/rest/zt/live/web/gift/send?subBiz=mainApp&kpn=ACFUN_APP&kpf=PC_WEB&userId=494754&did=web_7890798013257F33&acfun.midground.api_st=ChZhY2Z1bi5taWRncm91bmQuYXBpLnN0EmAn4ArTkp3PyCCDNUtUY1DRrMxrWOk5zGFT4B_s_EaqIUl7Kwl7t6kM5ZufiPH0tTvwFONq2-59ws2e3dFd_AWiAE1nrPhaNsOk2B1qdTbVCmQYxvjqnNY-Jp9Z0sg-0EYaEgJmToUFlCLW1RKEhoaIs4ahnSIgXZoUcwvVO8t5mR3DXAZH-OQSb0kERr-NSJfQZmTYtFEoBTAB",
      headers: HEADERS,
      params: {
        visitorId: 494754,
        liveId: liveID,  // 'kgDX7p5gVgM',
        giftId: giftID,
        batchSize: batchSize,
        comboKey: '17_17_1607352419109',  // FIXME: 该参数存疑，应该是礼物连击 ID，写死可能造成请求失败，需要修复
      },
    })
    if (!res || !res.success) {
      let errMsg = !res ? '网络请求失败' : res.error_msg
      Logger.error(`直播送礼物失败，liveID：${liveID}，${errMsg}`)
      return null
    }
    let sendRes = JSON.parse(res.data)
    return sendRes.result === this.CODES.sendGiftSuccess
  }
}

module.exports = new Ks()
