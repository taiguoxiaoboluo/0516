# 用 Hugging Face Spaces 部署完整后端

Render / Koyeb 可能要求绑定信用卡。Hugging Face Spaces 的 Docker Space 更适合先免费跑起来。

## 创建 Space

1. 打开 https://huggingface.co/spaces
2. 登录或注册
3. 点击 **Create new Space**
4. 填写：

```text
Space name：style-sniffer
SDK：Docker
Visibility：Public
Hardware：CPU basic
```

5. 创建后，复制这个 Space 的 Git 地址。通常类似：

```text
https://huggingface.co/spaces/你的用户名/style-sniffer
```

## 推送代码

把 Space 地址发给 Codex，或者自己在本地运行：

```bash
git remote add hf https://huggingface.co/spaces/你的用户名/style-sniffer
git push hf main
```

如果 Hugging Face 要求密码，使用 Hugging Face Access Token，不要使用账号密码。

## 使用

部署完成后，Space 页面给出的公开网址就是完整后端版，支持：

- 图片 / 截图分析
- 网页 URL 嗅探
- JSON 生成 Prompt

首次打开或长时间不用后，免费实例可能需要几十秒冷启动。
