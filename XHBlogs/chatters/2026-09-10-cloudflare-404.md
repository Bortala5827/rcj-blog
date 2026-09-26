---
title: 空 404 与不可见的构建配置
date: '2026-09-10 03:00:01'
tags:
- Cloudflare
- 部署
- 日常
mood: 思考
cover: /cover-default.svg
description: ''
---

今天把一个 fork 的博客往 `blog.955827.xyz` 上挂，Cloudflare 显示“部署成功”，页面却是空 404。

点开构建日志才发现：状态是 Success，但日志里写着 `No build command specified. Skipping build step.`，然后直接 `Uploading... (296/296)` 把**源码原样**传了上去——没有 `index.html`，所以访问任何路由都是空的 404。

> 部署“成功”不等于“正确”。绿色对勾只代表上传完成了，不代表产物是对的。

根因是 `build_config` 里的 `build_command` / `destination_dir` / `root_dir` 全是空的。补上 `root_dir: XHBlogs`、`build_command: npx @cloudflare/next-on-pages`、`destination_dir: .vercel/output/static` 之后，构建才真正跑起来。

晚点把 siteConfig 里原作者那堆硬编码也顺手换掉，再配一下天气和 AI 网关，周末奖励自己两把肉鸽，嘿嘿
