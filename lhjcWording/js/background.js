/**
 * Qikipedia_v0.1.1 里有删除内容安全策略 Content Security Policies 的代码
 * 先记下，如果有需要用再拿来用，就不用自己研究了，毕竟不了解
 */

let menusCallbackFunc = [];

function createMenus() {
    chrome.storage.sync.get(defaultConfig, function (items) {

        if (items.in_the_menu === false)
            return false;

        menusCallbackFunc = [];

        for (let i = 0; i < items.searchEngines.length; i++) {

            let se = items.searchEngines[i];

            if (se.type === 'newtab') {

                let menuItemId = 'hcsearche_' + i;

                chrome.contextMenus.create({
                    'title': '使用 ' + se.name + ' 搜索',
                    'id': menuItemId,
                    'contexts': ['selection']
                });

                let queryUrl = se.url.replace(new RegExp('%p', 'g'), 1);

                menusCallbackFunc[menuItemId] = function (selectionText) {

                    queryUrl = queryUrl.replace(new RegExp('%s', 'g'), encodeURIComponent(selectionText));

                    window.open(queryUrl);
                }
            }
        }

        // console.log(menusCallbackFunc)

        if (menusCallbackFunc.length > 0)
            chrome.contextMenus.onClicked.addListener(menusCallback);
    });
}

function menusCallback(info, tab) {
    if (menusCallbackFunc[info.menuItemId]) {
        menusCallbackFunc[info.menuItemId](info.selectionText);
    }
}

chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (areaName === 'sync') {
        if (
            (changes.in_the_menu !== undefined
                && changes.in_the_menu.newValue !== changes.in_the_menu.oldValue)
            || changes.searchEngines !== undefined
        ) {
            chrome.contextMenus.removeAll(function () {
                chrome.contextMenus.onClicked.removeListener(menusCallback);
                createMenus();
            });
        }
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.ForrestRun === true) {
        runForrestRun(sender.tab.id);
    } else if (request.getPage === true && !!request.ajaxurl) {

        fetch(request.ajaxurl).then(function (response) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.indexOf('application/json') !== -1) {
                return response.json();
            } else {
                return {
                    error: 'content-type-error'
                };
            }
        }).then(function (json) {
            if (json && json.action && json.action === 'hcsearche' && json.body) {
                sendResponse(json);
            } else {
                sendResponse(json && json.error ? json : {
                    error: 'json-error'
                });
            }
        });
        return true;
    }

});

function runForrestRun(tabId) {
    chrome.tabs.insertCSS(tabId, {
        file: '/css/popup.css'
    });

    chrome.tabs.insertCSS(tabId, {
        file: '/css/icons.css'
    });

    chrome.tabs.executeScript(tabId, {
        file: '/js/jquery-3.3.1.min.js'
    });

    chrome.tabs.executeScript(tabId, {
        file: '/js/jquery.form.js'
    });

    chrome.tabs.executeScript(tabId, {
        file: '/layer-v3.0.1/layer/layer.js'
    });

    chrome.tabs.executeScript(tabId, {
        file: '/js/base.js'
    });

    chrome.tabs.executeScript(tabId, {
        file: '/js/content.js'
    });
}

chrome.runtime.onInstalled.addListener(function () {
    window.open(chrome.runtime.getURL('/options/setting.html'));
});


