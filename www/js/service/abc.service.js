/**
 * Created by davydeng on 2017/10/24
 * @Description
 */

class abcService {
  constructor() {
    this.val = '123';
  }
  get(){
    this.val = 'ttt'
    return this.val;
  }
}

export {abcService};

