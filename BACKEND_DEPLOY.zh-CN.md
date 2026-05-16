# 部署网页 URL 嗅探后端

线上静态网页只能分析图片。要在线分析网页 URL，需要部署这个 Node.js + Playwright 后端。

## 推荐方式：Render

1. 打开 https://render.com
2. 注册或登录
3. 选择 **New** → **Blueprint**
4. 连接 GitHub 仓库：

```text
taiguoxiaoboluo/0516
```

5. Render 会读取仓库里的 `render.yaml` 和 `Dockerfile`
6. 点确认创建服务
7. 等部署完成

部署成功后，你会得到一个类似这样的地址：

```text
https://style-sniffer.onrender.com
```

这个 Render 地址支持完整功能：

- 图片 / 截图分析
- 网页 URL 嗅探
- JSON 生成 Prompt

## 如果手动创建服务

如果不用 Blueprint，手动创建 Web Service 时这样填：

```text
Runtime：Docker
Repository：taiguoxiaoboluo/0516
Branch：main
Dockerfile path：Dockerfile
Health check path：/api/health
```

环境变量可不填。服务会自动使用平台提供的 `PORT`，并监听 `0.0.0.0`。

## 部署后的使用方式

以后给别人用完整功能，发 Render 的网址。

Netlify 网址仍然适合只做图片 / 截图分析；Render 网址适合完整网页 URL 分析。
