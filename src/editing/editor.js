// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

editing.define('Editor', (function() {
  function Editor(context) {
    this.context_ = context;
  }

  /**
   * @this {!Editor}
   * @param {!EditingNode} oldParent
   * @param {!EditingNode} refNode
   */
  function insertChildrenBefore(oldParent, refNode) {
    var newParent = refNode.parentNode;
    var child = oldParent.firstChild;
    while (child) {
      var nextSibling = child.nextSibling;
      newParent.insertBefore(child, refNode);
      child = nextSibling;
    }
  }

  /**
   * @this {!Editor}
   * @param {!EditingNode} node
   * @param {string} propertyName
   * @param {string} newValue
   */
  function setStyle(node, propertyName, newValue) {
    this.context_.setStyle(node, propertyName, newValue);
    node.styleMap[propertyName] = newValue;
  }

  Object.defineProperties(Editor.prototype, {
    context: {get: function() { return this.context_; }},
    context_: {writable: true},
    insertChildrenBefore: {value: insertChildrenBefore},
    setStyle: {value: setStyle}
  });
  return Editor;
})());
