# angular-hot-replacement
 webpack hot Replacement for angular 1.x with es6 style project

运行：
```js
npm i
npm run dev-server
````

---------------下面是说明----------------

#### 1. 什么是模块热替换

全称为`Hot Module ReplaceMent`(HMR)，理解成热模块替换或者模块热替换都可以，就是在运行中对程序的模块进行自动更新。主要是用于开发过程中，效果上就是界面的无刷新更新。

---

#### 2. 为什么要用热替换
- 项目越来越大，`webpack`越来越耗时
- 哪怕修改只是一个标点符号，都必须重新`webpack`再刷新页面才能验证
- 热替换能保持应用程序状态更新
- 即时呈现，提高开发效率

---

#### 3. webpack如何实现热替换
`webpack`内置了`webpack-dev-server`模块，可以通过简单的配置来开启：
- `webpack.config.js`中添加：
```js
devServer: {
  hotOnly: true,
  contentBase: path.join(__dirname, "www"),
  historyApiFallback: true,
  port: 8080 // 端口号
}

```
- package.json的scripts中添加

```js
"dev-server": "webpack-dev-server --config ./webpack.config.js --progress --hot"
```
- 然后启动
```js
npm run dev-server
```
主要的配置就这些，那它是如何工作的呢？[webpack-dev-server官方文档](https://doc.webpack-china.org/concepts/hot-module-replacement/)
- 首先，`webpack-dev-server`是一个小型的`Node.js` `Express`服务器，它使用`webpack-dev-middleware`来服务于`webpack`的包，同时监听文件改动并对改动的文件重新编译。

- 在hot模式下，`webpack`打包时会在我们的`entry`中根据配置添加一些入口文件并打包进我们的包中。这些代码是用来与服务器之间通讯和模块的更新。

- 前端和后端之间的通讯是通过`websocket`来进行，后端编译完成后会把更新的信息推送到前端，前端会根据信息下载需要更新的文件并对模块进行更新。

- 需要注意的是，要使`HMR`功能生效，还需要做一件事情，就是要在应用热替换的模块或者根模块里面加入允许热替换的代码。否则，热替换不会生效。
具体代码：
```js
if(module.hot)
    module.hot.accept();
```
- 前端收到更新文件是`xx.hot.update.js`形式的文件。检测到允许热替换后就会将相应的`module`替换掉从而实现热替换，这时候再`require`的话就是新的js代码了。

具体过程分析参考 [详解webpack-dev-server的使用](https://segmentfault.com/a/1190000006964335)

---

#### 4. Angular 1.x 如何实现热替换
webpack-dev-server只是把你重新编译好的代码推送给你了，但是页面并不会自动更新，Angular 1.x官方也并没有提供支持，要实现页面的自动更新，我们还需要做些额外的工作。
- 首先，你需要更新你的页面，`angular`提供了现成的方法：
```js
if($state)
    $state.reload();
```
- 这时候当前页面会更新，但是页面并没有改变，因为angular对页面还有缓存，还需要把页面缓存给全局关掉：
```js
$ionicConfigProvider.views.maxCache(0)
```
- 再试，你会发现页面还是没改变，代码逻辑也还是走的老的，并不会更新。深入分析`angular`源码发现，`angular`在启动的时候会将所有对象的入口缓存下来，再根据需求进行`invoke`，以`controller`为例，所有`controller`在`angular`启动的时候都会在`$ControllerProvider`中进行`register`操作把`controller`的入口函数缓存下来，然后进入到页面的时候才会把`controller`实例`invoke`出来，因此可以看到，`angular`在这里还有一层缓存，我们要实现更新还需要替换掉这里的缓存，要实现`controller`的更新，我们还需要：

```js
// $ControllerProvider对象需要在angular的module.config的时候才能获取到，
// 因此需要在cofig中先缓存下来这里再用
if (window && window.controllerProvider) {
    window.controllerProvider.register('homeController', homeController);
}
```
- 这个时候再试，页面就更新了，因此对于controller的更新代码：

```js
do {
  if (module && module.hot) {
    module.hot.accept();
    var $injector = window.injector;
    if (!$injector || !$injector.has('$state')) {
      break;
    }
    var $state = $injector.get('$state');
    if (!$state) {
      break;
    }
    var $timeout = $injector.get('$timeout');
    if (!$timeout) {
      break;
    }
    $timeout(function () {
      if (window && window.controllerProvider) {
        window.controllerProvider.register('homeController', homeController);
      }
      $state.reload();
    });
  }
} while (0);
```
- 这里只是实现了`controller`的更新，其他模块也需要做类似的操作才能实现。如`html`文件是缓存的路由的`template`里，因此更新`html`需要：

```js
var handleState = $state.get('home');
if(handleState) {
  handleState.template = module.exports;
}
```
- service的更新比较特殊，一般service都缓存有一些数据和状态等信息，我们不希望重新注入导致丢失状态，因此只是更新它的方法：
```js
if ($injector.has('homeService')) {
  const origin = $injector.get('homeService');
  Object.getOwnPropertyNames(homeService.prototype).forEach(func => {
  if (func != 'constructor') {
    origin.__proto__[func] = homeService.prototype[func];
  }
})
```
- `Directive`的更新原理也是找到angular缓存的地方并更新它：

```js
if ($injector.has('view1Directive')) {
  var directives = $injector.get('view1Directive');
  for (var i = 0; i < directives.length; i++) {
    var directive = directives[i];
    var new_directive = view1Directive();
    Object.getOwnPropertyNames(new_directive).forEach(function (val) {
      directive[val] = new_directive[val];
    });
  }
}
```
-  有些html是缓存在`Directive`中的，因此需要更新的是`Directive`中的`template`:

```js
if ($injector.has('view1Directive')) {
  var directives = $injector.get('view1Directive');
  for (var i = 0;i<directives.length;i++) {
    var directive = directives[i];
    if(directive){
      directive.template = module.exports;
    }
  }
}
```
以上这些都只是angular模块对应的更新方法，要实现自动更新的效果还需要这些代码嵌入到我们的源码中，我们可以利用webpack的Loader来实现。[如何开发一个 Webpack Loader](http://www.alloyteam.com/2016/01/webpack-loader-1/)



