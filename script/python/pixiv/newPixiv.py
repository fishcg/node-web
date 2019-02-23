# -*- coding: utf-8 -*-
# 爬取动漫之家 pixiv 图片，参考页面：https://news.dmzj.com/article/48293.html

import requests
from bs4 import BeautifulSoup
import os
import time
import hashlib
import re
import zipfile
import shutil
import sys
import base64

class DmzjCrawler():
    # 标识下载数量
    x = 0
    taskNum = 0
    # 爬取第几页，进程运行时自增
    page = 1
    # 请求头
    headers = {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'zh-CN,zh;q=0.9',
        'cache-control': 'max-age=0',
        'cookie': 'UM_distinctid=165d8713f431c-03be91a8ec41a-54103715-1fa400-165d8713f4532b; show_tip_1=0',
        'referer': 'https://news.dmzj.com/article/12875.html',
        'upgrade-insecure-requests': '1',
        'if-modified-since': 'Thu, 04 Jan 2018 01:57:35 GMT',
        'if-none-match': "5a4d8a0f-a939e",
        'user-agent': 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.75 Safari/537.36',
    }
    def __init__(self, config):
        self.downloadPath = config['downloadPath']
    # 获得图片页面
    def getImagesViewLinks(self, url):
        try:
            r = self.get(url)
            html = r.text
            soup = BeautifulSoup(html, 'html.parser')
            # 获取相关美图文章的链接
            links = soup.find_all('a', class_='dec_img')
            if len(links) == 0:
                return None
            link =  links[0]
            url = link['href'].replace('.html', '_all.html')
            title = base64.b64encode(link['title'].encode('utf-8')).decode()
            return '{ "url": "' +  url + '", "title": "' + title + '"}'
        except Exception as e:
            print(None)
            # TODO: log
            return

    def get(self, url):
        r = requests.get(url, headers = self.headers)
        return r

    def start(self):
        url = 'https://news.dmzj.com/meituxinshang/p1.html'
        # print('\033[1;35m--------------------当前页数：', 1, '\033[0m')
        url = self.getImagesViewLinks(url)
        print(url)

config = {
    'downloadPath': sys.argv[1] # 下载根目录
}

# 开启任务
# TODO: 开启多任务应考虑并发量
Dmzj = DmzjCrawler(config)
Dmzj.start()
