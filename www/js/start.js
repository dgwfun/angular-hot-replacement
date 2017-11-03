/**
 * Created by davydeng on 2017/10/24
 * @Description
 */

var app = angular.module('starter', ['ionic'], function($controllerProvider) {
  window.controllerProvider = $controllerProvider;
});

app.run(['$injector', function ($injector) {
  window.injector = $injector;
}]);
