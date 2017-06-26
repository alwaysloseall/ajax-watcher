# ajax-watcher
为移动开发提供一个ajax请求监听的测试工具

## Getting Start
```javascript
ajaxWatcher.open(); //默认参数

ajaxWatcher.open({ //可选参数
    jquery: true, //当前版本依赖jQuery
    keepingTime: 1000 * 60 * 5, //保持监控的持续时间
    console: true //是否开启控制台
});
```
### API
* ``` ajaxWatcher.close(); ``` 关闭调试

## Q&A
#### Q: 为什么要设置keepingTime
>A: 因为我在微信开发中，经常遇到个别用户在线上版本出现奇怪的bug，又没有调试的方法，于是让其打开调试，并设置一个持续时间