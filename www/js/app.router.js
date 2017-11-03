/**
 * Created by davydeng on 2017/10/24
 * @Description
 */

function AppRouter($stateProvider, $urlRouterProvider,$ionicConfigProvider) {
  $stateProvider
    .state('home', {
      url: "/home",
      template: require('./controller/home.view.html'),
      controller: 'homeController',
      controllerAs: 'vm',
      cache:true
    })
    .state('subPage', {
      url: "/subPage",
      template: require('./controller/sub.view.html'),
      controller: 'subController',
      controllerAs: 'vm',
      cache:true
    });

  $urlRouterProvider.otherwise('/home');
  $ionicConfigProvider.views.maxCache(10);
}

export {AppRouter};
