# Style Sniffer 快速给别人用

## 方式 1：在线网页，最快但只适合图片

适合让别人上传图片 / 截图分析。

打开这个网址：

```text
https://cool-lamington-b047c4.netlify.app
```

说明：在线网页不用安装，图片分析可用；输入 URL 分析网页需要方式 2。

## 方式 2：本地 Web，功能完整但只要三步

适合自己或同事在电脑上跑，支持图片分析和 URL 网页 / HTML 分析。

### 1. 先下载两个东西

安装：[Node.js 安装包](https://nodejs.org)

下载：[项目包](https://github.com/taiguoxiaoboluo/0516/archive/refs/heads/main.zip)

Node.js 选择 LTS 版本。项目包下载后解压。

### 2. 在项目文件夹里复制两行命令

Mac：在文件夹空白处右键，选择“新建位于文件夹位置的终端窗口”。

Windows：在文件夹地址栏输入 `cmd`，然后回车。

在终端里复制运行：

```bash
npm install
npm run web
```

### 3. 回到浏览器打开本地网页

```text
http://127.0.0.1:3000
```

如果想让同一 Wi-Fi 下的人访问你电脑上的服务：

```bash
npm run web:public
```

把终端里显示的内网地址发给对方。

## 方式 3：命令行，适合会用终端的人

在项目目录里安装成全局命令：

```bash
npm install -g .
```

启动 Web：

```bash
style-sniffer web
```

分析一个网页并保存结果：

```bash
style-sniffer sniff example.com --save --prompt --css
```

查看可输出的结构：

```bash
style-sniffer schema
```

## 可以直接发给别人的一句话

```text
只上传截图就打开 https://cool-lamington-b047c4.netlify.app；如果要输入网页 URL 分析 HTML/CSS，就先装 Node.js，再下载项目包，在项目文件夹里复制运行 npm install 和 npm run web，最后打开 http://127.0.0.1:3000。
```
