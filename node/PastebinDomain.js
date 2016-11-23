/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/*global, brackets*/

(function () {
    "use strict";
  
    var os        = require("os");
    var PastebinAPI = require("pastebin-js");
    var pastebin = false;
    //function createPasteFromSelection(options,cb) {
    function createPaste(text,title,format,privacy,expiration,cb) {
      if( pastebin == false) {
        return false;
      }
      return pastebin
        //.createPaste(options)
        .createPaste({
          text: text,
          title: title,
          privacy: privacy,
          expiration: expiration,
          format: format
        })
        .then(function(url){ 
          cb(null,url);
        })
        .fail(function(err){
          cb(err);
          console.error(err);
        });
    }
  
    function logIn(token, username, password) {
      pastebin = new PastebinAPI({
        'api_dev_key': token,
        'api_user_name': username,
        'api_user_password':password
      });
    }
    /**
     * 
     * @param {DomainManager} domainManager The DomainManager for the server
     */
    function init(domainManager) {
        if (!domainManager.hasDomain("pastebin")) {
          domainManager.registerDomain("pastebin", {major: 0, minor: 1});
        }
      domainManager.registerCommand(
        "pastebin",
        "createPaste",
        createPaste,
        true,
        "Creates a paste",
        [{name: "total", // TODO
            type: "object",
            description: "True to return total memory, false to return free memory"}],
        [{name: "Promise", // return values
            type: "object",
            description: "Pastebin obj"}]
      );
      domainManager.registerCommand(
        "pastebin",
        "logIn",
        logIn,
        false,
        "Logs the user in",
        [
          {
            name: "token",
            type: "String",
            description: "Pastebin token. Required for extension to actually upload the pastes."
          },
          {
            name: "username",
            type: "String",
            description: "Pastebin username. You can provide those if you want to create private pastes."
          },
          {
            name: "total",
            type: "object",
            description: "Pastebin password. You can profide those if you want to create private pastes."
          }

        ],
        []
      );
    }
    
    exports.init = init;
}());