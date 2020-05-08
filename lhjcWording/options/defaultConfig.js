/**
 * @param boolean in_the_menu 添加划词右键菜单
 * @param boolean show_float_icon 划词显示搜索图标
 * @param boolean show_on_hover 鼠标移至搜索图标打开搜索窗口
 * @param boolean auto_close 点击网页任意位置自动关闭搜索窗口
 * @param boolean fixed_modal 基于浏览器可视区域定位搜索窗口
 * @param boolean custom_style 自定义样式
 * @param boolean custom_style_on 自定义样式生效
 * @param boolean show_in_input 在输入框或文本框依旧触发
 */
//lhjc系统登陆请求     注意把cas-server和lhjc系统ip和端口改成对应的
//let indexPage = 'http://localhost:8080/cas/login?service=http://localhost:8084/lhjc/shiro-cas';//登录页 for sso
 let indexPage = 'http://localhost:8084/lhjc/login.action?param=wording';//登录页 不使用sso解开注释 注掉上一行 param=wording 加了在CSRFfilter判断防止被拦截
// let indexPage = 'http://192.168.20.25:8316/lhjc/login.action?param=wording';//登录页 不使用sso解开注释 注掉上一行 param=wording 加了在CSRFfilter判断防止被拦截
window.defaultConfig = {
    // serverUrl: 'http://192.168.20.162:8084/lhjc/',
    serverUrl: 'http://localhost:8084/lhjc/',
    in_the_menu: false,
    show_float_icon: true,
    show_on_hover: false,
    show_contextmenu_icon: false,
    auto_close: false,
    fixed_modal: true,
    custom_style_on: true,
    custom_style: '',
    show_in_input: true,
    searchEngines: [
        {
            name: '正常',
            position: 0,
            show_icon: true,
            url: indexPage,
            type: 'iframe',
            icon_class: 'normal',
            icon_classext: 'normal4ext'
        },
        {
            name: '红名单',
            position: 1,
            show_icon: true,
            url: indexPage,
            type: 'iframe',
            icon_class: 'red',
            icon_classext: 'red4ext'
        },
        {
            name: '黑名单',
            position: 2,
            show_icon: true,
            url: indexPage,
            type: 'iframe',
            icon_class: 'black',
            icon_classext: 'black4ext'
        },
        {
            name: 'conerr',
            position: 3,
            show_icon: true,
            url: indexPage,
            type: 'iframe',
            icon_class: 'conerr',
            icon_classext: 'conerr4ext'
        }
    ]
};


