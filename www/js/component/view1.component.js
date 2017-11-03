/**
 * Created by davydeng on 2017/10/30
 * @Description
 */

class view1Controller{
    constructor() {
        this.initialize();
    }
    initialize() {
        this.val = 'ttt1';
    }
}

function view1Directive() {
  return {
    restrict        : 'E',
    template        : require('./view1.html'),
    controller      : 'view1Controller',
    controllerAs    : "vmComp1",
    bindToController: true,
  }
}

export {view1Controller, view1Directive};
