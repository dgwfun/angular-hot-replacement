/**
 * Created by davydeng on 2017/10/30
 * @Description
 */

class view2Controller{
    constructor() {
        this.initialize();
    }
    initialize() {
        this.val = 'tttt';
    }
}

function view2Directive() {
  return {
    restrict        : 'E',
    template        : '<p><span>Component View 2 cccc ctrlVal:{{vmComp2.val}}</span></p>',
    controller      : 'view2Controller',
    controllerAs    : "vmComp2",
    bindToController: true,
  }
}

export {view2Controller, view2Directive};
