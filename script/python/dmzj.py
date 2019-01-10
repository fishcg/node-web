# -*- coding: utf-8 -*-
# 爬取动漫之家 pixiv 图片，参考页面：https://news.dmzj.com/article/48293.html
# TODO: 建立数据表与数据关联，图片上传至第三方云服务器存储

import requests
from bs4 import BeautifulSoup
import os
import time
import hashlib
import re
from db import Mysql

Mysql = Mysql()

class DmzjCrawler():
    

    # 标识下载数量
    x = 0
    taskNum = 0
    # 爬取第几页，进程运行时自增
    page = 60
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
        self.taskMaxNum = config['taskMaxNum']
        self.sleepTime = config['sleepTime']
        self.downloadPath = config['downloadPath']

    # 创建文件夹
    def mkdir(self, path):
        folder = os.path.exists(path)
        if not folder: # 判断是否存在文件夹，如果不存在则创建为文件夹
            os.makedirs(path)

    # 下载图片
    def downloadImage(self, url, downloadPath, name):
        self.mkdir(downloadPath) 
        image = self.get(url)
        with open(os.path.join(downloadPath, name), 'wb') as f:
            f.write(image.content)
            f.close()
            self.x += 1
            # print('已下载第', self.x ,'张')

    # 获得图片地址
    def getImages(self, url, title):
        try:
            r = self.get(url)
            html = r.text
            soup = BeautifulSoup(html, 'html.parser')
            p_images = soup.find_all('p', style='text-align:center')
            if len(p_images) > 0:
                # 新增专题
                now = int(time.time())
                topic_id = Mysql.create("INSERT INTO lab_topic (title, create_time, update_time) VALUES ('%s', %s, %s)" % (title, now, now))
                images_values = [] 
                for p_image in p_images:
                    url = p_image.img['src']
                    p_name = p_image.img['alt']
                    p_object = re.search( r'id=(\d*)\..*', p_name, re.I)
                    p_id = int(p_object.group(1)) if p_object else 0
                    # 获取文件后缀名
                    etc = os.path.splitext(url)[1]
                    date = time.strftime('%Y%m%d',time.localtime(time.time()))
                    old_name = date + str(round(time.time() * 1000)) + p_name
                    name = hashlib.md5(old_name.encode(encoding='UTF-8')).hexdigest() + etc
                    downloadPath = os.path.join(self.downloadPath, date)
                    self.downloadImage(url, downloadPath, name)
                    save_path = date + '/' + name
                    images_values.append("('%s', %s, '%s', %s, %s, %s)" % (save_path, topic_id, p_name, p_id, now, now))
                create_sql = 'INSERT INTO lab_image (url, topic_id, name, p_id, create_time, update_time) VALUES ' + (','.join(images_values))
                Mysql.execute(create_sql)
                print('\033[1;32m--------------------已创建：', title, '\033[0m')
        except Exception as e:
            # TODO: log
            print(e)
            return
    # 获得图片页面
    def getImagesViewLinks(self, url):
        try:
            r = self.get(url)
            html = r.text
            soup = BeautifulSoup(html, 'html.parser')
            # 获取相关美图文章的链接
            links = soup.find_all('a', class_='dec_img')
            if len(links) == 0:
                self.page = -1
            for link in links:
                url = link['href']
                title = link['title']
                self.getImages(url, title)
            self.page -= 1
        except Exception as e:
            # TODO: log
            return

    def get(self, url):
        r = requests.get(url, headers = self.headers)
        return r

    def start(self):
        while (self.page > 0 and self.page < 61):
           url = 'https://news.dmzj.com/meituxinshang/p{}.html'.format(self.page)
           print('\033[1;35m--------------------当前页数：', self.page, '\033[0m')
           self.getImagesViewLinks(url)
           time.sleep(self.sleepTime)
        print('下载完成！')
