# -*- coding: utf-8 -*-
# 爬取动漫之家 pixiv 图片，参考页面：https://news.dmzj.com/article/48293.html
# TODO: 建立数据表与数据关联，图片上传至第三方云服务器存储

import requests
from bs4 import BeautifulSoup
import os
import time
import hashlib
import re
import zipfile
import shutil
import sys

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
    def getImagesViewLinks(self, url, download = True):
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
            title = link['title']
            if download == False:
                return url
            return self.getImages(url, title)
        except Exception as e:
            print(e)
            # TODO: log
            return
    # 获得图片地址
    def getImages(self, url, title):
        try:
            r = self.get(url)
            html = r.text
            soup = BeautifulSoup(html, 'html.parser')
            p_images = soup.find_all('p', style='text-align: center;')
            if len(p_images) == 0:
                return None
            # 新增专题
            now = int(time.time())
            date = '{}{}'.format(time.strftime('%Y%m%d', time.localtime(now)),  now)
            for p_image in p_images:
                img = p_image.find('img')
                if not img:
                  continue
                url = img['src']
                p_name = img['alt']
                p_object = re.search( r'id=(\d*)\..*', p_name, re.I)
                p_id = int(p_object.group(1)) if p_object else 0
                # 获取文件后缀名
                etc = os.path.splitext(url)[1]
                old_name = date + str(round(time.time() * 1000)) + p_name
                name = hashlib.md5(old_name.encode(encoding='UTF-8')).hexdigest() + etc
                downloadPath = os.path.join(self.downloadPath, date)
                self.downloadImage(url, downloadPath, name)
            # print('\033[1;32m--------------------已创建：', title, '\033[0m')
            filesPath = self.downloadPath + '/' + date
            # 进行压缩
            # fileszipName = filesPath + '.zip'
            # self.zipDir(filesPath, fileszipName)
            return filesPath
        except Exception as e:
            # TODO: log
            print(e)
            return None

    # 下载图片
    def downloadImage(self, url, downloadPath, name):
        self.mkdir(downloadPath)
        image = self.get(url)
        with open(os.path.join(downloadPath, name), 'wb') as f:
            f.write(image.content)
            f.close()
            self.x += 1
    # 创建文件夹
    def mkdir(self, path):
        folder = os.path.exists(path)
        if not folder: # 判断是否存在文件夹，如果不存在则创建为文件夹
            os.makedirs(path)

    def zipDir(self, dirpath, outFullName):
        zip = zipfile.ZipFile(outFullName, 'w', zipfile.ZIP_DEFLATED)
        for path,dirnames,filenames in os.walk(dirpath):
            # 去掉目标跟路径，只对目标文件夹下边的文件及文件夹进行压缩
            fpath = path.replace(dirpath,'')
            for filename in filenames:
                zip.write(os.path.join(path,filename),os.path.join(fpath,filename))
        zip.close()
        # 删除文件夹
        # shutil.rmtree(dirpath)
    def get(self, url):
        r = requests.get(url, headers = self.headers)
        return r

    def start(self):
        url = 'https://news.dmzj.com/meituxinshang/p1.html'
        # print('\033[1;35m--------------------当前页数：', 1, '\033[0m')
        url = self.getImagesViewLinks(url, False)
        print(url)

    def startDowndoad(self):
        url = 'https://news.dmzj.com/meituxinshang/p1.html'
        dirPath = self.getImagesViewLinks(url)
        print(dirPath)

config = {
    'downloadPath': sys.argv[1] # 下载根目录
}

# 开启任务
# TODO: 开启多任务应考虑并发量
Dmzj = DmzjCrawler(config)
Dmzj.startDowndoad()