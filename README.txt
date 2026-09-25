SapiensAI 开源使用说明
======================

本仓库的 index.html 是单文件 Web 应用（内联 CSS + JS，无构建步骤），
直接用浏览器打开或任意静态服务器托管即可运行。

【1. 必须自行处理的外网依赖】
--------------------------------
以下位置引用了第三方 / 自有外网资源，开源发布前请全部替换为你自己的地址：

  行  908   欢迎页 AI 头像图片 <img src="https://gynai.aurorachat.asia/1.jpg">
            （该标签内还有 onerror 回退逻辑，可一并替换为本地资源）

  行 1078   var AI_AVATAR_URL = 'https://gynai.aurorachat.asia/1.jpg';
            （聊天消息里每条 AI 消息头像使用的 URL，改这里即可，
             建议改成同目录下的相对路径，例如 'assets/ai-avatar.jpg'）

  行 2402   loadNotice() 里 fetch('https://gynai.aurorachat.asia/ai.txt')
            （公告弹窗的数据源，见下方【2】的说明）

可选替换项（各厂商 API 的默认 Base URL，若你只保留自定义 provider 可不动）：

  行 1084-1086   Agnes  provider 的 baseUrl / imageBaseUrl / videoBaseUrl
                 (https://apihub.agnes-ai.com/...)
  行 1093-1094   OpenAI provider 的 baseUrl / imageBaseUrl
                 (https://api.openai.com/...)
  行 1102        DeepSeek provider 的 baseUrl
                 (https://api.deepseek.com/...)
  行 1888        视频任务查询地址 agnesApiBase = 'https://apihub.agnes-ai.com/agnesapi'
                 （buildQueryUrls 里还会拼接该基址；若不提供视频功能可整块注释）

内置第三方 CDN / 开放 API（一般无需改，但请知悉其网络依赖）：

  行 1416   MathJax 按需加载地址 cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js
            （可下载该文件改为本地相对路径）
  行 1243   联网搜索功能使用 zh.wikipedia.org 的搜索 API（免费开放接口，可保留）

注意：源码中不再内置任何 API 密钥（已移除共享密钥）。
用户需在右上角"设置"里填写自己的 API 密钥才能对话。

【2. 公告机制：需要自行创建 ai.txt 来发布】
--------------------------------
页面每次加载时会请求 loadNotice()（行 2402）中的 URL，
把该 URL 指向的纯文本内容原样显示在"公告"弹窗里；
文件为空或请求失败时弹窗自动不显示（静默跳过，不影响使用）。

发布公告的方法：
  1. 在你自己的服务器上创建一个纯文本文件，建议直接命名 ai.txt，
     内容与 index.html 里行 2402 的 fetch URL 对应（例如：
       https://your-domain.com/ai.txt ）
  2. 公告正文就是该 txt 文件的全文，支持多行；
     修改文件保存后，用户刷新页面即看到新公告（无需重新发布 index.html）。
  3. 不需要公告时，把 ai.txt 清空（保留 0 字节或空白文件即可）。
  4. 同时把 index.html 行 2402 的 URL 改成你自己的地址。

示例 ai.txt：
  各位用户：本服务已升级至 v2 版本，欢迎体验新的思考模式。
  - 2026.07 更新：新增联网搜索开关

【3. 本地存储说明】
--------------------------------
用户设置（API 密钥、主题、历史记录、头像）保存在浏览器 localStorage 中，
键前缀为 ai_*、chat_history、theme、user_avatar，均为纯本地、不上报。
若以 http 方式托管在本机，语音识别功能需要 HTTPS 环境才可用
（浏览器限制，属正常现象）。

【4. 目录建议】
--------------------------------
  index.html        主文件（本仓库）
  assets/           放你自己的 ai-avatar.jpg 等静态资源
  ai.txt            公告文件（放在与 index.html 同域下，行 2402 改为 'ai.txt'）

—— 完 ——
