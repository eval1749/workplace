// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

// We use EditingPosition only for EditingSelection.
// We should not use EditingPosition in editing commands.
editing.define('EditingPosition', (function() {
  /**
   * @param {!EditingNode} containerNode
   * @param {number} offsetInContainer
   */
  function EditingPosition(containerNode, offsetInContainer) {
    console.assert(containerNode instanceof editing.EditingNode);
    console.assert(offsetInContainer >= 0);
    if (containerNode.firstChild) {
      console.assert(editing.nodes.isElement(containerNode));
      console.assert(offsetInContainer <= containerNode.childNodes.length);
    } else {
      console.assert(offsetInContainer <=
                     containerNode.nodeValue.length);
    }
    this.containerNode_ = containerNode;
    this.offsetInContainer_ = offsetInContainer;
  }

  /**
   * @this {!EditingPosition}
   * @param {!EditingPosition}
   * @return {boolean}
   */
  function equals(other) {
    return this.containerNode_ === other.containerNode_ &&
           this.offsetInContainer_ === other.offsetInContainer_;
  }

  /**
   * @this {!EditingPosition}
   * @return {?EditingNode}
   */
  function nodeAtPosition() {
    var childNodes = this.containerNode_.childNodes;
    if (this.offsetInContainer_ == childNodes.length)
      return null;
    console.assert(this.offsetInContainer < childNodes.length);
    return childNodes[this.offsetInContainer_];
  }

  Object.defineProperties(EditingPosition.prototype, {
    containerNode: {get: function() { return this.containerNode_; }},
    containerNode_: {writable: true},
    equals: {value: equals},
    nodeAtPosition: {value: nodeAtPosition},
    offsetInContainer: {get: function() { return this.offsetInContainer_; }},
    offsetInContainer_: {writable: true}
  });

  return EditingPosition;
})());
