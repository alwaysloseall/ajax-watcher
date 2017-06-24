(function (window, document, undefined) {
    var ajaxWatcher = {},
        openStatus = false,
        store = localStorage.getItem('ajax-watcher');
        defultSettings = {
            jquery: true, //是否使用jQuery
            keepingTime: 1000 * 60 * 5 //调试状态持续时间
        },
        settings = {};
    
    (function () {
        for (var key in defultSettings) {
            settings[key] = defultSettings[key];
        }
    })();

    //打开调试
    ajaxWatcher.open = function (options) {
        console.log('opening...');
        if (options) {
            if ('object' != typeof options) { throw new Error('options必须是一个对象'); }
            for (var key in options) {
                settings[key] = options[key];
            }
        }
        localStorage.setItem('ajax-watcher', JSON.stringify({
            openTime: Date.now(),
            settings: settings
        }));
        init();
        setTimeout(function () {
            ajaxWatcher.close();
        }, settings.keepingTime);
    };

    //关闭调试
    ajaxWatcher.close = function () {
        console.log('closing...');
        localStorage.setItem('ajax-watcher', '');
        DOM.mask.hide();
        DOM.container.hide();
        openStatus = false;
    };

    function init() {
        if (openStatus) { return; }
        openStatus = true;
        var template = '<div></div>';

        if (store) {
            settings = store.settings;
        }

        jqueryVersion();    

        if (!settings.jquery) {
            throw new Error('现在的版本必须依赖jQuery！');
        } else {

        }
    }

    var DOM = {};

    function jqueryVersion() {
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
        var container = $(
            '<div style="position: fixed; left: 0; right: 0; top: 0; bottom: 0; z-index: 1001; display: none;">\
            \
            </div>');
        if (!DOM.mask && !DOM.container) {
            $('body').append(mask, container);
            DOM.mask = mask;
            DOM.container = container;
        }
        // DOM.mask.show();
        // DOM.container.show();

        (function () {
            $(document).ajaxSend(function (e, jqXHR, ajaxOptions) {
                if (openStatus) {
                    DOM.mask.show();
                    DOM.container.show();
                }
                var content = $(
                    '<div style="display: inline-block; margin-right: 20px; color: #fff;">\
                        <p>url:  '+ajaxOptions.url+'</p>\
                        <p>type:  '+ajaxOptions.type+'</p>\
                        <p>status:  loadding...</p>\
                    </div>'
                );
                DOM.container.append(content);
                $(document).ajaxComplete(function (e, xhr, settings) {
                    content.find('p:eq(2)').html('status:  '+xhr.status+'');
                    content.append(
                        '<p>responseText:  '+xhr.responseText+'</p>'
                    )
                    if (xhr.responseJSON) {
                        //ToDo
                    }
                });
            });
        })();

    }

    if (store) {
        store = JSON.parse(store);
        if (Date.now() < store.openTime + store.settings.keepingTime) {
            init();
            console.log('opening...');
            setTimeout(function () {
                ajaxWatcher.close();
            }, store.openTime + store.settings.keepingTime - Date.now());
        }
    }

    return window.ajaxWatcher = ajaxWatcher;
})(window, document);