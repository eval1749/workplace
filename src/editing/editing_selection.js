// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

editing.define('EditingSelection', (function() {
 /**
  * @param {!Node} node1
  * @param {!Node} node2
  * @return {!Node}
  */
 function computeCommonAncestor(node1, node2) {
   console.assert(node1.ownerDocument === node2.ownerDocument);
   if (node1 === node2)
     return node1;
   var depth1 = 0;
   for (var node = node1; node; node = node.parentNode) {
     if (node == node2)
       return node;
     ++depth1;
   }
   var depth2 = 0;
   for (var node = node2; node; node = node.parentNode) {
     if (node == node1)
       return node;
     ++depth2;
   }
   var runner1 = node1;
   var runner2 = node2;
   if (depth1 > depth2) {
     for (var depth  = depth1; depth > depth2; --depth) {
       runner1 = runner1.parentNode;
     }
   } else if (depth2 > depth1) {
     for (var depth  = depth2; depth > depth1; --depth) {
       runner2 = runner2.parentNode;
     }
   }
   while (runner1) {
     if (runner1 == runner2)
       return runner1;
      runner1 = runner1.parentNode;
      runner2 = runner2.parentNode;
   }
   console.assert(!runner2);
   return null;
 }

 /**
  * @return {!Node}
  */
 function computeEditingRoot(domNode) {
   var lastEditable = null;
   while (domNode) {
     if (domNode.isContentEditable)
       lastEditable = domNode;
     else if (lastEditable)
       return lastEditable;
     domNode = domNode.parentNode;
   }
   return document;
 }

 /**
  * @param {!Node} node
  * @return {number}
  */
 function indexOfNode(node) {
   var parentNode = node.parentNode;
   var childNodes = parentNode.childNodes;
   for (var index = 0; index < childNodes.length; ++index) {
     if (childNodes[index] === node)
       return index;
   }
   throw 'NOTREACEHD';
 }

  /**
   * @constructor
   * @param {!EditingContext} context
   * Construct |EditingSelection| object initialized with DOM selection.
   */
  function EditingSelection(context) {
    //console.assert(console instanceof editing.EditingContext);

    this.anchorPosition_ = null;
    this.context_ = context;
    this.focusPosition_ = null;
    this.startIsAnchor_ = true;

    var domSelection = window.getSelection();
    if (!domSelection.rangeCount)
      return;

    var selection = this;

    function visit(domNode, parentNode) {
      var node = new editing.EditingNode(context, domNode);
      if (parentNode)
        parentNode.appendChild(node);
      var afterTextNode = null;
      if (domSelection.anchorNode === domNode) {
        if (selection.focusPosition_)
          selection.startIsAnchor_ = false;
        var offset = domSelection.anchorOffset;
        if (domNode instanceof CharacterData) {
          if (offset && offset < domNode.nodeValue.length) {
            afterTextNode = node.splitText(offset);
            if (!selection.focusPosition_) {
              node = afterTextNode;
              offset = 0;
            }
          }
        }
        selection.anchorPosition_ = new editing.EditingPosition(node, offset);
      }
      if (domSelection.focusNode === domNode) {
        if (afterTextNode) {
          selection.focusPosition_ = selection.anchorPosition_;
        } else {
          var offset = domSelection.focusOffset;
          if (domNode instanceof CharacterData) {
console.log('EditingPosition', 'offset', offset);
            if (offset && offset < domNode.nodeValue.length) {
              afterTextNode = node.splitText(offset);
              if (!selection.anchorPosition_) {
                node = afterTextNode;
                offset = 0;
              }
            }
          }
          selection.focusPosition_ = new editing.EditingPosition(node, offset);
       }
      }
      if (afterTextNode)
        parentNode.appendChild(afterTextNode);
      var domChild = domNode.firstChild;
      while (domChild) {
        var child = visit(domChild, node);
        domChild = domChild.nextSibling;
      }
      return node;
    }

    var domCommonAncestor = computeCommonAncestor(domSelection.anchorNode,
                                                  domSelection.focusNode);
    var domEditingRoot = computeEditingRoot(domCommonAncestor);
    var editingRoot = visit(domEditingRoot, null);

    console.log('EditingSelection HTM', testing.serialzieNode(editingRoot));
    console.log('EditingSelection SEL', this.anchorPosition_, this.focusPosition_);

    function adjustOffset(position, offset) {
      var splitOffset = position.containerNode.splitOffset;
      var offset = position.offsetInContainer;
      return splitOffset >= 0 ? offset : offset - splitOffset;
    }

    console.assert(this.anchorNode.domNode === domSelection.anchorNode);
    console.assert(adjustOffset(this.anchorPosition_) ==
                   domSelection.anchorOffset);
    console.assert(this.focusNode.domNode === domSelection.focusNode);
    console.assert(adjustOffset(this.focusPosition_) ==
                   domSelection.focusOffset);
  }

  /**
   * @this {!EditingSelection}
   * @return {?EditingNode}
   */
  function anchorNode() {
    if (!this.anchorPosition_)
      throw new Error('Selection is empty.');
    return this.anchorPosition_.containerNode;
  }

  /**
   * @this {!EditingSelection}
   * @return {number}
   */
  function anchorOffset() {
    if (!this.anchorPosition_)
      throw new Error('Selection is empty.');
    return this.anchorPosition_.offsetInContainer;
  }

  /*
   * @this {!EditingSelection}
   * @param {!EditingNode}node
   */
  function enclose(node) {
    console.assert(node instanceof EditingNode);
    var position = new EditingPosition(node.parentNode, indexOfNode(node));
    anchorPosition_ = focusPosition_ = position;
  }

  /**
   * @this {!EditingSelection}
   * @return {?EditingNode}
   */
  function focusNode() {
    if (!this.focusPosition_)
      throw new Error('Selection is empty.');
    return this.focusPosition_.containerNode;
  }

  /**
   * @this {!EditingSelection}
   * @return {number}
   */
  function focusOffset() {
    if (!this.focusPosition_)
      throw new Error('Selection is empty.');
    return this.focusPosition_.offsetInContainer;
  }

  /**
   * @this {!EditingSelection}
   * @return {boolean}
   */
  function isCaret() {
    return !this.isEmpty && this.anchorPosition_.equals(this.focusPosition_);
  }

  /**
   * @this {!EditingSelection}
   * @return {boolean}
   */
  function isEmpty() {
    if (!this.anchorPosition_) {
      console.assert(!this.focusPosition_);
      return true;
    }

    console.assert(this.focusPosition);
    return false;
  }

  /**
   * @this {!EditingSelection}
   * @return {boolean}
   */
  function isRange() {
    return !this.isEmpty && !this.anchorPosition_.equals(this.focusPosition_);
  }

  Object.defineProperties(EditingSelection.prototype, {
    anchorPosition: {get: function() { return this.anchorPosition_; }},
    anchorPosition_: {writable: true},
    anchorNode: {get: anchorNode},
    anchorOffset: {get: anchorOffset},
    context: {get: function() { return this.context_;}},
    context_: {writable: true},
    focusNode: {get: focusNode},
    focusOffset: {get: focusOffset},
    enclose: {value: enclose},
    isCaret: {get: isCaret},
    isEmpty: {get: isEmpty},
    isRange: {get: isRange},
    focusPosition: {get: function() { return this.focusPosition_; }},
    focusPosition_: {writable: true},
    startIsAnchor: {get: function() { return this.startIsAnchor_; }},
    startIsAnchor_: {writable: true}
  });

  return EditingSelection;
})());
