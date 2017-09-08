// version: 2.0.0
// src/ajax-watcher.js

import $ from 'jquery'

const AjaxWatcher = {}

const ajax = (method, url, data)=> {
    const xhr = new XMLHttpRequest()
    return new Promise(function (resolve, reject) {
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                const res = {}
                res.status = xhr.status
                res.statusText = xhr.statusText
                res.headers = {}
                res.xhr = xhr
                ;['date', 'etag', 'connection', 'x-powered-by', 'content-length', 'content-type'].forEach(function(key) {
                    res.headers[key] = xhr.getResponseHeader(key)
                }, this)
                try {
                    res.data = JSON.parse(xhr.responseText)
                }catch (e) {
                    res.data = xhr.responseText
                }
                if (xhr.status === 200) {
                    resolve(res)
                } else {
                    reject(res)
				}
				$http.ajaxComplete(null, xhr, {
					url: url,
					data: data,
					type: method
				})
            }
        };
        xhr.open(method, url)
		xhr.send(data)
		$http.ajaxSend(null, xhr, {
			url: url,
			data: '',
			type: method
		})
    });
}

const $http = {
	ajax: ajax,
	post: ajax.bind(this, 'post'),
	get: ajax.bind(this, 'get'),
	all () {
		return Promise.all(arguments[0])
	},
	race() {
        return Promise.race(arguments[0])
    },
}

$http.ajaxSend = ()=> {}
$http.ajaxComplete = ()=> {}

