/**
 * include.js 植入两个变量
 * options 保存的设置
 * popupEngines 要显示浮标的搜索引擎
 */

let layerindex = 1;
let isPopUpLoginPage = '1';


// 设置jquery的ajax全局请求参数 ,处理ajax请求session过期的问题
$.ajaxSetup({
    cache: false,
    complete: function (XMLHttpRequest, textStatus) {
        if (XMLHttpRequest.responseText == '' && (XMLHttpRequest.status == 200 || XMLHttpRequest.status == 304)) {
            openEngine(0);
        }
    }
});


let POPOVER_ID = 'hcSearchePopover';
let MODAL_ID = 'hcSearcheModal';

let popupEnginesNode = false;

let selectionText = '';

let serverUrl = options.serverUrl;

let ctx = serverUrl;

let hasLoginDialogAppearCount = 0;

let mouseX;
let mouseY;


/**
 * 缓存页面以便加载下一页的处理
 * seIndex 用来判断搜索引擎，切换搜索引擎就重置此变量
 */
let ajaxPageCache = false;

function resetAjaxPageCache(seIndex = false) {
    ajaxPageCache = {
        seIndex: seIndex,
        paged: 1,
        pages: []
    };
}

/**
 * isFixed 是否相对浏览器可视区域定位
 * newPos 是否更新定位（如果元素已经存在的话
 */
function render(tagName, elemId, childElem, isFixed, newPos) {

    let elem = document.getElementById(elemId);

    if (elem) {

        elem.innerHTML = '';

    } else {

        elem = document.createElement(tagName);
        elem.id = elemId;
        document.body.appendChild(elem);
    }

    let contentNode = createContainer(tagName + '-container', childElem);

    elem.appendChild(contentNode);

    // class ID same
    elem.classList.add(elemId);

    let X = false;
    let Y = false;

    if (!newPos) {
        X = elem.style.left.replace('px', '');
        Y = elem.style.top.replace('px', '');
    }

    if (!X) {
        let pos = getXY(elem.offsetWidth, elem.offsetHeight);
        X = pos.X;
        Y = pos.Y;

        // 相对文档定位时需要将文档滚动距离加上
        if (isFixed === false)
            Y += window.pageYOffset;
    }

    elem.style.position = isFixed ? 'fixed' : 'absolute';
    elem.style.left = X + 'px';
    elem.style.top = Y + 'px';
    if (arguments[5] == isPopUpLoginPage) {//控制登录dialog居中
        elem.style.position = 'absolute';
        elem.style.left = '50%';
        elem.style.top = '50%';
        elem.style.transform = 'translate(-50%, -50%)';
    }


    setTimeout(function () {
        elem.classList.add(elemId + '-show');
    }, 10);

    return elem;
}

// 悬浮图标总是相对文档定位
function renderPopover(childElem) {
    return render('hcsearche-popover', POPOVER_ID, childElem, false, true);
}

// 搜索窗口可以根据设置决定是相对文档还是相对窗口定位

function renderModal(childElem, newPos) {
    return render('hcsearche-modal', MODAL_ID, childElem, options.fixed_modal, newPos, isPopUpLoginPage);
}

// containsCheckElem 检查是否模板内元素，是就不移除
function removeTemplate(elemId, containsCheckElem = false) {
    hasLoginDialogAppearCount = 0;
    const temp = document.getElementById(elemId);
    if (temp && (containsCheckElem === false || temp.contains(containsCheckElem) === false)) {
        temp.classList.remove(elemId + '-show');
        setTimeout(function () {
            if (temp.classList.contains(elemId + '-show') === false && temp.parentElement) {
                document.body.removeChild(temp);
            }
        }, 500);
    }
}

// 需要创建太多嵌套标签了，没个函数不行
function createContainer(name, childElem) {

    name = name.toLowerCase();
    let elem = document.createElement(name);

    elem.style.display = 'block';

    // id 改成驼峰式
    elem.id = name.replace('hcsearche', 'hcSearche').replace(/\-[a-z]/g, function (w) {
        return w.replace('-', '').toUpperCase();
    });

    if (childElem) {
        if (Array.isArray(childElem) === false)
            childElem = [childElem];
        for (let i = 0; i < childElem.length; i++)
            elem.appendChild(childElem[i]);
    }

    return elem;
}

