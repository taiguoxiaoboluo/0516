# Style Sniffer 快速给别人用

## 方式 1：在线网页，最快

适合让别人上传图片 / 截图分析。

1. 打开 https://app.netlify.com/drop
2. 把项目里的 `web` 文件夹拖进去
3. 把生成的网址发给别人

说明：这种方式不需要服务器，图片分析可用；输入 URL 分析网页需要方式 2。

## 方式 2：本地 Web，功能完整

适合自己或同事在电脑上跑，支持图片分析和 URL 网页分析。

```bash
npm install
npm run web
```

然后打开终端里显示的本机地址，通常是：

```text
http://127.0.0.1:3000
```

如果想让同一 Wi-Fi 下的人访问：

```bash
npm run web:public
```

把终端里显示的内网地址发给对方。

## 方式 3：命令行

适合会用终端的人。

在项目目录里先安装成全局命令：

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
先装 Node.js，然后在项目目录运行 npm install 和 npm run web，打开终端里显示的网址；如果只想上传截图分析，也可以直接打开在线网页版本。
```
