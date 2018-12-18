# -*- coding: UTF-8 -*-

from dmzj import DmzjCrawler
from db import Mysql


# Mysql = Mysql()

# # data = Mysql.execute("SELECT * FROM news WHERE id =1")
# data2 = Mysql.findOne("SELECT * FROM news WHERE id = 1")
# print(data2)
# 配置
config = {
    'downloadPath': 'F:\\test', # 下载根目录
    'taskMaxNum': 5, # 多进程下载时并发数量
    'sleepTime': 1, # 防 BAN 延迟请求秒数
}

# 开启任务
# TODO: 开启多任务应考虑并发量
Dmzj = DmzjCrawler(config)
Dmzj.start()