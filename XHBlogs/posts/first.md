---
title: "rcj-shop 上线：把定价托管做成三档"
date: "2026-09-01 09:00:01"
description: "一个跑在 Cloudflare Pages + D1 上的极简小商城，定价托管 ¥9.9 / 题库定制 ¥39 / 纯建站 ¥69。"
tags: ["RCJ", "Cloudflare", "独立开发"]
cover: "/cover-default.svg"
---

## 终于把 rcj-shop 跑起来了

这是我在 `955827.xyz` 生态里第一个真正能收钱的产品。没有后端服务，纯静态 + Cloudflare Pages 直接部署，数据落在共享 D1（`rcj-analytics-d1`）上，零构建、单文件、改完即发。

### 三档定价是怎么定的

- **¥9.9 定价代托管**：帮人把商品/服务挂上来，我替你配好支付与页面。
- **¥39 题库定制**：给知识类小店做专属题库/内容。
- **¥69 纯建站**：一套干净的落地页 + 支付闭环。

支付优先走**闲鱼**（国内最省心），其次 **PayPal（live 模式）** 接海外。

### 为什么选 Cloudflare Pages

- 免费额度够用，边缘节点全球可达；
- `wrangler pages deploy` 一条命令 Direct Upload，不用和 Vercel 纠缠；
- D1 当轻量数据库，配合 Pages Functions 做服务端代理，飞书多维表格的实时接入也在这条链路上做。

下一步是把抖音视频 + 直播带货的流量导到飞书免费课（`course.html`），让小店自己转起来。
