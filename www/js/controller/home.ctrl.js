/**
 * Created by davydeng on 2017/10/24
 * @Description
 */

class homeController{
  constructor() {
    var abcService = window.injector.get('abcService')
    this.ctrlValue = 'John Doe aaass';
    this.serviceValue = abcService.get();
  }
  onClick(){
    console.log('onClick  111');
  }
  goSubPage(){
    var $state = window.injector.get('$state');
    $state.go('subPage');
  }
}

export {homeController};
