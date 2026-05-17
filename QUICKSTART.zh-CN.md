# Style Sniffer 快速给别人用

## 方式 1：在线网页，最快但只适合图片

适合让别人上传图片 / 截图分析。

打开这个网址：

```text
https://cool-lamington-b047c4.netlify.app
```

说明：在线网页不用安装，图片分析可用；输入 URL 分析网页需要方式 2。

## 方式 2：免安装本地工具包，功能完整

适合让别人输入网页 URL，读取 HTML / CSS 并分析风格。

普通用户不需要额外安装任何东西。

他们只需要：

1. 解压你发给他的工具包
2. 双击 `启动 Style Sniffer.command`
3. 浏览器打开后粘贴网页 URL

如果浏览器没有自动打开，手动打开：

```text
http://127.0.0.1:3000
```

## 你如何生成这个工具包

在你的项目目录里运行：

```bash
npm run package:mac
```

生成后会出现在：

```text
dist/Style Sniffer 本地工具-mac-arm64
```

这个文件夹就是给普通用户的免安装工具包。

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
只上传截图就打开 https://cool-lamington-b047c4.netlify.app；如果要输入网页 URL 分析 HTML/CSS，就解压免安装工具包，双击「启动 Style Sniffer.command」，浏览器打开后粘贴网页 URL。
```
