/**
 * Created by davydeng on 2017/10/24
 * webpack hot Replacement for angular 1.x with es6 style project
 */

const ctrlReg = /\.controller\s*\(\s*['"][\w]+['"]\s*,\s*(\w+)?\s*\)/g;
const serviceReg = /\.service\s*\(\s*['"][\w]+['"]\s*,\s*(\w+)?\s*\)/g;
const directiveReg = /\.directive\s*\(\s*['"](\w+)['"]\s*,\s*(\w+)?\s*\)/g;
const exportReg = /export\s*\{\s*(\w+)?\s*[\,]?\s*(\w+)?\s*\}/g;
const routerReg = /state[\s\(\:]*?['"](\w+)?['"][\s\S]*?template[\s\S]*?require\(['"]([\s\S]*?)['"]\)/g;
const cacheReg = /\$ionicConfigProvider.views.maxCache\(\s*(\w+)\s*\)/g;
const directiveInfoReg = /(function|var|let)\s*(\w+)\s*(\=\s*\(\s*\)\s*\=\>|\=\s*function\s*\(\s*\)|\(\s*\))[return\{\s\r\n]*?restrict\s*\:\s*['"][EACM]+['"][\s\S]*?template\s*\:\s*require\s*\(\s*['"]([\s\S]*?)['"]\s*\)/g;

var ctrl_arr = [];
var service_arr = [];
var router_map = {};
var directive_arr = [];
var directive_map = {};

module.exports = function(source) {
  this.cacheable();
  function getPostfix(str) {
    var segs = str.split('.');
    if(segs.length <= 1){
      return '';
    }else{
      return segs.pop();
    }
  }
  function getFileName(str) {
    var arr = str.split('/');
    return arr[arr.length-1];
  }
  var need_reload = false;
  source = handleBegin(source);
  var postfix = getPostfix(this.resourcePath);
  // js文件更新
  if(postfix == 'js'){
    // 设置maxCache数量，去掉缓存
    source = source.replace(cacheReg,function (str) {
      return '$ionicConfigProvider.views.maxCache(0)';
    });
    // 提取controller
    while ((result = ctrlReg.exec(source)) != null)  {
      ctrl_arr.push(result[1]);
    }
    // 提取service
    while ((result = serviceReg.exec(source)) != null)  {
      service_arr.push(result[1]);
    }
    // 提取directive
    while ((result = directiveReg.exec(source)) != null)  {
      directive_arr[result[2]] = result[1];
    }
    // 提取directive关联的html
    while ((result = directiveInfoReg.exec(source)) != null)  {
      var dt = result[2];
      if(directive_arr[dt]) {
        var template = getFileName(result[4]);
        directive_map[template] = directive_arr[dt];
      }
    }
    // 提取路由信息及关联的html
    while ((result = routerReg.exec(source)) != null)  {
      if(result[1] && result[2]){
        var router = result[1];
        var template = getFileName(result[2]);
        router_map[template] = router;
      }
    }
    // 提取export的对象，根据对象类型添加对应的更新代码
    while ((result = exportReg.exec(source)) != null)  {
      var idx = 0;
      while (result[++idx] !=null)
      {
        var export_module = result[idx];
        // controller类型
        if(ctrl_arr.indexOf(export_module)!=-1){
          source = handleController(source,export_module);
          need_reload = true
        }
        // service类型
        else if(service_arr.indexOf(export_module)!=-1){
          source = handleService(source,export_module);
          need_reload = true;
        }
        // directive类型
        else if(directive_arr[export_module]!=null){
          source = handleDirective(source,directive_arr[export_module],export_module);
          need_reload = true;
        }
      }
    }
  } else if(postfix == 'html') { // 处理html文件更新
    var name = getFileName(this.resourcePath);
    // 路由里的html
    var state = router_map[name];
    if(state){
      source = handleRouterHtml(source,state);
      need_reload = true;
    }
    // directive中的html
    var directive = directive_map[name];
    if(directive){
      source = handleDirectiveHtml(source,directive);
      need_reload = true;
    }
  }
  if(need_reload){
    source = handleReload(source);
  }
  source = handleEnd(source);
  //console.log("directive_map:",directive_map);
  return source;
};

function handleBegin(source) {
  return source +
    "\ndo {\n" +
    "if(module && module.hot) {\n"+
    " module.hot.accept();\n" +
    " var $injector = window.injector;\n" +
    " if(!$injector || !$injector.has('$state')) {\n" +
    "   break;\n" +
    " }\n" +
    " var $state = $injector.get('$state');\n" +
    " if(!$state) {\n" +
    "  break;\n" +
    " }\n" +
    " var $timeout = $injector.get('$timeout');\n" +
    " if(!$timeout) {\n" +
    "  break;\n" +
    " }\n" +
    " $timeout(function() {\n"
}

function handleController(source,cls) {
  return source +
    "if(window && window.controllerProvider) {\n" +
    " window.controllerProvider.register('"+cls+"',"+cls+");\n" +
    "}\n"
}

function handleService(source,cls) {
  return source +
    "if($injector.has('"+cls+"')) {\n" +
    " const origin = $injector.get('"+cls+"');\n" +
    " Object.getOwnPropertyNames("+cls+".prototype).forEach((func)=>{\n" +
    "   if(func!='constructor') {\n" +
    "     origin.__proto__[func] = "+cls+".prototype[func];\n" +
    "   }\n" +
    " });\n" +
    "}\n";
}

function handleDirective(source,directive,construction) {
  return source +
    "if ($injector.has('"+directive+"Directive')) {\n" +
    " var directives = $injector.get('"+directive+"Directive');\n" +
    " for (var i = 0;i<directives.length;i++) {\n" +
    "   var directive = directives[i];\n" +
    "   var new_directive = "+construction+"();\n" +
    "   Object.getOwnPropertyNames(new_directive).forEach(function(val){\n" +
    "     directive[val] = new_directive[val];\n" +
    "   });\n" +
    " }\n" +
    "}\n"
}

function handleRouterHtml(source,state) {
  return source +
    "var handleState = $state.get('"+state+"');\n" +
    "if(handleState) {\n" +
    "  handleState.template = module.exports;\n" +
    "}\n"
}

function handleDirectiveHtml(source,directive) {
  return source +
    "if ($injector.has('"+directive+"Directive')) {\n" +
    " var directives = $injector.get('"+directive+"Directive');\n" +
    " for (var i = 0;i<directives.length;i++) {\n" +
    "   var directive = directives[i];\n" +
    "   if(directive){\n" +
    "     directive.template = module.exports;\n" +
    "   }\n" +
    " }\n" +
    "}\n"
}

function handleReload(source) {
  return source +
    "$state.reload();\n"
}

function handleEnd(source) {
  return source +
    " });\n" +
    "}\n" +
    "}while(0);";
}


