/**
 * Created by davydeng on 2017/10/24
 * webpack hot Replacement for angular 1.x with es6 style project
 */

const cacheReg = /\$ionicConfigProvider.views.maxCache\(\s*(\w+)\s*\)/g;
const importReg = /import\s*\{([0-9a-zA-Z_,\s]*?)}\s*from\s*['"]([\s\S]*?)['"]/g
const ctrlReg = /\.controller\s*\(\s*['"]([0-9a-zA-Z_]+)['"]\s*,\s*([0-9a-zA-Z_]+)\s*\)/g;
const serviceReg = /\.service\s*\(\s*['"]([0-9a-zA-Z_$]+)['"]\s*,\s*([0-9a-zA-Z_$]+)\s*\)/g;
const directiveReg = /\.directive\s*\(\s*['"]([0-9a-zA-Z_]+)['"]\s*,\s*([0-9a-zA-Z_]+)\s*\)/g;
const routerReg = /state[\s\(\:]*?['"]([0-9a-zA-Z_]+)?['"][\s\S]*?template[\s\S]*?require\(['"]([\s\S]*?)['"]\)/g;
const directiveInfoReg = /(function|var|let)\s*([0-9a-zA-Z_]+)\s*(\=\s*\(\s*\)\s*\=\>|\=\s*function\s*\(\s*\)|\(\s*\))[return\{\s\r\n]*?restrict\s*\:\s*['"][EACM]+['"][\s\S]*?template\s*\:\s*require\s*\(\s*['"]([\s\S]*?)['"]\s*\)/g;

var import_arr = [];

module.exports = function(source) {
  if (this.cacheable) {
    this.cacheable();
  }
  // 设置maxCache数量，去掉缓存
  source = source.replace(cacheReg,function (str) {
    return '$ionicConfigProvider.views.maxCache(0)';
  });

  var result = null;
  var handleMap = {};
  // 提取所有的import对象
  while ((result = importReg.exec(source)) != null)  {
    var arr = result[1].split(',');
    var file = result[2];
    for(var i in arr){
      var imp = arr[i].replace(/(^\s*)|(\s*$)/g, "");
      import_arr[imp] = file;
    }
  }
  // 处理controller
  while ((result = ctrlReg.exec(source)) != null)  {
    var file = import_arr[result[2]];
    if(file) {
      var handles = handleMap[file] || [];
      handles.unshift({tp:'controller',name:result[1],cls:result[2]})
      handleMap[file] = handles;
    }
  }
  // 处理service
  while ((result = serviceReg.exec(source)) != null)  {
    var file = import_arr[result[2]];
    if(file) {
      var handles = handleMap[file] || [];
      handles.unshift({tp:'service',name:result[1],cls:result[2]})
      handleMap[file] = handles;
    }
  }
  // 处理路由信息关联的html
  while ((result = routerReg.exec(source)) != null)  {
    if(result[1] && result[2]){
      var handles = handleMap[result[2]] || [];
      handles.unshift({tp:'routerHtml',name:result[1],cls:null})
      handleMap[result[2]] = handles;
    }
  }
  // 处理directive
  while ((result = directiveReg.exec(source)) != null) {
    var file = import_arr[result[2]];
    if(file!=null) {
      var handles = handleMap[file] || [];
      handles.unshift({tp:'directive',name:result[1],cls:result[2]})
      handleMap[file] = handles;
    }
  }
  // 处理directive关联的html
  while ((result = directiveInfoReg.exec(source)) != null) {
    if(result[4] && result[2]){
      var handles = handleMap[result[4]] || [];
      handles.unshift({tp:'directiveHtml',name:result[2],cls:null})
      handleMap[result[4]] = handles;
    }
  }
  if(Object.keys(handleMap).length >0){
    source += "\nif(module && module.hot) {\n";
  }
  for(var file in handleMap) {
    source += "module.hot.accept('"+file+"',function (deps) {\n";
    var handles = handleMap[file];
    for(var i=0;i<handles.length;++i){
      var handle = handles[i];
      switch (handle.tp){
        case 'controller':
          source += "refreshController('"+handle.name+"',__webpack_require__(deps[0])."+handle.cls+")\n";
          break;
        case 'service':
          source += "refreshService('"+handle.name+"',__webpack_require__(deps[0])."+handle.cls+")\n";
          break;
        case 'routerHtml':
          source += "refreshHtml(deps[0],'"+handle.name+"',__webpack_require__(deps[0]))\n";
          break;
        case 'directive':
          source += "refreshDirective('"+handle.name+"Directive',__webpack_require__(deps[0])."+handle.cls+"())\n";
          break;
        case 'directiveHtml':
          source += "refreshDirectiveHtml(deps[0],'"+handle.name+"',__webpack_require__(deps[0]))\n";
          break;
        default:
          break;
      }
    }
    source += "})\n";
  }
  if(Object.keys(handleMap).length >0){
    source += "}\n";
  }
  if(Object.keys(handleMap).length >0){
    source += refreshController();
    source += refreshService();
    source += refreshHtml();
    source += refreshDirective();
    source += refreshDirectiveHtml();
    source += reloadPage();
  }
  return source;
};

function reloadPage() {
  return [
    "function reloadPage() {",
    " var $injector = window.injector;",
    " if(!$injector || !$injector.has('$state')) {",
    "   return;",
    " }",
    " var $state = $injector.get('$state');",
    " if(!$state) {",
    "   return;",
    " }",
    " var $timeout = $injector.get('$timeout');",
    " if(!$timeout) {",
    "  return;",
    " }" ,
    " $timeout(function() {",
    "   $state.reload();",
    " });",
    "}\n"].join("\n");
}

function refreshController() {
  return [
    "function refreshController(name,cls) {",
    " if(window && window.controllerProvider) {",
    "   window.controllerProvider.register(name,cls);",
    "   reloadPage();",
    "   console.log('[HMR] refreshController:'+name);",
    " }",
    "}\n"].join("\n");
}

function refreshService() {
  return [
    "function refreshService(name,cls) {",
    " var $injector = window.injector;",
    " if(!$injector || !$injector.has(name)) {",
    "   return;",
    " }",
    " const origin = $injector.get(name);",
    " Object.getOwnPropertyNames(cls.prototype).forEach((func)=>{",
    "   if(func!='constructor') {",
    "     origin.__proto__[func] = cls.prototype[func];",
    "   }",
    " });",
    " reloadPage();",
    " console.log('[HMR] refreshService:'+name);",
    "}\n"].join("\n");
}

function refreshHtml() {
  return [
    "function refreshHtml(file,state,cxt) {",
    " var $injector = window.injector;" ,
    " if(!$injector || !$injector.has('$state')) {",
    "   return;",
    " }",
    " var $state = $injector.get('$state');",
    " if(!$state) {",
    "   return;",
    " }",
    "   var handleState = $state.get(state);",
    "   if(handleState) {",
    "     handleState.template = cxt;",
    "     reloadPage();",
    "     console.log('[HMR] refreshHtml:'+file);",
    "   }",
    "}\n"].join("\n");
}

function refreshDirective() {
  return [
    "function refreshDirective(name,cls) {",
    " var $injector = window.injector;" ,
    " if(!$injector || !$injector.has(name)) {",
    "   return;",
    " }",
    " var directives = $injector.get(name);",
    " for (var i = 0;i<directives.length;i++) {",
    "   var directive = directives[i];",
    "   var new_directive = cls;",
    "   Object.getOwnPropertyNames(new_directive).forEach(function(val){",
    "     directive[val] = new_directive[val];",
    "   });",
    " }",
    " reloadPage();",
    " console.log('[HMR] refreshDirective:'+name);",
    "}\n"].join("\n");
}

function refreshDirectiveHtml() {
  return [
    "function refreshDirectiveHtml(file,name,cxt) {",
    " var $injector = window.injector;" ,
    " if(!$injector || !$injector.has(name)) {",
    "   return;",
    " }",
    " var directives = $injector.get(name);",
    " for (var i = 0;i<directives.length;i++) {",
    "   var directive = directives[i];",
    "   if(directive){",
    "     directive.template = cxt;",
    "   }",
    " }",
    " reloadPage();",
    " console.log('[HMR] refreshDirectiveHtml:'+file);",
    "}\n"].join("\n");
}