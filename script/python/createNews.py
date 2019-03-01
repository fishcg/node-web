# -*- coding: utf-8 -*-
# 爬取动漫之家 pixiv 图片，爬取动漫之家新闻，参考页面：https://news.dmzj.com/p2.html

import requests
from bs4 import BeautifulSoup
import os
import time
import hashlib
import re
import zipfile
import shutil
import base64
import sys
from db import Mysql

Mysql = Mysql()

class DmzjCrawler():
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

    def __init__(self, oldUrl):
        self.oldUrl = oldUrl

    def start(self):
        url = 'https://news.dmzj.com/p1.html'
        newsID = self.createNews(url)
        print(newsID)

    # 获得最新新闻链接
    def createNews(self, url):
        try:
            r = self.get(url)
            html = r.text
            soup = BeautifulSoup(html, 'html.parser')
            # 获取相关文章的链接
            linkHtml = soup.find('a', class_='dec_img')
            viewUrl = str(linkHtml['href'])
            if self.oldUrl == viewUrl:
                return -2
            image = str(linkHtml.img['src'])
            subject = str(linkHtml['title']).replace("'", "''")
            introHtml = linkHtml.parent.parent
            intro = introHtml.find('p', class_='com_about').get_text().replace("'", "''")
            catalogName = introHtml.find('span', class_='bq_ico').get_text()
            if catalogName == '美图':
                # 美图类型不获取
                return -2
            category_id = self.getCatalog(catalogName)
            content = self.getNewsView(viewUrl)
            now = int(time.time())
            user_id = 1
            author = '网络'
            sql = "INSERT INTO news (user_id, author, catalog_id, title, intro, content, cover, ctime, utime) VALUES (%s, '%s', %s, '%s', '%s', '%s', '%s', %s, %s)" % (user_id, author, category_id, subject, intro, content, image, now, now)
            newsID = Mysql.create(sql)
            return '{ "id": ' +  str(newsID) + ', "url": "' + viewUrl + '"}'
        except Exception as e:
            # TODO: log
            # print(e)
            return -1
    # 获得新闻详情
    def getNewsView(self, url):
            r = self.get(url)
            html = r.text
            soup = BeautifulSoup(html, 'html.parser')
            contentHtml = soup.find('div', class_='news_content_con').find_all('p')
            content = ''
            for pContent in contentHtml:
                content += str(pContent)
            return content.replace("'", "''")

    # 获得分类 ID
    def getCatalog(self, var):
        return {
            '动画': 1,
            '漫画': 2,
            '小说': 3,
            '周边': 4,
            '声优': 5,
            '音乐': 6,
            '游戏': 7,
            '美图': 8,
            '漫展': 9,
            '杂类': 10,
        }.get(var, '-1')
    def get(self, url):
        r = requests.get(url, headers = self.headers)
        return r

# 开启任务
# TODO: 开启多任务应考虑并发量
oldUrl = sys.argv[1]
Dmzj = DmzjCrawler(oldUrl)
Dmzj.start()
