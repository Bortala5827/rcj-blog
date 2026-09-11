---
title: "从 0 到 1：rcj-stack 的部署与一套多账户自动化方案"
date: "2026-09-08 07:00:00"
description: "rcj-stack 是一个从 rcj 支付系统提炼出来的开源模板，部署在独立的 Cloudflare 账户上。本文记录从 wrangler 配置、多账户 token、到 admin 预填密码的完整链路。"
tags: ["RCJ", "Cloudflare", "部署", "wrangler"]
cover: "/cover-default.svg"
---

## 第一章：为什么需要独立账户

rcj-stack 的 demo 托管在一个**独立的 Cloudflare 账户**上（不是 `955827.xyz` 主账户）。这么做的原因是隔离：demo 的 admin 密码、支付回调、webhook 都只在这个域（`rcj-stack-9xe.pages.dev`）下自动预填，不会污染主站。

对应的 account ID 是 `e35316b03dea786f7f9e0afc0ecd79e9`，部署要用这个账户的 API token。仓库本身是 private，对外公开的是它的别名 **cloudflare-pay-kit**（GitHub `Bortala5827`）。

### 1.1 多账户 token 管理

`~/.workbuddy/mcp.json` 之外，wrangler 的 OAuth token 放在：

```
C:\Users\小样儿\AppData\Roaming\xdg.config\.wrangler\config\default.toml
```

里面有 `oauth_token`。换账户部署时，先确认 token 对应的 account 是不是你要的那个——token 不会报错，但会悄悄部署到错误账户，这种“静默错误”最坑。

## 第二章：部署脚本与 Direct Upload

rcj-stack 同样是零构建：本地构建出静态产物后，用 `wrangler pages deploy` 走 Direct Upload。

```bash
# 用独立账户的 token 部署
CLOUDFLARE_ACCOUNT_ID=e35316b03dea786f7f9e0afc0ecd79e9 \
  npx wrangler pages deploy ./dist --project-name rcj-stack
```

关键点：**不要写死 token 到 remote/config**，只用环境变量或 inline，部署完干净退出。

### 2.1 admin 密码只在 demo 域预填

`rcjstack-demo-2026` 这个 admin 密码只在 `rcj-stack-9xe.pages.dev` 域名下自动填入登录框。逻辑上做了域名白名单判断，换域访问不会带出密码——这是当时特意加的一道边界。

## 第三章：踩过的坑

1. **secret binding 漂移**：Functions 里读不到 env，多半是部署时没带对 account，或 secret 绑到了别的 project。
2. **admin 点击播放崩溃**：迁移后 rcj-shop 的“sing to me” 与 rcj-stack 系统相互独立，但某个播放回调在 reject 状态下没清理，导致 admin 点播放直接崩。根因是缺“拒绝条目自动清理机制”，至今仍是待修项。
3. **OAuth token 权限缺口**：早期用 GCM 缓存的 token 推代码，偶发 `could not read Username`，切到 `wincred` 重试即过。

## 结语

rcj-stack 把 rcj 这一套支付 + 部署经验抽象成了一个能直接复用的模板。它不复杂，但每一条边界（独立账户、域名白名单、token 不外写）都是从真实故障里抠出来的。开源出来，是希望少有人再踩一遍。
