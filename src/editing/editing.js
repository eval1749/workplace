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
   * @param {!Document} document
   * @return {!Editor}
   */
  function getOrCreateEditor(document) {
    if (!document.editor_)
      document.editor_ = new editing.Editor(document);
    return document.editor_;
  }

  /**
   * @param {string} name
   * @return {?function}
   */
  function lookupCommand(name) {
    return commandTable[name.toLowerCase()] || null;
  }

  /**
   * @param {!Array.<string>} members
   * @return {!Set.<string>}
   * IE11 doesn't support |new Set(Array)|.
   */
  function newSet(members) {
    var set = new Set(members);
    if (!set.size) {
      members.forEach(function(member) {
        set.add(member);
      });
    }
    return set;
  }

  Object.defineProperties(editing, {
    define: {value: define},
    defineCommand: {value: defineCommand},
    getOrCreateEditor: {value: getOrCreateEditor},
    lookupCommand: {value: lookupCommand},
    newSet: {value: newSet}
  });
})();

// TODO(yosin) Once, Node.isContentEditable works for nodes without render
// object, we dont' need to have |isContentEditablePollyfill|.
// http://crbug.com/313082
editing.define('isContentEditable', function(node) {
  if (window.document === node.ownerDocument &&
      node.style.display != 'none') {
    return node.isContentEditable;
  }
  if (node.isContentEditable)
    return true;
  if (node.nodeType != Node.ELEMENT_NODE)
    return false;
  var contentEditable = node.getAttribute('contenteditable');
  if (typeof(contentEditable) != 'string')
    return false;
  return contentEditable.toLowerCase() != 'false';
});