function addModal(seIndex, isUrl, urlOrHTML, newPos, footerChildNode = false) {

    // header link
    let linksNode = createContainer('hcsearche-modal-links');

    for (var i = 0; i < options.searchEngines.length; i++) {
        let se = options.searchEngines[i];

        // 赋值方便下面按统一格式使用
        se.index = i;

        let linkNode = document.createElement('hcsearche-link');

        if (seIndex == se.index)
            linkNode.setAttribute('data-securrent', 'true');

        if (se.type == 'newtab') {
            linkNode.style.color = '#6c757d';
            linkNode.innerHTML += '<svg alt="icon" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill="rgba(27,31,35,.3)" fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg>';

        } else if (se.type == 'iframe') {
            linkNode.style.color = '#586069';
        }

        linkNode.addEventListener('click', function () {
            resetAjaxPageCache(se.index);
            openEngine(se.index);
        });

        linksNode.appendChild(linkNode);
    }

    // close button
    let closeLinkNode = document.createElement('hcsearche-link');
    closeLinkNode.id = 'hcSearcheClose';
    closeLinkNode.innerHTML = '&times;';
    closeLinkNode.addEventListener('click', linkCloseClick);

    linksNode.appendChild(closeLinkNode);

    // lock button
    let lockNode = createContainer('hcsearche-modal-lock');

    if (options.auto_close === false)
        lockNode.classList.add('hcSearcheModalLocked');

    lockNode.addEventListener('click', lockClick);

    // iframe
    let iframeNode = document.createElement('iframe');
    iframeNode.id = 'hcSearcheIframe';
    iframeNode.setAttribute('width', '100%');
    iframeNode.setAttribute('frameborder', '0');

    if (isUrl)
        iframeNode.src = urlOrHTML;
    else
        iframeNode.srcdoc = urlOrHTML;


    let headerNode = createContainer('hcsearche-modal-header', [linksNode]);
    let bodyNode = createContainer('hcsearche-modal-body', iframeNode);

    let footerNode = createContainer('hcsearche-modal-footer');
    if (footerChildNode)
        footerNode.appendChild(footerChildNode);

    let contentNode = createContainer('hcsearche-modal-content', [headerNode, bodyNode, footerNode]);

    let modal = renderModal(contentNode, newPos);

    dragElement(modal);
}

function addStyle() {
    let elemId = 'hcSearchePopoverCustomStyle';
    let elem = document.getElementById(elemId);
    if (!elem) {
        elem = document.createElement('style');
        elem.id = elemId;
        document.head.appendChild(elem);
    }
    elem.innerText = options.custom_style;
}

let iconNode;//红名单或黑名单的按钮
function addPopover(obj) {
    popupEnginesNode = createContainer('hcsearche-icons');
    let index = 0;
    if (JSON.stringify(obj) == "{}") {
        index = 3;
    } else {
        if (obj.MDLX == undefined) {
            index = 0;
        } else if (obj.MDLX == '红名单') {
            index = 1;
        } else index = 2;
    }


    let se = popupEngines[index];

    iconNode = document.createElement('hcsearche-icon');
    iconNode.setAttribute('title', se.name);
    iconNode.setAttribute('data-seindex', se.index);
    iconNode.setAttribute('data-seclass', se.icon_class);
    var imgURL = chrome.extension.getURL("images/" + se.icon_class + ".png");
    iconNode.style.backgroundImage = 'url("' + imgURL + '")';
    iconNode.innerHTML = se.name;

    // 如果不是基于浏览器定位的，每次都更新定位
    let setNewPos = options.fixed_modal !== true;


    iconNode.addEventListener('click', function () {
        if (index == 1 || index == 2) {
            $.ajax({
                url: serverUrl + "/hc/Wording/checkInMdTest.action",
                cache: false,
                type: "GET",
                jsonpCallback: "jsonpCallback",
                success: function (data) {
                    eval(data);
                }

            });

            function jsonpCallback(data) {
                if (isNull(data)) {//通过返回值确定是否登陆没有登录会返回空
                    //document.cookie
                    //setCookie('JSESSIONID', '', -1)
                    openEngine(0)
                } else {//has logn in
                    layerindex = layer.open({
                        title: false,
                        closeBtn: 0,
                        type: 2,
                        area: ['477px', '560px'],
                        fixed: false, //不固定
                        resize: false,
                        content: serverUrl + "/hc/Wording/toFeedBack.action?ztmc=" + selectionText + "&jcmdid=" + obj.MDID + "&dm=" + obj.DM + "&dmlx=" + obj.DMLX
                            + "&mc=" + obj.MC + "&mdlx=" + obj.MDLX//这里content是一个URL，如果你不想让iframe出现滚动条，你还可以content: ['http://sentsin.com', 'no']
                    });
                    $("iframe[name*='layui-layer-iframe']").css("width", "477px");
                }
            }
        } else if (index == 0) {
            layer.msg('该主体不在奖惩对象名单中', {icon: 7, time: 2000});
        } else if (index == 3) {
            layer.msg('未连接到奖惩查询服务，请检查网络连接或联系信用中心！', {icon: 2, time: 2000});
        }

    });

    // 其实很容易误触，误触出现小窗还可以，如果打开新标签页那真是突兀
    // 不过既然有人提出，那么加一下设置
    if (options.show_on_hover === true) {
        iconNode.addEventListener('mouseover', function () {
            openEngine(se.index, setNewPos);
        });
    }

    popupEnginesNode.appendChild(iconNode);


    if (options.custom_style_on)
        addStyle();

    renderPopover(popupEnginesNode);
}


