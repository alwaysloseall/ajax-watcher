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
#### Q: 这个调试工具适用于什么场景
>A: 适用于已上线的移动端项目，解决不便于调试的问题，主要可以解决调试代码兼容性，了解报错信息
#### Q: 为什么要设置keepingTime
>A: 因为我在微信开发中，经常遇到个别用户在线上版本出现奇怪的bug，又没有调试的方法，于是让其打开调试，并设置一个持续时间
#### Q: 如何开启调试，在代码中嵌入ajaxWatcher.open()吗
>A: 我不建议你这么做，因为这样会让所有用户都进入调试页面，可以参照test-setting.html做一个设置界面，让开发人员进入此页打开调试，因为调试的设置是放在localStorage里的，会对全站有效