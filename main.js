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
maxerr: 50, browser: true */
/*global $, define, brackets */


define(function (require, exports, module) {
  "use strict";

  var ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
      NodeDomain     = brackets.getModule("utils/NodeDomain"),
      EditorManager  = brackets.getModule("editor/EditorManager"),
      CommandManager = brackets.getModule("command/CommandManager"),
      Menus          = brackets.getModule("command/Menus"),
      Dialogs        = brackets.getModule("widgets/Dialogs"),
      DefaultDialogs = brackets.getModule("widgets/DefaultDialogs"),
      Strings        = brackets.getModule("strings"),
      Mustache       = brackets.getModule("thirdparty/mustache/mustache"),
      Preferences    = brackets.getModule("preferences/PreferencesManager");

  var $availableFormats;
  var pastebinDomain = new NodeDomain("pastebin", ExtensionUtils.getModulePath(module, "node/PastebinDomain"));
  var notifyDomain = new NodeDomain("notify",
  ExtensionUtils.getModulePath(module, "node/NotifyDomain"));
  var prefs = Preferences.getExtensionPrefs("worie.brackets-pastetobin");

  function copyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();

    try {
      var successful = document.execCommand('copy');
      var msg = successful ? 'successful' : 'unsuccessful';
      return 'Copying text command was ' + msg;

    } catch (err) {
      return 'Oops, unable to copy';
    }

    document.body.removeChild(textArea);
  }

  ExtensionUtils.loadStyleSheet(module,'./css/styles.css');
  ExtensionUtils.loadFile(module,'./pastebinFormats.json')
  .done(function(data){
    $availableFormats = JSON.parse(data);
  });


  function _getSelectedText() {
    // TODO: If no selected, get all content
    return EditorManager.getActiveEditor().getSelectedText(true);
  }

  function createPaste(options) {
    var text = options.text;
    var privacy = options.privacy;
    var format = options.format;
    var title = options.title;
    var expiration = options.expiration;
    var paste = options.paste;

    //return pastebinDomain.exec("createPaste", options);
    return pastebinDomain.exec("createPaste", text,title,format,privacy,expiration);
  }

  function notify(title, msg) {
    notifyDomain.exec("notify",title,msg);
  }

  function onPasteRequest() {
    var fields = {
      title: 'PasteToBin ('+(new Date().toDateString()+')')
    }

    var $template = $(
      Mustache.render(require("text!html/confirm_template.html"),
      {
        "Strings":Strings, 
        "PasteToBinContent":_getSelectedText(), 
        "Formats":$availableFormats.formats,
        "Expousure":$availableFormats.expousure,
        "Expiration":$availableFormats.expiration,
        "Title": fields.title
      }));

    var d = Dialogs.showModalDialogUsingTemplate($template, true);
    var dialog = d.getElement();

    d.done(function (buttonId) {
      if (buttonId === 'done') {
        var options = {
          text: dialog.find("#paste").val(),
          title: dialog.find("#title").val(),
          format: dialog.find("#format").val(),
          privacy: Number(dialog.find("#privacy").val()),
          expiration: dialog.find("#expiration").val()          
        };
        createPaste(options).then(function(url){
          notify("Paste uploaded!", copyTextToClipboard('http://pastebin.com/'+url)); 
        });         
      }
    });
  }

  var CREATE_PASTE = "pastebin.createPaste";
  CommandManager.register("PasteToBin", CREATE_PASTE, onPasteRequest);

  var SHOW_PREFERENCES = "pastebin.showPreferences";
  CommandManager.register("PasteToBin config", SHOW_PREFERENCES, showPreferences);

  // Create a menu item bound to the command
  var fileMenu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
  fileMenu.addMenuItem(CREATE_PASTE, "Ctrl-Alt-W");
  var editMenu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
  editMenu.addMenuItem(SHOW_PREFERENCES);

  function showPreferences() {
    var $template = $(
      Mustache.render(require("text!html/preferences_template.html"),
      {
        "Strings":Strings,
        "Preferences": {
          "token": prefs.get("token"),
          "username": prefs.get("username"),
          "password": prefs.get("password")
        }
      })
    );

    var d = Dialogs.showModalDialogUsingTemplate($template, true);
    var dialog = d.getElement();
    d.done(function(buttonId){
      if(buttonId === 'done') {
        if(prefs.get("token")!==dialog.find("#token").val()){
          prefs.set("token",dialog.find("#token").val());
        }
        if(prefs.get("username")!==dialog.find("#username").val()){
          prefs.set("username",dialog.find("#username").val());
        }
        if(prefs.get("password")!==dialog.find("#password").val()){
          prefs.set("password",dialog.find("#password").val());
        }
      }
      logIn();
    });
  }

  function logIn(){
    var token = prefs.get("token");
    var username = prefs.get("username");
    var password = prefs.get("password");
    pastebinDomain.exec("logIn", token, username, password);
  }

  // TODO: Check if Token is OK. 
  if(typeof prefs.get("token")==='undefined' || prefs.get("token").length===0){
   showPreferences(); 
  } else {
    logIn();
  }
}); 