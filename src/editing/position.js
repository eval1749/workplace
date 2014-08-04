// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

editing.define('EditingEditingPosition', (function() {
  /**
   * @param {!EditingNode} containerNode
   * @param {number} offsetInContainerNode
   */
  function EditingPosition(containerNode, offsetInContainerNode) {
    console.assert(offsetInContainerNode >= 0);
    console.assert(offsetInContainerNode <= containerNode.childNodes.length);
    this.containerNode_ = containerNode;
    this.offsetInContainerNode_ = offsetInContainerNode;
  }

  /**
   * @this {!EditingPosition}
   * @param {!EditingPosition}
   * @return {boolean}
   */
  function equals(other) {
    return this.containerNode_ === other.containerNode_ &&
           this.offsetInContainerNode === other.offsetInContainerNode;
  }

  /**
   * @this {!EditingPosition}
   * @return {?EditingNode}
   */
  function nodeAtEditingPosition() {
    var childNodes = this.containerNode_.childNodes;
    if (this.offsetInContainerNode_ == childNodes.length)
      return null;
    console.assert(this.offsetInContainerNode < childNodes.length);
    return childNodes[this.offsetInContainerNode_];
  }

  Object.defineProperties(EditingPosition.prototype, {
    containerNode: {get: function() { return containerNode_; }},
    containerNode_: {writable: true},
    equals: {value: equals},
    nodeAtEditingPosition: {value: nodeAtEditingPosition},
    offsetInContainerNode: {get: function() { return offsetInContainerNode_; }},
    offsetInContainerNode_: {writable: true}
  });

  return EditingPosition;
})());