function linkCloseClick() {
    removeTemplate(MODAL_ID);
}

// 临时锁定
function lockClick() {

    // toggle options
    options.auto_close = options.auto_close === true ? false : true;

    // toggle class
    this.classList.toggle('hcSearcheModalLocked', options.auto_close === false);
}

// newPos 用来判断要不要修改窗口定位
// 划词搜索时需要，点击窗口链接时不用
function openEngine(seIndex, newPos = false) {
    let se = options.searchEngines[seIndex];
    if (se) {

        let queryStr = encodeURIComponent(selectionText);

        let queryUrl = se.url.replace(new RegExp('%s', 'g'), queryStr);

        if (se.type === 'ajax') {

            if (ajaxPageCache.seIndex !== seIndex) {
                resetAjaxPageCache(seIndex);
            }

            queryUrl = queryUrl.replace(new RegExp('%p', 'g'), ajaxPageCache.paged);

            let modalData = {
                searchEngineName: se.name,
                queryStr: selectionText,
                pages: []
            };

            if (ajaxPageCache.paged === 1) {
                let html = createFrameDoc(Object.assign({loading: true}, modalData));
                addModal(seIndex, false, html, newPos);
            }

            /**
             * 本来是在 frame doc 里面 Ajax ，很方便
             * 问题是发现部分网站（例如 Github ）的 SCP 会导致无法在 frame 中访问其他域名
             * 所以还是让后台去获取数据返回前台处理吧
             */
            chrome.runtime.sendMessage(
                {
                    getPage: true,
                    ajaxurl: queryUrl
                },
                function (pagedata) {

                    // 把 &quot; 插入 textarea 再获取会导致转义回 " 导致破坏 JSON 格式
                    // 这里提前把转义的 &quot; 换成符合 JSON 格式的 \" 
                    // 后面再插入 textarea 什么的就不影响了
                    if (pagedata.body) {
                        pagedata.body = pagedata.body.replace(new RegExp('&quot;', 'g'), '\"');
                    }

                    ajaxPageCache.pages.push(pagedata);
                    modalData.pages = ajaxPageCache.pages;

                    html = createFrameDoc(modalData);

                    let nextPageNode = false;
                    if (pagedata.next_page) {

                        nextPageNode = document.createElement('hcsearche-link');
                        nextPageNode.id = 'hcSearcheNextLink';
                        nextPageNode.setAttribute('title', '下一页');
                        nextPageNode.addEventListener('click', function () {

                            if (nextPageNode.classList.contains('hcSearcheNextLinkLoading') === false) {
                                ajaxPageCache.paged++;

                                nextPageNode.setAttribute('title', '正在加载下一页');
                                nextPageNode.classList.add('hcSearcheNextLinkLoading');

                                openEngine(seIndex);
                            }

                            return false;
                        });

                    }

                    addModal(seIndex, false, html, false, nextPageNode);
                }
            );


        } else {

            queryUrl = queryUrl.replace(new RegExp('%p', 'g'), 1);

            if (se.type === 'iframe') {

                addModal(seIndex, true, queryUrl, newPos);

            } else {

                // 最简单的新窗口打开
                window.open(queryUrl);

            }
        }
    }
}

function createFrameDoc(json) {

    let html = '<!DOCTYPE html>';

    html += '<html><head><meta charset="UTF-8">\
        <link rel="stylesheet" href="' + chrome.runtime.getURL('/css/bootstrap.min.css') + '">\
        <link rel="stylesheet" href="' + chrome.runtime.getURL('/css/iframe.css') + '">\
    </head>';

    /**
     * 受 SCP 影响不能通过 <script> 标签写代码来赋值
     * 不然有的网页可用有的网页报错
     * 变量写到 HTML 代码里再通过 JS 文件来读取就好了
     */
    html += '<body>\
        <div id="iframeApp"></div>\
        <textarea id="modalData" class="d-none">\
            ' + JSON.stringify(json) + '\
        </textarea>\
        <script src="' + chrome.runtime.getURL('/js/jquery-3.3.1.min.js') + '"></script>\
        <script src="' + chrome.runtime.getURL('/js/iframe.js') + '"></script>\
    </body></html>';

    return html;
}

/**
 * 划词后，如果点击选中文本来取消选择 getSelection() 还是有值
 * 导致实际已经取消选择，可还误以为有选中
 * 但如果延迟些许再判断，就没有了
 * 真是奇了怪了，目前不懂原理，先这样解决
 */
