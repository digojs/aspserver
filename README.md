一个即拿即用的 NODE 服务器框架，帮助快速搭建一个服务器，并自动拥有目录浏览等功能。

## 特性

1. 不同于 [Express](https://github.com/strongloop/express), AspServer 提供传统的基于文件的服务器构架，用户请求一个 .njs 文件后，该文件代码会执行并输出结果，就像传统的 PHP 和 ASP。
2. 支持同端口多站点。
3. 支持扩展插件。

## 基本用法

    var HttpServer = require('aspserver').HttpServer;
    
    var server = new HttpServer({
        port: 8080,
        physicalPath: "./"
    });

    server.start();

## 程序接口

新建一个 hello.njs 并写入：

	response.write("hello world");
	
请求此文件即可查看结果。
