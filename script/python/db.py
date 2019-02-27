# -*- coding: utf-8 -*-

from config import mysql
import pymysql

class Mysql(): 
    def __init__(self):
        # 打开数据库连接
        # print('DB 开启连接')
        self.db = pymysql.connect(mysql['host'], mysql['user'], mysql['password'], mysql['database'])
        # 使用 cursor() 方法创建一个游标对象 cursor
        self.cursor = self.db.cursor()

    def __del__( self ):
        # print('DB 连接关闭')
        # 关闭数据库连接
        self.db.close()
    
    def execute(self, sql, *params):
        # 使用 execute() 方法执行 SQL 查询 
        querySql = sql
        try:
           # 执行 SQL 语句
           self.cursor.execute(querySql)
           # 提交到数据库执行
           self.db.commit()
           return self.cursor.rowcount
        except Exception as e:
           # 如果发生错误则回滚
           self.db.rollback()
           raise Exception(e)

    # WORKAROUND: 临时使用
    def create(self, sql, *params):
        # 使用 execute() 方法执行 SQL 查询 
        querySql = sql
        try:
           # 执行 SQL 语句
           self.cursor.execute(querySql)
           id = int(self.cursor.lastrowid)
           # 提交到数据库执行
           self.db.commit()
           return id
        except Exception as e:
           # print('SQL 执行异常', e)
           # 如果发生错误则回滚
           self.db.rollback()
           raise Exception(e)

    def findOne(self, sql, *params):
        self.execute(sql, params)
        # 使用 fetchone() 方法获取单条数据
        return self.cursor.fetchone()

    def findAll(self, sql, *params):
        self.execute(sql, params)
        # 使用 fetchall() 方法获取多条数据
        return self.cursor.fetchall()

    def count(self, sql, *params):
        return self.execute(sql, params)

    def exists(self, sql, *params):
        return self.count(sql, params) > 0
        