/*
 * This Source Code Form is subject to the terms of the Mozilla Public License,
 * v. 2.0. If a copy of the MPL was not distributed with this file, You can
 * obtain one at http://mozilla.org/MPL/2.0/. OpenMRS is also distributed under
 * the terms of the Healthcare Disclaimer located at http://openmrs.org/license.
 *
 * Copyright (C) OpenMRS Inc. OpenMRS is a registered trademark and the OpenMRS
 * graphic logo is a trademark of OpenMRS Inc.
 */

var consoleElementId = '#console';

var Console = {

    info: function (msg, cssClass){
        var ele = document.querySelector(consoleElementId);
        var clazz = !cssClass ? '' : cssClass;
        angular.element(ele).append('> <span class="'+clazz+'">'+msg+'</span><br>');
    },

    warn: function (warningMsg){
        this.info(warningMsg, 'warning-msg');
    },

    error: function (errorMsg){
        this.info(errorMsg, 'error-msg');
    },

    clear: function (){
        var ele = document.querySelector(consoleElementId);
        angular.element(ele).html('');
    }
    
};