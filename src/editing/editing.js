// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

var editing = {};

(function() {
  // TODO(yosin) Once ES6 Map is ready, we should use it for |commandTable|.
  var commandTable = {};

  /**
   * @param {string} name
   * @param {*} value
   */
  function define(name, value) {
    Object.defineProperty(editing, name, {value: value});
  }

  /**
   * @param {string} name
   * @param {!function} commandFunction
   */
  function defineCommand(name, commandFunction) {
    var canonicalName = name.toLowerCase();
    commandTable[canonicalName] = commandFunction;
    if (canonicalName == 'backcolor')
      defineCommand('hilitecolor', commandFunction);
  }

  /**
   * @param {string} name
   * @return {?function}
   */
  function lookupCommand(name) {
    return commandTable[name.toLowerCase()] || null;
  }

  Object.defineProperties(editing, {
    define: {value: define},
    defineCommand: {value: defineCommand},
    lookupCommand: {value: lookupCommand}
  });
})();

// TODO(yosin) Once, Node.isContentEditable works for nodes without render
// object, we dont' need to have |isContentEditablePollyfill|.
// http://crbug.com/313082
editing.define('isContentEditable', function(domNode) {
  if (window.document === domNode.ownerDocument &&
      domNode.style.display != 'none') {
    return domNode.isContentEditable;
  }
  if (domNode.isContentEditable)
    return true;
  if (domNode.nodeType != Node.ELEMENT_NODE)
    return false;
  var contentEditable = domNode.getAttribute('contenteditable');
  if (typeof(contentEditable) != 'string')
    return false;
  return contentEditable.toLowerCase() != 'false';
});
