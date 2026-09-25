
(function() {
    'use strict';

    var SHARED_API_KEY = 'sk-.............';
    var MAX_REQUESTS = 100;
    var COOLDOWN_SECONDS = 30;
    var MAX_CONTEXT_MESSAGES = 30;
    var AI_AVATAR_URL = 'https://gynai.aurorachat.asia/1.jpg';
    var LONG_PRESS_MS = 550;

    var PROVIDERS = {
        agnes: {
            label: 'Agnes',
            baseUrl: 'https://apihub.agnes-ai.com/v1/chat/completions',
            imageBaseUrl: 'https://apihub.agnes-ai.com/v1/images/generations',
            videoBaseUrl: 'https://apihub.agnes-ai.com/v1/videos',
            defaultModel: 'agnes-2.5-flash',
            defaultImageModel: 'agnes-image-2.5-flash',
            defaultVideoModel: 'agnes-video-2.5-flash'
        },
        openai: {
            label: 'OpenAI',
            baseUrl: 'https://api.openai.com/v1/chat/completions',
            imageBaseUrl: 'https://api.openai.com/v1/images/generations',
            videoBaseUrl: '',
            defaultModel: 'gpt-3.5-turbo',
            defaultImageModel: 'dall-e-3',
            defaultVideoModel: ''
        },
        deepseek: {
            label: 'DeepSeek',
            baseUrl: 'https://api.deepseek.com/v1/chat/completions',
            imageBaseUrl: '',
            videoBaseUrl: '',
            defaultModel: 'deepseek-chat',
            defaultImageModel: '',
            defaultVideoModel: ''
        },
        custom: {
            label: '自定义',
            baseUrl: '',
            imageBaseUrl: '',
            videoBaseUrl: '',
            defaultModel: '',
            defaultImageModel: '',
            defaultVideoModel: ''
        }
    };

    var providerSelect = document.getElementById('providerSelect');
    var apiKeyInput = document.getElementById('apiKeyInput');
    var toggleVisBtn = document.getElementById('toggleVisBtn');
    var customUrlWrap = document.getElementById('customUrlWrap');
    var customUrlInput = document.getElementById('customUrlInput');
    var modelInput = document.getElementById('modelInput');
    var systemPromptInput = document.getElementById('systemPromptInput');
    var imageModelInput = document.getElementById('imageModelInput');
    var imageSizeSelect = document.getElementById('imageSizeSelect');
    var imageNSelect = document.getElementById('imageNSelect');
    var videoModelInput = document.getElementById('videoModelInput');
    var videoSecondsInput = document.getElementById('videoSecondsInput');
    var videoAspectRatioSelect = document.getElementById('videoAspectRatioSelect');
    var queryUrlInput = document.getElementById('queryUrlInput');

    var promptInput = document.getElementById('promptInput');
    var sendBtn = document.getElementById('sendBtn');
    var stopBtn = document.getElementById('stopBtn');
    var chatMessages = document.getElementById('chatMessages');
    var welcomeScreen = document.getElementById('welcomeScreen');
    var modeBadge = document.getElementById('modeBadge');
    var statusText = document.getElementById('statusText');
    var modeSelect = document.getElementById('modeSelect');
    var thinkToggle = document.getElementById('thinkToggle');
    var webToggle = document.getElementById('webToggle');
    var uploadBtn = document.getElementById('uploadBtn');
    var voiceBtn = document.getElementById('voiceBtn');
    var fileInput = document.getElementById('fileInput');
    var uploadPreview = document.getElementById('uploadPreview');
    var previewImg = document.getElementById('previewImg');
    var clearImageBtn = document.getElementById('clearImageBtn');

    var historyList = document.getElementById('historyList');
    var clearHistoryBtn = document.getElementById('clearHistoryBtn');
    var historyBtn = document.getElementById('historyBtn');
    var newChatBtn = document.getElementById('newChatBtn');
    var historySidebar = document.getElementById('historySidebar');
    var historyBackdrop = document.getElementById('historyBackdrop');
    var closeHistoryBtn = document.getElementById('closeHistoryBtn');

    var settingsOverlay = document.getElementById('settingsOverlay');
    var settingsBtn = document.getElementById('settingsBtn');
    var closeSettingsBtn = document.getElementById('closeSettingsBtn');
    var saveSettingsBtn = document.getElementById('saveSettingsBtn');

    var themeToggleBtn = document.getElementById('themeToggleBtn');
    var themeIcon = document.getElementById('themeIcon');

    var avatarUploadOverlay = document.getElementById('avatarUploadOverlay');
    var avatarPreview = document.getElementById('avatarPreview');
    var avatarFileInput = document.getElementById('avatarFileInput');
    var chooseAvatarBtn = document.getElementById('chooseAvatarBtn');
    var saveAvatarBtn = document.getElementById('saveAvatarBtn');
    var removeAvatarBtn = document.getElementById('removeAvatarBtn');
    var cancelAvatarBtn = document.getElementById('cancelAvatarBtn');

    var noticeModalOverlay = document.getElementById('noticeModalOverlay');
        var mode = currentMode;
        if (mode === 'auto') {
            var lower = userPrompt.toLowerCase();
            var videoKw = ['视频','生成视频','制作视频','动画','动图','短片'];
            var imageKw = ['画','生成','绘','图片','图像','照片','插画','卡通','写实','油画','水彩','素描','漫画','壁纸','头像','logo','图标','海报','设计','创作','制作','给我画','帮我画','画一张','画个','生成一张','生成个'];
            var detected = 'chat';
            for (var vi = 0; vi < videoKw.length; vi++) { if (lower.includes(videoKw[vi])) { detected = 'video'; break; } }
            if (detected === 'chat') { for (var im = 0; im < imageKw.length; im++) { if (lower.includes(imageKw[im])) { detected = 'image'; break; } } }
            mode = detected;
        }

        updateModeUI(mode);
        currentMode = mode;

        var hasPersonalKey = isUsingPersonalKey();
        var apiKey = getEffectiveApiKey();
        var baseUrl = getEffectiveBaseUrl(mode);
        var model = getEffectiveModel(mode);

        if (!hasPersonalKey) {
            var now = Date.now();
            var elapsed = (now - lastSendTime) / 1000;
            if (remaining <= 0) { setOutput('共享次数已用完，请填写个人 API 密钥继续使用', true); return; }
            if (elapsed < COOLDOWN_SECONDS) { var left = Math.ceil(COOLDOWN_SECONDS - elapsed); setOutput('请等待 ' + left + ' 秒后再发送', true); return; }
        }

        if (!apiKey) { setOutput('请填写 API 密钥（或使用共享密钥）', true); return; }
        if (!baseUrl) { setOutput('当前提供商不支持该模式', true); return; }

        var searchContext = '';
        if (mode === 'chat' && webToggle && webToggle.checked && userPrompt && shouldSearch(userPrompt)) {
            setOutput('正在联网搜索...', false);
            var searchResult = await webSearch(userPrompt);
            if (searchResult) searchContext = searchResult;
        }

        var userMsgContent = uploadedImage ? { type: 'image', url: uploadedImage } : userPrompt;
        addMessage('user', userMsgContent, { timestamp: Date.now() });

        promptInput.value = '';
        promptInput.style.height = 'auto';
        clearUploadedImage();
        updateSendButton();

        sendBtn.style.display = 'none';
        stopBtn.classList.add('visible');

        currentAbortController = new AbortController();

        try {
            var requestBody;
            var headers = { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' };

            if (mode === 'image') {
                var size = imageSizeSelect.value;
                var n = parseInt(imageNSelect.value, 10) || 1;
                requestBody = { model: model, prompt: userPrompt || '生成一张图片', n: n, size: size };
            } else if (mode === 'video') {
                var seconds = String(parseInt(videoSecondsInput.value, 10) || 5);
                var aspectRatio = videoAspectRatioSelect.value;
                requestBody = { model: model, prompt: userPrompt || '生成一段视频', mode: 'text', seconds: seconds, aspect_ratio: aspectRatio };
            } else {
                var userContent;
                if (uploadedImage) {
                    userContent = [{ type: 'text', text: userPrompt || '请描述这张图片' }, { type: 'image_url', image_url: { url: uploadedImage } }];
                } else {
                    userContent = userPrompt || '你好';
                }
                var finalSystem = getFinalSystemPrompt();
                if (searchContext) finalSystem += '\n\n你可以参考以下联网搜索信息来回答用户的问题：\n' + searchContext;
                var msgs = [{ role: 'system', content: finalSystem }];
                for (var hi = 0; hi < conversationMessages.length; hi++) msgs.push(conversationMessages[hi]);
                msgs.push({ role: 'user', content: userContent });
                requestBody = { model: model, messages: msgs, stream: true };
            }

            var res = await fetch(baseUrl, { method: 'POST', headers: headers, body: JSON.stringify(requestBody), signal: currentAbortController.signal });

            if (!res.ok) {
                var errText = await res.text();
                var errData;
                try { errData = JSON.parse(errText); } catch (e) { errData = {}; }
                var errMsg = errData.error?.message || errData.message || errText || '请求失败';
                if (res.status === 401 || res.status === 403) setOutput('认证失败，请检查 API 密钥', true);
                else if (res.status === 429) setOutput('请求频率过高，请稍后再试', true);
                else setOutput('错误 (' + res.status + '): ' + errMsg, true);
                sendBtn.style.display = '';
                stopBtn.classList.remove('visible');
                return;
            }

            if (mode === 'chat') {
                var streamingMsgDiv = createStreamingMessage('assistant');
                var fullReply = '';
                var fullThinking = '';
                var reader = res.body.getReader();
                var decoder = new TextDecoder();
                var buffer = '';

                while (true) {
                    var readResult = await reader.read();
                    if (readResult.done) break;
                    buffer += decoder.decode(readResult.value, { stream: true });
                    var lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (var li = 0; li < lines.length; li++) {
                        var line = lines[li].trim();
                        if (!line || !line.startsWith('data: ')) continue;
                        var jsonStr = line.slice(6);
                        if (jsonStr === '[DONE]') continue;
                        try {
                            var chunk = JSON.parse(jsonStr);
                            var delta = chunk.choices && chunk.choices[0] && chunk.choices[0].delta;
                            if (delta) {
                                var rDelta = delta.reasoning_content || delta.reasoning || delta.thinking || '';
                                if (rDelta) fullThinking += rDelta;
                                if (delta.content) fullReply += delta.content;
                                if (delta.content || rDelta) {
                                    scheduleStreamRedraw(streamingMsgDiv, fullReply, fullThinking);
                                }
                            }
                        } catch (e) {}
                    }
                }

                // Flush any pending throttled redraw, then do one final render with math.
                if (pendingStreamRedraw && pendingStreamRedraw.div === streamingMsgDiv) {
                    pendingStreamRedraw = null;
                    var finalHtml = '';
                    if (thinkMode && fullThinking) {
                        finalHtml += '<div class="thinking"><div class="thinking-label">思考过程</div>' + escapeHtml(fullThinking) + '</div>';
                    }
                    finalHtml += isTextLikelyMarkdown(fullReply) ? renderLinks(preprocessCodeBlocks(fullReply)) : preprocessCodeBlocks(fullReply);
                    streamingMsgDiv.innerHTML = finalHtml;
                }
                var timestampDiv = document.createElement('div');
                timestampDiv.className = 'timestamp';
                timestampDiv.textContent = new Date().toLocaleTimeString();
                streamingMsgDiv.appendChild(timestampDiv);
                if (isUserAtBottom()) scrollToBottom();

                var wrapper = streamingMsgDiv.parentNode;
                var uiEntry = { wrapper: wrapper, msgDiv: streamingMsgDiv, role: 'assistant', content: fullReply, thinking: fullThinking || null, timestamp: Date.now() };
                uiMessages.push(uiEntry);
                wrapper._uiEntry = uiEntry;
                attachLongPress(wrapper, uiEntry);

                if (fullReply && fullReply.indexOf('$') !== -1) renderMath(streamingMsgDiv);
                rebuildContext();

                if (fullReply) {
                    var allMessages = [
                        { role: 'user', content: userMsgContent, timestamp: Date.now() },
                        { role: 'assistant', content: fullReply, timestamp: Date.now(), thinking: fullThinking || null }
                    ];
                    saveConversationToHistory(userPrompt || (uploadedImage ? '[图片]' : ''), fullReply, allMessages);
                }
            } else {
                var responseText = await res.text();
                var data;
                try { data = JSON.parse(responseText); }
                catch (parseErr) {
                    setOutput('服务器返回非 JSON 格式', true);
                    sendBtn.style.display = '';
                    stopBtn.classList.remove('visible');
                    return;
                }

                var replyText = '';
                var thinking = null;
                if (mode === 'image') {
                    var images = data.data || [];
                    if (images.length === 0) { setOutput('未生成图片', true); replyText = '生成图片失败'; }
                    else {
                        var hasValidImage = false;
                        for (var idx = 0; idx < images.length; idx++) {
                            var item = images[idx];
                            var imageUrl = item.url || item.b64_json || null;
                            if (imageUrl && typeof imageUrl === 'string' && !imageUrl.startsWith('data:') && !imageUrl.startsWith('http')) imageUrl = 'data:image/png;base64,' + imageUrl;
                            if (imageUrl) { hasValidImage = true; addMessage('assistant', { type: 'image', url: imageUrl }, { timestamp: Date.now() }); }
                        }
                        replyText = hasValidImage ? '已生成图片' : '生成图片失败';
                    }
                } else if (mode === 'video') {
                    var videoId = data.video_id || data.task_id || data.id || null;
                    if (videoId) {
                        setOutput('视频任务已提交，正在生成中...');
                        var result = await pollVideoTask(videoId, model, apiKey, baseUrl, 60, 3000);
                        if (result.status === 'completed' && result.videoUrl) {
                            addMessage('assistant', { type: 'video', url: result.videoUrl }, { timestamp: Date.now() });
                            replyText = '已生成视频';
                            var downloadDiv = document.createElement('div');
                            downloadDiv.innerHTML = '<button style="background:linear-gradient(135deg,#007aff,#0066d6);border:none;padding:8px 16px;border-radius:10px;color:#fff;cursor:pointer;margin-top:8px;font-weight:500;box-shadow:0 4px 14px rgba(0,122,255,0.3);" onclick="window.downloadVideo(\'' + result.videoUrl + '\')">下载视频</button>';
                            chatMessages.appendChild(downloadDiv);
                            scrollToBottom();
                        } else if (result.status === 'failed') { setOutput('视频生成失败', true); replyText = '视频生成失败'; }
                        else { setOutput('视频生成超时', true); replyText = '视频生成超时'; }
                    } else {
                        var videoUrl = data.url || data.video_url || null;
                        if (videoUrl) { addMessage('assistant', { type: 'video', url: videoUrl }, { timestamp: Date.now() }); replyText = '已生成视频'; }
                        else { setOutput('视频响应异常', true); replyText = '视频响应异常'; }
                    }
                }

                if (replyText) {
                    var allMessages = [
                        { role: 'user', content: userMsgContent, timestamp: Date.now() },
                        { role: 'assistant', content: replyText, timestamp: Date.now(), thinking: thinking }
                    ];
                    saveConversationToHistory(userPrompt || (uploadedImage ? '[图片]' : ''), replyText, allMessages);
                }
            }

            if (!hasPersonalKey) {
                remaining = remaining - 1;
                setRemaining(remaining);
                var now = Date.now();
                setLastSend(now);
                lastSendTime = now;
            }
        } catch (e) {
            if (e.name === 'AbortError') setOutput('已停止生成', false);
            else {
                var errText = e.message || String(e);
                if (errText.indexOf('NetworkError') >= 0 || errText.indexOf('Failed to fetch') >= 0) setOutput('网络错误：无法连接到 API 服务器', true);
                else if (errText.indexOf('CORS') >= 0) setOutput('CORS 错误', true);
                else setOutput('请求异常: ' + errText, true);
            }
            console.error('请求异常:', e);
        } finally {
            sendBtn.style.display = '';
            stopBtn.classList.remove('visible');
            currentAbortController = null;
            updateUI();
            syncUiTimer();
            var now = Date.now();
            var elapsed = (now - lastSendTime) / 1000;
            var hasKey = isUsingPersonalKey();
            sendBtn.disabled = !(hasKey || (remaining > 0 && elapsed >= COOLDOWN_SECONDS));
        }
    }

    stopBtn.addEventListener('click', function() {
        if (currentAbortController) { currentAbortController.abort(); currentAbortController = null; }
    });

    sendBtn.addEventListener('click', send);
    promptInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); }
    });
    promptInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 140) + 'px';
        updateSendButton();
    });

    voiceBtn.addEventListener('click', function() {
        if (isRecording && recognition) {
            try { recognition.stop(); } catch(e) {}
            isRecording = false;
            voiceBtn.classList.remove('recording');
            voiceBtn.textContent = '语音';
            return;
        }
        var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { setOutput('当前浏览器不支持语音识别。推荐使用 Chrome、Edge 或手机自带浏览器。', true); return; }
        if (!window.isSecureContext) { setOutput('语音功能需要在 HTTPS 页面下使用', true); return; }
        var rec = new SR();
        rec.lang = 'zh-CN';
        rec.continuous = false;
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        rec.onstart = function() {
            isRecording = true;
            voiceBtn.classList.add('recording');
            voiceBtn.textContent = '停止';
            voiceBase = promptInput.value ? promptInput.value + ' ' : '';
        };
        rec.onresult = function(event) {
            var finalText = '', interimText = '';
            for (var i = event.resultIndex; i < event.results.length; i++) {
                var t = event.results[i][0].transcript;
                if (event.results[i].isFinal) finalText += t;
                else interimText += t;
            }
            promptInput.value = voiceBase + finalText + interimText;
            promptInput.style.height = 'auto';
            promptInput.style.height = Math.min(promptInput.scrollHeight, 140) + 'px';
            updateSendButton();
        };
        rec.onerror = function(e) {
            isRecording = false;
            voiceBtn.classList.remove('recording');
            voiceBtn.textContent = '语音';
            if (e.error === 'aborted') return;
            var msgMap = { 'not-allowed': '麦克风权限被拒绝，请允许访问', 'service-not-allowed': '麦克风权限被拒绝', 'no-speech': '没有检测到语音', 'audio-capture': '未检测到麦克风', 'network': '语音识别需要联网', 'language-not-supported': '语言不被支持' };
            setOutput(msgMap[e.error] || ('语音识别出错: ' + e.error), true);
        };
        rec.onend = function() {
            isRecording = false;
            voiceBtn.classList.remove('recording');
            voiceBtn.textContent = '语音';
        };
        try { rec.start(); recognition = rec; }
        catch (err) { setOutput('启动语音识别失败', true); isRecording = false; voiceBtn.classList.remove('recording'); voiceBtn.textContent = '语音'; }
    });

    var MAX_IMAGE_MB = 4;
    uploadBtn.addEventListener('click', function() { fileInput.click(); });
    fileInput.addEventListener('change', function() {
        if (this.files && this.files.length > 0) {
            var file = this.files[0];
            if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
                setOutput('图片超过 ' + MAX_IMAGE_MB + 'MB，请压缩后再上传', true);
                this.value = '';
                return;
            }
            var reader = new FileReader();
            reader.onload = function(e) {
                uploadedImage = e.target.result;
                previewImg.src = uploadedImage;
                uploadPreview.style.display = 'flex';
                if (currentMode !== 'chat') {
                    currentMode = 'chat';
                    modeSelect.value = 'chat';
                    updateModeUI('chat');
                    saveConfig();
                }
                updateUI();
            };
            reader.readAsDataURL(file);
        }
    });
    clearImageBtn.addEventListener('click', function() { clearUploadedImage(); updateUI(); });

    modeSelect.addEventListener('change', function() {
        currentMode = this.value;
        localStorage.setItem('ai_mode', currentMode);
        updateModeUI(currentMode);
        saveConfig();
        updateUI();
    });

    thinkToggle.checked = localStorage.getItem('think_mode') === '1';
    thinkMode = thinkToggle.checked;
    thinkToggle.addEventListener('change', function() {
        thinkMode = this.checked;
        localStorage.setItem('think_mode', this.checked ? '1' : '0');
    });

    historyBtn.addEventListener('click', openHistory);
    closeHistoryBtn.addEventListener('click', closeHistory);
    historyBackdrop.addEventListener('click', closeHistory);

    newChatBtn.addEventListener('click', function() {
        uiMessages = [];
        chatMessages.innerHTML = '';
        chatMessages.appendChild(welcomeScreen);
        showWelcome();
    });

    themeToggleBtn.addEventListener('click', toggleTheme);

    settingsBtn.addEventListener('click', function() { settingsOverlay.classList.add('open'); });
    closeSettingsBtn.addEventListener('click', function() { settingsOverlay.classList.remove('open'); });
    settingsOverlay.addEventListener('click', function(e) { if (e.target === this) settingsOverlay.classList.remove('open'); });
    saveSettingsBtn.addEventListener('click', function() { saveConfig(); settingsOverlay.classList.remove('open'); updateUI(); syncUiTimer(); });

    toggleVisBtn.addEventListener('click', function() {
        var isPass = apiKeyInput.type === 'password';
        apiKeyInput.type = isPass ? 'text' : 'password';
        this.textContent = isPass ? '隐藏' : '显示';
    });

    providerSelect.addEventListener('change', function() {
        toggleCustomUrlVisibility();
        var p = PROVIDERS[this.value];
        if (p) {
            if (!modelInput.value.trim() || modelInput.value === PROVIDERS.agnes.defaultModel) modelInput.value = p.defaultModel || '';
            if (!imageModelInput.value.trim() || imageModelInput.value === PROVIDERS.agnes.defaultImageModel) imageModelInput.value = p.defaultImageModel || '';
            if (!videoModelInput.value.trim() || videoModelInput.value === PROVIDERS.agnes.defaultVideoModel) videoModelInput.value = p.defaultVideoModel || '';
        }
        saveConfig();
    });

    clearHistoryBtn.addEventListener('click', function() {
        if (confirm('确定清空所有历史记录吗？')) { saveHistory([]); renderHistory(); }
    });

    chooseAvatarBtn.addEventListener('click', function() { avatarFileInput.click(); });
    avatarFileInput.addEventListener('change', function() {
        if (this.files && this.files.length > 0) {
            var file = this.files[0];
            var reader = new FileReader();
            reader.onload = function(e) {
                var img = new Image();
                img.onload = function() {
                    var canvas = document.createElement('canvas');
                    var size = Math.min(img.width, img.height, 200);
                    canvas.width = size;
                    canvas.height = size;
                    var ctx = canvas.getContext('2d');
                    var sx = (img.width - size) / 2;
                    var sy = (img.height - size) / 2;
                    ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
                    pendingAvatarBase64 = canvas.toDataURL('image/jpeg', 0.8);
                    updateAvatarPreview();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    saveAvatarBtn.addEventListener('click', function() {
        if (pendingAvatarBase64) { userAvatar = pendingAvatarBase64; localStorage.setItem('user_avatar', userAvatar); }
        closeAvatarUpload();
        refreshUserAvatars();
    });
    removeAvatarBtn.addEventListener('click', function() {
        userAvatar = null;
        localStorage.removeItem('user_avatar');
        pendingAvatarBase64 = null;
        updateAvatarPreview();
        closeAvatarUpload();
        refreshUserAvatars();
    });
    cancelAvatarBtn.addEventListener('click', closeAvatarUpload);
    avatarUploadOverlay.addEventListener('click', function(e) { if (e.target === this) closeAvatarUpload(); });

    function refreshUserAvatars() {
        var wrappers = document.querySelectorAll('.message-wrapper.user');
        for (var i = 0; i < wrappers.length; i++) {
            var oldAvatar = wrappers[i].querySelector('.message-avatar');
            if (oldAvatar) {
                var newAvatar = createAvatarElement('user');
                wrappers[i].replaceChild(newAvatar, oldAvatar);
            }
        }
    }

    function initLongPressMenu() {
        longPressMenu = document.createElement('div');
        longPressMenu.className = 'long-press-menu';
        document.body.appendChild(longPressMenu);
        document.addEventListener('click', function(e) {
            if (longPressMenu && !longPressMenu.contains(e.target)) hideLongPressMenu();
        });
        document.addEventListener('touchstart', function(e) {
            if (longPressMenu && !longPressMenu.contains(e.target)) hideLongPressMenu();
        }, { passive: true });
        window.addEventListener('scroll', hideLongPressMenu, { passive: true });
    }

    // ==================== 公告弹窗逻辑 ====================
    async function loadNotice() {
        try {
            var res = await fetch('https://gynai.aurorachat.asia/ai.txt');
            if (!res.ok) return;
            var text = await res.text();
            if (text && text.trim() !== '') {
                noticeModalBody.textContent = text.trim();
                noticeModalOverlay.classList.add('show');
            }
        } catch (e) {
            console.log('公告加载失败:', e);
        }
    }

    noticeModalClose.addEventListener('click', function() {
        noticeModalOverlay.classList.remove('show');
    });

    noticeModalOverlay.addEventListener('click', function(e) {
        if (e.target === this) {
            noticeModalOverlay.classList.remove('show');
        }
    });

    // ==================== 初始化 ====================
    loadTheme();
    loadUserAvatar();
    loadConfig();
    renderHistory();
    updateUI();
    initLongPressMenu();
    loadNotice();

    // 冷却计时器：仅共享密钥模式下启动，冷却结束即停止，避免无意义的全局每秒定时器
    var uiTimer = null;
    function syncUiTimer() {
        if (uiTimer) { clearInterval(uiTimer); uiTimer = null; }
        if (isUsingPersonalKey()) { updateUI(); return; }
        var elapsed = (Date.now() - lastSendTime) / 1000;
        if (elapsed >= COOLDOWN_SECONDS) { updateUI(); return; }
        uiTimer = setInterval(function() {
            var now = Date.now();
            var e = (now - lastSendTime) / 1000;
            updateUI();
            if (e >= COOLDOWN_SECONDS) { clearInterval(uiTimer); uiTimer = null; }
        }, 1000);
    }
    syncUiTimer();

    console.log('SapiensAI loaded.');
})();
