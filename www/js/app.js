/**
 * Created by davydeng on 2017/10/24
 * @Description
 */
import '../css/style.css';

import {AppRouter} from './app.router.js';
app.config(AppRouter);

import {abcService} from './service/abc.service.js'
app.service('abcService', abcService)

import {homeController} from './controller/home.ctrl.js';
app.controller('homeController', homeController);

import {subController} from './controller/sub.ctrl.js';
app.controller('subController', subController);

import {view1Controller, view1Directive} from './component/view1.component.js';
app.controller('view1Controller', view1Controller);
app.directive('view1', view1Directive);


import {view2Controller, view2Directive} from './component/view2.component.js';
app.directive('view2', view2Directive);
app.controller('view2Controller', view2Controller);


