// webview script for render note
// 此函数用于在webview中渲染笔记的时候进行交互


export const getRenderScript = () => `

(function() {
    let hasMasks = false;
    let initialized = false;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let longPressTimer = null;
    let longPressTriggered = false; // 标记长按是否已触发
    const SWIPE_THRESHOLD_HORIZONTAL = 60; // 水平滑动阈值，单位：像素
    const SWIPE_THRESHOLD_VERTICAL = 100; // 垂直滑动阈值，单位：像素
    const LONG_PRESS_DURATION = 500; // 长按持续时间，单位：毫秒
    const LONG_PRESS_MOVE_THRESHOLD = 10; // 长按移动阈值，单位：像素

    const modifyLinks = () => {
        const links = document.querySelectorAll('a:not([data-noolingo-processed])');
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            const href = link.getAttribute('href');
            // 标记为已处理，避免重复绑定
            link.setAttribute('data-noolingo-processed', 'true');
            link.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                // 如果是 wikilink，使用原始标题而不是 slug
                if (link.classList.contains('noolingo-wikilink')) {
                    const wikiTitle = link.getAttribute('data-wiki-title');
                    if (wikiTitle) {
                        window.ReactNativeWebView.postMessage('/wiki/' + wikiTitle);
                        return false;
                    }
                }
                window.ReactNativeWebView.postMessage(href);
                return false;
            });
            link.style.pointerEvents = 'auto';
        }
    };

    const modifyReferences = () => {
        const referenceItems = document.querySelectorAll('.note-reference-item:not([data-noolingo-processed])');
        for (let i = 0; i < referenceItems.length; i++) {
            const item = referenceItems[i];
            const noteId = item.getAttribute('data-note-id');
            if (noteId) {
                // 标记为已处理，避免重复绑定
                item.setAttribute('data-noolingo-processed', 'true');
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.ReactNativeWebView.postMessage('/note/' + noteId);
                    return false;
                });
                item.style.pointerEvents = 'auto';
                item.style.cursor = 'pointer';
            }
        }
    };
    
    const checkFlipCapability = () => {
        const masksExist = document.querySelectorAll('.content-mask, .content-mask-off').length > 0;
        if (!initialized || masksExist !== hasMasks) {
            hasMasks = masksExist;
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'flipCapabilityChanged',
                canFlip: hasMasks
            }));
        }
    };

    const handleMaskClick = (e) => {
        const maskElement = e.target.closest('.content-mask, .content-mask-off');
        if (!maskElement) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        // Toggle mask state
        const isRevealed = maskElement.classList.contains('content-mask-off');
        maskElement.classList.toggle('content-mask', isRevealed);
        maskElement.classList.toggle('content-mask-off', !isRevealed);
        
        // 发送 maskToggle 消息
        window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'maskToggled'
        }));
        
        // Check current mask states
        const remainingMasks = document.querySelectorAll('.content-mask');
        const revealedMasks = document.querySelectorAll('.content-mask-off');
        
        checkFlipCapability();
        
        if (remainingMasks.length === 0 && revealedMasks.length > 0) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'allMasksRevealed'
            }));
        } else if (remainingMasks.length > 0 && revealedMasks.length === 0) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'allMasksHidden'
            }));
        }
    };

    // 处理触摸开始
    const handleTouchStart = (e) => {
        if (e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
            longPressTriggered = false; // 重置长按触发标志
            // 清除之前的长按定时器
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            // 保存目标元素引用
            const target = e.target;
            // 设置长按定时器
            longPressTimer = setTimeout(() => {
                // 检查是否为交互元素
                const isInteractive = target.closest('a, .content-mask, .content-mask-off, .note-reference-item, button, input, textarea, select');
                // 如果不是交互元素，触发长按事件
                if (!isInteractive) {
                    longPressTriggered = true; // 标记长按已触发
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'longPress'
                    }));
                }
                longPressTimer = null;
            }, LONG_PRESS_DURATION);
        }
    };

    // 处理触摸移动，取消长按
    const handleTouchMove = (e) => {
        if (e.touches.length === 1 && longPressTimer) {
            const touchCurrentX = e.touches[0].clientX;
            const touchCurrentY = e.touches[0].clientY;
            const deltaX = Math.abs(touchCurrentX - touchStartX);
            const deltaY = Math.abs(touchCurrentY - touchStartY);
            // 如果移动距离超过阈值，取消长按
            if (deltaX > LONG_PRESS_MOVE_THRESHOLD || deltaY > LONG_PRESS_MOVE_THRESHOLD) {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
                longPressTriggered = false; // 移动时重置标志
            }
        }
    };


    // 处理触摸结束，检测滑动
    const handleTouchEnd = (e) => {
        // 如果长按已触发，阻止后续的点击事件
        if (longPressTriggered) {
            e.preventDefault();
            // 延迟重置标志，确保 click 事件不会触发
            setTimeout(() => {
                longPressTriggered = false;
            }, 100);
        }
        // 清除长按定时器
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        if (e.changedTouches.length === 1) {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);
            
            // 判断是否为水平滑动（水平距离大于垂直距离，且超过阈值）
            if (absDeltaX > absDeltaY && absDeltaX > SWIPE_THRESHOLD_HORIZONTAL) {
                // 阻止默认行为，避免触发页面滚动
                e.preventDefault();
                
                if (deltaX > 0) {
                    // 右滑
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'swipeRight'
                    }));
                } else {
                    // 左滑
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'swipeLeft'
                    }));
                }
                return;
            }
            
            // 判断是否为垂直滑动（垂直距离大于水平距离，且超过阈值）
            if (absDeltaY > absDeltaX && absDeltaY > SWIPE_THRESHOLD_VERTICAL) {
                const scrollElement = document.documentElement || document.body;
                const scrollTop = scrollElement.scrollTop;
                const scrollHeight = scrollElement.scrollHeight;
                const clientHeight = scrollElement.clientHeight;
                const isAtTop = scrollTop <= 5; // 允许5px的误差
                const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5; // 允许5px的误差
                
                if (deltaY > 0) {
                    // 下滑：只有在顶部时才触发
                    if (isAtTop) {
                        e.preventDefault();
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'swipeDown'
                        }));
                        return;
                    }
                } else {
                    // 上滑：只有在底部时才触发
                    if (isAtBottom) {
                        e.preventDefault();
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'swipeUp'
                        }));
                        return;
                    }
                }
            }
        }
    };

    // 处理空白处点击
    const handleBlankClick = (e) => {
        // 如果长按已触发，不处理点击事件
        if (longPressTriggered) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        // 如果事件已经被处理（比如点击了遮罩），则不处理空白点击
        if (e.defaultPrevented) return;
        
        const target = e.target;
        // 检查点击的元素是否为交互元素（链接、遮罩、引用、按钮等）
        const isInteractive = target.closest('a, .content-mask, .content-mask-off, .note-reference-item, button, input, textarea, select');
        
        // 如果点击的不是交互元素，都可以触发空白点击
        if (!isInteractive) {
            // 允许在以下元素上触发：容器、段落、标题、div等非交互元素
            const canTrigger = target.classList.contains('note-container') || 
                               target.classList.contains('noolingo-content') ||
                               target.tagName === 'BODY' ||
                               target.tagName === 'HTML' ||
                               target.tagName === 'P' ||
                               target.tagName === 'DIV' ||
                               target.tagName === 'H1' ||
                               target.tagName === 'H2' ||
                               target.tagName === 'H3' ||
                               target.tagName === 'H4' ||
                               target.tagName === 'H5' ||
                               target.tagName === 'H6' ||
                               target.tagName === 'SPAN' ||
                               (target.tagName === 'LI' && !target.closest('a, .content-mask, .content-mask-off, .note-reference-item'));
            
            if (canTrigger) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'blankClick'
                }));
            }
        }
    };

    const handleReactNativeMessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'revealAllMasks':
                    document.querySelectorAll('.content-mask').forEach(mask => {
                        mask.classList.replace('content-mask', 'content-mask-off');
                    });
                    checkFlipCapability();
                    break;
                case 'hideAllMasks':
                    document.querySelectorAll('.content-mask-off').forEach(mask => {
                        mask.classList.replace('content-mask-off', 'content-mask');
                    });
                    checkFlipCapability();
                    break;
                    
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            // Handle non-JSON messages (URLs)
            const url = event.nativeEvent.data;
            if (/^(https?:|mailto:)/.test(url)) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'openUrl',
                    url: url
                }));
            }
        }
    };

    const init = () => {
        modifyLinks();
        modifyReferences();
        checkFlipCapability();
        initialized = true;
        document.addEventListener('click', handleMaskClick);
        document.addEventListener('click', handleBlankClick);
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: false });
        document.addEventListener('message', handleReactNativeMessage);
        window.addEventListener('message', handleReactNativeMessage);
        // Mutation observer for dynamic content
        new MutationObserver(() => {
            modifyLinks();
            modifyReferences();
            checkFlipCapability();
        }).observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
        
})();
true;
`;