function mouseUp(e) {
    setTimeout(function () {
        mouseUpCallback(e);
    }, 1);
}

let sessionId = '';

function mouseUpCallback(e) {

    e = e || window.event;

    mouseX = e.clientX;
    mouseY = e.clientY;

    let txt = window.getSelection().toString().trim();

    let condition;
    if (options.show_in_input) {
        condition = txt;
    } else {
        condition = txt && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA'
    }
    if (condition) {
        resetAjaxPageCache();

        selectionText = txt;

        let checkPost = $.ajax({
            url: serverUrl + "/hc/Wording/checkInMd.action",
            data: {ztmc: selectionText},
            cache: false,
            type: "GET",
            timeout: 2000,
            complete: function (XMLHttpRequest, status) {
                if (status == 'timeout') {//status == 'timeout'意为超时,status的可能取值：success,notmodified,nocontent,error,timeout,abort,parsererror
                    checkPost.abort(); //取消请求
                    addPopover({});
                }
            },
            jsonpCallback: "success_jsonpCallback",
            xhrFields: {
                withCredentials: true
            },
            success: function (result) {
                eval(result);
            }
        });

        //函数回调
        function success_jsonpCallback(data) {
            if (!isNull(data.jsessionid)) {
                sessionId = data.jsessionid;
            }
            document.cookie = "JSESSIONID=" + sessionId;//手动设置jsessionid,这样不会被shiro拦截
            addPopover(data);
        }
    } else {
        autoRemoveTemplate(e);
    }

}

function autoRemoveTemplate(e) {

    removeTemplate(POPOVER_ID, false);

    /**
     * 只有开启自动关闭才会自动移除搜索窗口
     */
    if (
        options.auto_close === true
    ) {
        removeTemplate(MODAL_ID, e.target);
    }
}

function getXY(elemWidth, elemHeight, offsetX = 10, offsetY = 10) {
    /**
     * 这个定位问题让我思路搅在一起了
     * 必须一步步备注清楚以防忘记
     */

    /**
     * 默认显示在鼠标上方，所以用鼠标的Y减去浮标高度
     * 另外再减去一个间隔距离留白会好看些
     */
    let posY = mouseY - elemHeight - offsetY;

    /**
     * 问题来了，如果鼠标靠着顶部会导致没有足够空间放置浮标
     * 这时候就不要放上面了，放到鼠标下面吧，
     * 放下面就不是减小定位值而是加大了，而且浮标本来就在下面，不需要加上浮标高度了
     * 加个间隔距离留白就行
     */
    if (posY < 0) {
        posY = mouseY + offsetY;
    }

    /**
     * 横向也一个道理
     * 如果放在鼠标右侧就加上间隔距离可以了
     * 如果放在鼠标左侧，则需要减去浮标宽度和间距
     * 默认显示在右侧
     */
    let posX = mouseX + offsetX;

    /**
     * 如果坐标加上浮标宽度超过窗口宽度那就是超出了
     * 那么，放到左边吧
     */

    if (posX + elemWidth > window.innerWidth) {
        posX = mouseX - elemWidth - offsetX;
    }

    /**
     * 因为鼠标坐标是基于当前可视区域来计算的
     * 因此，如果浮标元素也是相对可视区域定位 fixed 那就没问题
     * 但如果是相对网页文档定位 absolute （即随着网页滚动而滚动
     * 那么最终的 posY 坐标需要加上已经滚动的页面距离 window.pageYOffset
     */
    return {
        X: posX,
        Y: posY
    };
}

// https://www.w3schools.com/howto/howto_js_draggable.asp

function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "-drag")) {
        // if present, the drag is where you move the DIV from:
        document.getElementById(elmnt.id + "-drag").onmousedown = dragMouseDown;
    } else {
        // otherwise, move the DIV from anywhere inside the DIV:
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

let readyStateCheckInterval = setInterval(function () {
    if (document.readyState === 'complete') {

        clearInterval(readyStateCheckInterval);

        if (options.show_contextmenu_icon === true) {
            document.addEventListener('mouseup', autoRemoveTemplate);
            document.addEventListener('contextmenu', mouseUp);
        } else {
            document.addEventListener('mouseup', mouseUp);
        }

    }
}, 10);
//监听信息关闭弹窗frame
window.addEventListener("message", function (e) {
    if (e.data == 'close') {
        layer.close(layerindex);
    }
    if (e.data == 'loginFlag') {
        linkCloseClick();
        if (!isNull(iconNode)) {
            $(iconNode).trigger("click");
        }
    }
    if (e.data == 'fadeToggle') {
       /* let h = isClose ? 580 : (580 - 152) + 'px';
        $("iframe[name*='layui-layer-iframe']").css("height", h);
        layer.style(layerindex, {
            height: h
        });
        isClose = !isClose;*/
    }
}, false);

let isClose = false;