// 避免重复 install，设立 flag
AjaxWatcher.installed = false
AjaxWatcher.install = Vue => {
	if (AjaxWatcher.installed) {
	return
	}
	// install 的具体逻辑
	console.log('111')
	AjaxWatcher.$http = $http

	let settings,
		openStatus = false,
		store = localStorage.getItem('ajax-watcher');

	//打开调试
	AjaxWatcher.open = (
		{
			keepingTime = 1000 * 60 * 5, //调试状态持续时间
			console = true, //是否开启控制台
			autoShow = true
		} = {}
	) => {
		settings = {
			keepingTime: keepingTime,
			console: console,
			autoShow: autoShow
		}
		localStorage.setItem('ajax-watcher', JSON.stringify({
			openTime: Date.now(),
			settings: settings
		}));
		init();
        setTimeout(function () {
            AjaxWatcher.close();
        }, settings.keepingTime);
	}
	//关闭调试
	AjaxWatcher.close = function () {
		localStorage.setItem('ajax-watcher', '');
        if (DOM.mask && DOM.container) {
            DOM.mask.hide();
            DOM.container.hide();
        }
        openStatus = false;
	};

	 //全局初始化
	 function init() {
        if (openStatus) { return; }
        openStatus = true;
        var template = '<div></div>';

        if (store) {
            settings = store.settings;
        }

		try {
			'undefined' != typeof $ ? jqueryVersion() : (function() {throw new Error('没有找到$变量，请正确引入jQuery')})();
		} catch (e) {
			throw new Error(e);
		}
    }

    //控制台执行流程，重写console
    function initConsoleExcute () {
        window._consoleExcuteResult = '';
        var _log = console.log,
            tempFunction, color,
            $output = $('.ajax-watcher-output');

        for (var key in console) {
            if (key.match(/log|debug|error|info|warn|dir/)) {
                tempFunction = console[key];
                switch (key) {
                    case 'log':
                        color = '#1F2D3D';
                        break;
                    case 'debug':
                        color = '#1D8CE0';
                        break;
                    case 'error':
                        color = '#FF4949';
                        break;
                    case 'info':
                        color = 'blue';
                        break;
                    case 'warn':
                        color = '#F7BA2A';
                        break;
                    case 'dir':
                        color = '#58B7FF';
                        break;
                    default:
                        color = '#1F2D3D';
                        break;
                }
                (function (color, tempFunction) {
                    console[key] = function () {
                        var result = '';
                        for (var i = 0; i < arguments.length; i ++) {
                            if ('object' == typeof arguments[i]) {
                                try {
                                    $('<p style="color: ' + color + '"></p>').JSONView(arguments[i]).appendTo($output);
                                } catch (e) {
                                    $output.append('<p style="color: ' + color + '">' + arguments[i].toString() + '</p>');
                                }
                            } else {
                                result += arguments[i];
                            }
                        }
                        $output.append('<p style="color: ' + color + '">' + result + '</p>');
                        tempFunction.apply(console, arguments);
                    }.bind(window);
                })(color, tempFunction);
            }
        }
    }

    //控制台执行方法，暴露到外部
    //bty，这里放在外部是为了在执行时变量的作用域在window上，从而不能访问到内部的变量。
    //开始的实现是用eval所以这么做的，现在换成append script，其实可以换成内部定义调用时bind(wind)
    window._consoleExcute = function (str) {
        $('script[feature="consoleExcute"]').remove();
        var $output = $('.ajax-watcher-output');
        try {
            var defineVar = str.match(/var\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (defineVar && defineVar.length == 2) {
                $('body').append('<script feature="consoleExcute">' + str + '</script>');
                // window._consoleExcuteResult = eval(defineVar[1]);
                window._consoleExcuteResult = defineVar.input;
            } else {
                $('body').append('<script feature="consoleExcute">window._consoleExcuteResult = (' + str + ')</script>');                
            }
            if ('object' == typeof window._consoleExcuteResult) {
                try {
                    $('<p></p>').JSONView(window._consoleExcuteResult).appendTo($output);
                } catch (e) {
                    $output.append('<p style="">' + window._consoleExcuteResult + '</p>');
                }
            } else {
                $($output).append('<p style="">' + window._consoleExcuteResult + '</p>');
            }
        } catch (e) {
            $($output).append('<p style="color: #f00">' + e.toString() + '</p>');
        }
    };

    var DOM = {};

    //鸡块瑞版本的初始化
    function jqueryVersion() {
        $('head').append(
            '<style>\
                .ajax-watcher-content p, .ajax-watcher-content div, .ajax-watcher-content ul, .ajax-watcher-content li , .ajax-watcher-content a, .ajax-watcher-content span {\
                    color: #fff;\
                }\
            </style>'
        )
		initJsonView.call(window);
        var mask = $('<div style="position: fixed;\
                display: none;\
                left: 0;\
                right: 0;\
                bottom: 0;\
                top: 0;\
                background: rgba(0,0,0,0.8);\
                pointer-events: none;\
                z-index: 1000;\
                box-sizing: border-box;\
                font-size: 28px;">\
            </div>'
        );
        var manage = $('\
            <div style="position: fixed; right: 5%; top: 5%; z-index: 1000">\
                <span style="width: 70px;\
                    line-height: 70px;\
                    text-align: center;\
                    height: 70px;\
                    background: rgba(41, 176, 217, 0.5);\
                    display: block;\
                    border: 1px solid rgba(41, 176, 217, 0.5);\
                    border-radius: 50%;\
                    font-size: 28px;" feature="open-watcher"\
                >open</span>\
            </div>\
        ');
        var container = $(
            '<div style="position: fixed; left: 0; right: 0; top: 0; bottom: 0; z-index: 1001; display: none; overflow: auto;">\
                <span feature="close-all" style="color: #fff; position: fixed; top: 40px; right: 1%;">关闭</span>\
                <span feature="clean-all" style="color: #fff; position: fixed; top: 95px; right: 1%;">清除</span>\
                <span feature="open-console" style="color: #fff; position: fixed; top: 150px; right: 1%;">控制台</span>\
            </div>'
        );
        var consoleBox = $(
            '<div style="display: none; z-index: 1002; padding: 10px; border-radius: 20px; border: 5px solid #b4a5a5; width: 80%; height: 35%; background: #fff; position: fixed; top: 50%; left: 10%;">\
                <span feature="close-console" style="color: #000; position: absolute; top: 0; right: 1%;">关闭</span>\
                <span feature="excute-console" style="color: #000; position: absolute; top: 65px; right: 1%;">执行</span>\
                <span style="color: #000; position: absolute; top: 150px; right: 1%;">字号:</span>\
                <input feature="font-size-console" style="width: 10%; color: #000; position: absolute; top: 200px; right: 1%; type="text" value="46"/>\
                <textarea style="height: 100%; width: 80%; font-size: 46px;"/>\
            </div>'
        );
        var outputBox = $(
            '<div class="ajax-watcher-output" style="display: none; overflow: auto; z-index: 1003; padding: 10px; border-radius: 20px; border: 5px solid #b4a5a5; width: 80%; height: 35%; background: #fff; position: fixed; top: 10%; left: 10%;">\
                <div>输出：<span feature="clean-output" style="display: inline-block; float: right; color: #5677fc;">清空</span></div>\
            </div>'
        );
        container.append(consoleBox, outputBox);
        container.find('span[feature="open-console"]').on('click', function () {
            if (!settings.console) {
                return alert('未开启控制台!');
            }
            consoleBox.show();
            outputBox.show();
        });
        consoleBox.find('span[feature="close-console"]').on('click', function () {
            consoleBox.hide();
            outputBox.hide();
        });
        consoleBox.find('span[feature="excute-console"]').on('click', function () {
            window._consoleExcute(consoleBox.find('textarea').val());
        }.bind(this));
        consoleBox.find('input[feature="font-size-console"]').on('input', function () {
            consoleBox.find('textarea').css('font-size', consoleBox.find('input[feature="font-size-console"]').val() + 'px');
        });
        if (!DOM.mask && !DOM.container && !DOM.manage) {
            $('body').append(mask, container, manage);
            DOM.mask = mask;
            DOM.container = container;
            DOM.manage = manage;
            container.find('span[feature="close-all"]').on('click', function () {
                DOM.mask.hide();
                DOM.container.hide();
                DOM.manage.show();
            });
            container.find('span[feature="clean-all"]').on('click', function () {
                container.find('.ajax-watcher-content').remove();
            });
            manage.find('span[feature="open-watcher"]').on('click', function () {
                DOM.mask.show();
                DOM.container.show();
                DOM.manage.hide();
            });
            if (settings.autoShow) {
                DOM.mask.show();    
                DOM.container.show();
                DOM.manage.hide();
            } else {
                DOM.mask.hide();    
                DOM.container.hide();
                DOM.manage.show();
            }
            (function () {
				let ajaxSendCallback = (e, jqXHR, ajaxOptions)=>{
					if (openStatus && settings.autoShow) {
                        DOM.mask.show();
                        DOM.container.show();
                    }
                    if (container.find('div[url="'+ajaxOptions.url+'"]').length) {
                        container.find('div[url="'+ajaxOptions.url+'"]').remove();
					}
                    var content = $(
                        '<div class="ajax-watcher-content" url='+ ajaxOptions.url +' style="display: inline-block; overflow: auto; color: #fff; max-width: 45%; border: 1px solid #fff; padding: 10px; position: relative; height: 40%; word-wrap: break-word; word-break: normal;">\
                            <span style="color: #fff; position: absolute; top: 0; right: 5px;">关闭</span>\
                            <p style="color: #fff;">url:</br>'+ajaxOptions.url+'</p>\
                            <p style="color: #fff;">type:  '+ajaxOptions.type+'</p>\
                            <p style="color: #fff;">params:</br>'+
                            ('undefined' === typeof ajaxOptions.data ? '' : ajaxOptions.data.replace(/\&/g, '</br>'))
                            +'</p>\
                            <p style="color: #fff;">status:  loadding...</p>\
                        </div>'
                    );
                    DOM.container.append(content);
                    content.children('span').on('click', function () {
                        content.remove();
                    });
				}
				let ajaxCompleteCallback = (e, xhr, settings)=> {
					var content = container.find('div[url="'+settings.url+'"]');
                    content.find('p:eq(3)').html('status:  '+xhr.status+'');
                    var json = $('<div style="color: #fff;"></div>');
                    if (xhr.responseJSON) {
                        json.JSONView(xhr.responseJSON);
                        content.append('<p style="color: #fff;">response:  </p>');
                        content.append(json);
                    } else {
                        content.append(
                            '<p style="color: #fff;">responseText:  '+xhr.responseText+'</p>'
                        );
                    }
				}
				$(document).ajaxSend(ajaxSendCallback).ajaxComplete(ajaxCompleteCallback);
				$http.ajaxSend = ajaxSendCallback;
				$http.ajaxComplete = ajaxCompleteCallback;
                if (settings.console) {
                    initConsoleExcute();
                    outputBox.find('span[feature="clean-output"]').on('click', function () {
                        outputBox.find('p').remove();
                    });
                    window.onerror = function (message, source, lineno, colno, error) {
                        outputBox.append('<p style="color: #f00">' + message + '(at: ' + source + lineno + ':行' + colno + ':列' + ')</p>');
                    };
                }
            })();
        } else {
            DOM.mask.show();
            DOM.container.show();
            DOM.manage.hide();
        }
    }

	if (store) {
        store = JSON.parse(store);
        if (Date.now() < store.openTime + store.settings.keepingTime) {
            init();
            setTimeout(function () {
                AjaxWatcher.close();
            }, store.openTime + store.settings.keepingTime - Date.now());
        } else {
            AjaxWatcher.close();
        }
    }

    //外部引用的逻辑
    //JsonView，鸡块瑞插件
    function initJsonView () {
        ! function(e) { var t, n, r, l, o; return o = ["object", "array", "number", "string", "boolean", "null"], r = function() {
            function t(e) { null == e && (e = {}), this.options = e } return t.prototype.htmlEncode = function(e) { return null !== e ? e.toString().replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "" }, t.prototype.jsString = function(e) { return e = JSON.stringify(e).slice(1, -1), this.htmlEncode(e) }, t.prototype.decorateWithSpan = function(e, t) { return '<span class="' + t + '">' + this.htmlEncode(e) + "</span>" }, t.prototype.valueToHTML = function(t, n) { var r; if(null == n && (n = 0), r = Object.prototype.toString.call(t).match(/\s(.+)]/)[1].toLowerCase(), this.options.strict && !e.inArray(r, o)) throw new Error("" + r + " is not a valid JSON value type"); return this["" + r + "ToHTML"].call(this, t, n) }, t.prototype.nullToHTML = function(e) { return this.decorateWithSpan("null", "null") }, t.prototype.undefinedToHTML = function() { return this.decorateWithSpan("undefined", "undefined") }, t.prototype.numberToHTML = function(e) { return this.decorateWithSpan(e, "num") }, t.prototype.stringToHTML = function(e) { var t, n; return /^(http|https|file):\/\/[^\s]+$/i.test(e) ? '<a href="' + this.htmlEncode(e) + '"><span class="q">"</span>' + this.jsString(e) + '<span class="q">"</span></a>' : (t = "", e = this.jsString(e), this.options.nl2br && (n = /([^>\\r\\n]?)(\\r\\n|\\n\\r|\\r|\\n)/g, n.test(e) && (t = " multiline", e = (e + "").replace(n, "$1<br />"))), '<span class="string' + t + '">"' + e + '"</span>') }, t.prototype.booleanToHTML = function(e) { return this.decorateWithSpan(e, "bool") }, t.prototype.arrayToHTML = function(e, t) { var n, r, l, o, i, s, a, p; for(null == t && (t = 0), r = !1, i = "", o = e.length, l = a = 0, p = e.length; p > a; l = ++a) s = e[l], r = !0, i += "<li>" + this.valueToHTML(s, t + 1), o > 1 && (i += ","), i += "</li>", o--; return r ? (n = 0 === t ? "" : " collapsible", '[<ul class="array level' + t + n + '">' + i + "</ul>]") : "[ ]" }, t.prototype.objectToHTML = function(e, t) { var n, r, l, o, i, s, a;
            null == t && (t = 0), r = !1, i = "", o = 0; for(s in e) o++; for(s in e) a = e[s], r = !0, l = this.options.escape ? this.jsString(s) : s, i += '<li><a class="prop" href="javascript:;"><span class="q">"</span>' + l + '<span class="q">"</span></a>: ' + this.valueToHTML(a, t + 1), o > 1 && (i += ","), i += "</li>", o--; return r ? (n = 0 === t ? "" : " collapsible", '{<ul class="obj level' + t + n + '">' + i + "</ul>}") : "{ }" }, t.prototype.jsonToHTML = function(e) { return '<div class="jsonview">' + this.valueToHTML(e) + "</div>" }, t }(), "undefined" != typeof module && null !== module && (/*module.exports = r*/true), n = function() {
        function e() {} return e.bindEvent = function(e, t) { var n; return e.firstChild.addEventListener("click", function(e) { return function(n) { return e.toggle(n.target.parentNode.firstChild, t) } }(this)), n = document.createElement("div"), n.className = "collapser", n.innerHTML = t.collapsed ? "+" : "-", n.addEventListener("click", function(e) { return function(n) { return e.toggle(n.target, t) } }(this)), e.insertBefore(n, e.firstChild), t.collapsed ? this.collapse(n) : void 0 }, e.expand = function(e) { var t, n; return n = this.collapseTarget(e), "" !== n.style.display ? (t = n.parentNode.getElementsByClassName("ellipsis")[0], n.parentNode.removeChild(t), n.style.display = "", e.innerHTML = "-") : void 0 }, e.collapse = function(e) { var t, n; return n = this.collapseTarget(e), "none" !== n.style.display ? (n.style.display = "none", t = document.createElement("span"), t.className = "ellipsis", t.innerHTML = " &hellip; ", n.parentNode.insertBefore(t, n), e.innerHTML = "+") : void 0 }, e.toggle = function(e, t) { var n, r, l, o, i, s; if(null == t && (t = {}), l = this.collapseTarget(e), n = "none" === l.style.display ? "expand" : "collapse", t.recursive_collapser) { for(r = e.parentNode.getElementsByClassName("collapser"), s = [], o = 0, i = r.length; i > o; o++) e = r[o], s.push(this[n](e)); return s } return this[n](e) }, e.collapseTarget = function(e) { var t, n; return n = e.parentNode.getElementsByClassName("collapsible"), n.length ? t = n[0] : void 0 }, e }(), t = e, l = { collapse: function(e) { return "-" === e.innerHTML ? n.collapse(e) : void 0 }, expand: function(e) { return "+" === e.innerHTML ? n.expand(e) : void 0 }, toggle: function(e) { return n.toggle(e) } }, t.fn.JSONView = function() { var e, o, i, s, a, p, c; return e = arguments, null != l[e[0]] ? (a = e[0], this.each(function() { var n, r; return n = t(this), null != e[1] ? (r = e[1], n.find(".jsonview .collapsible.level" + r).siblings(".collapser").each(function() { return l[a](this) })) : n.find(".jsonview > ul > li .collapsible").siblings(".collapser").each(function() { return l[a](this) }) })) : (s = e[0], p = e[1] || {}, o = { collapsed: !1, nl2br: !1, recursive_collapser: !1, escape: !0, strict: !1 }, p = t.extend(o, p), i = new r(p), "[object String]" === Object.prototype.toString.call(s) && (s = JSON.parse(s)), c = i.jsonToHTML(s), this.each(function() { var e, r, l, o, i, s; for(e = t(this), e.html(c), l = e[0].getElementsByClassName("collapsible"), s = [], o = 0, i = l.length; i > o; o++) r = l[o], "LI" === r.parentNode.nodeName ? s.push(n.bindEvent(r.parentNode, p)) : s.push(void 0); return s })) } }($);
    }


	// install 完毕
	AjaxWatcher.installed = true
}
// 同样，Vue 作为全局变量时自动 install
if (typeof window !== 'undefined' && window.Vue) {
	window.Vue.use(AjaxWatcher)
}
export default AjaxWatcher