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
   * @param {!Object} treeContext
   * @param {!Node} domNode
   * @return {!editing.EditingNode}
   */
  function createEditingTree(treeContext, domNode) {
    var node = new editing.EditingNode(treeContext.context, domNode);
    if (treeContext.domSelection.anchorNode == domNode)
      treeContext.selection.anchorNode_ = node;
    if (treeContext.domSelection.focusNode == domNode)
      treeContext.selection.focusNode_ = node;
    var domChild = domNode.firstChild;
    while (domChild) {
      var child = createEditingTree(treeContext, domChild);
      node.appendChild(child);
      domChild = domChild.nextSibling;
    }
    return node;
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
   * @param {!editing.EditingNode} node
   * @param {number} offset
   * @return {boolean}
   */
  function isNeedSplit(node, offset) {
    console.assert(node instanceof editing.EditingNode);
    return node.isText && offset && offset < node.nodeValue.length;
  }

  /**
   */
  function splitText(node, offset) {
    var newNode = node.splitText(offset);
    node.parentNode.insertAfter(newNode, node);
    return newNode;
  }

  /**
   * @constructor
   * @param {!editing.EditingContext} context
   * @param {Object} selection Once |Selection| keeps passed node and offset,
   *    we don't need to use |selection| parameter.
   *
   * Construct |EditingSelection| object initialized with DOM selection.
   */
  function EditingSelection(context, domSelection) {
    //console.assert(console instanceof editing.EditingContext);

    this.anchorNode_ = null;
    this.anchorOffset_ = 0;
    this.context_ = context;
    this.focusNode_ = null;
    this.focusOffset_ = null;
    this.startIsAnchor_ = false;

    if (!domSelection || !domSelection.rangeCount)
      return;

console.log('====================');
    var domCommonAncestor = computeCommonAncestor(domSelection.anchorNode,
                                                  domSelection.focusNode);
    console.assert(domCommonAncestor instanceof Node);
console.log('EditingSelection DOM ca', domCommonAncestor);
    var domEditingRoot = computeEditingRoot(domCommonAncestor);
console.log('EditingSelection DOM', domEditingRoot);
    var treeContext = {
      context: context,
      domSelection: domSelection,
      selection: this
    };
    var editingRoot = createEditingTree(treeContext, domEditingRoot);
console.log('EditingSelection HTM', testing.serialzieNode(editingRoot));

    var anchorNode = this.anchorNode_;
console.log('EditingSelection domAnchor', domSelection.anchorNode, anchorNode.nodeValue);
    var anchorOffset = domSelection.anchorOffset;
    var focusNode = this.focusNode_;
    var focusOffset = domSelection.focusOffset;

    if (domSelection.collapsed()) {
console.log('EditingSelection collapsed');
      if (isNeedSplit(anchorNode, anchorOffset)) {
        anchorNode = splitText(anchorNode, anchorOffset);
        anchorOffset = 0;
        focusNode = anchorNode;
        focusOffset = 0;
      }

    } else {
      var range = domSelection.getRangeAt(0);
      this.startIsAnchor_ = range.startContainer == anchorNode.domNode &&
                            range.startOffset == anchorOffset;
      var splitAnchorNode = isNeedSplit(anchorNode, anchorOffset);
      var splitFocusNode = isNeedSplit(focusNode, focusOffset);

console.log('EditingSelection split', splitAnchorNode, splitFocusNode);

      if (anchorNode === focusNode && splitAnchorNode && splitFocusNode) {
        if (this.startIsAnchor) {
          anchorNode = splitText(anchorNode, anchorOffset);
          focusNode = anchorNode;
          focusOffset -= anchorOffset;
          anchorOffset = 0;
          splitText(focusNode, focusOffset);
        } else {
          focusNode = splitText(focusNode, focusOffset);
          anchorNode = focusNode;
          anchorOffset -= focusOffset;
          focusOffset = 0;
          splitText(anchorNode, anchorOffset);
        }

      } else {
        if (splitAnchorNode) {
          var newNode = splitText(anchorNode, anchorOffset);
          if (this.startIsAnchor) {
            anchorNode = newNode;
            anchorOffset = 0;
          }
        }

        if (splitFocusNode) {
          var newNode = focusNode.splitText(focusNode, focusOffset);
          if (!this.startIsAnchor) {
            focusNode = newNode;
            focusOffset = 0;
          }
        }
      }
    }

    this.anchorNode_ = anchorNode;
    this.anchorOffset_ = anchorOffset;
    this.focusNode_ = focusNode;
    this.focusOffset_ = focusOffset;
console.log('EditingSelection SEL', this.anchorNode_, this.anchorOffset_,
            this.focusNode_, this.focusOffset_);
  }

  /**
   * @this {!EditingSelection}
   * @return {?editing.EditingNode}
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
   * @param {!editing.EditingNode} node
   */
  function enclose(node) {
    console.assert(node instanceof EditingNode);
    var position = new EditingPosition(node.parentNode, indexOfNode(node));
    this.anchorNode_ = node.parentNode;
    this.anchorOffset_ = indexOfNode(node);
    this.focusNode = node.parentNode;
    this.focusOffset_ = this.anchorOffset_ + 1;
    this.startIsAnchor_ = false;
  }

  /**
   * @this {!EditingSelection}
   * @return {boolean}
   */
  function isCaret() {
    return !this.isEmpty && this.anchorNode_ === this.focusNode_ &&
           this.anchorOffset_ === this.focusOffset_;
  }

  /**
   * @this {!EditingSelection}
   * @return {boolean}
   */
  function isEmpty() {
    return !this.anchorNode_;
  }

  /**
   * @this {!EditingSelection}
   * @return {boolean}
   */
  function isRange() {
    return !this.isEmpty && !this.isCaret;
  }

  Object.defineProperties(EditingSelection.prototype, {
    anchorNode: {get: function() { return this.anchorNode_; }},
    anchorNode_: {writable: true},
    anchorOffset: {get: function() { return this.anchorOffset_; }},
    anchorOffset_: {writable: true},
    context: {get: function() { return this.context_;}},
    context_: {writable: true},
    focusNode: {get: function() { return this.focusNode_; }},
    focusNode_: {writable: true},
    focusOffset: {get: function() { return this.focusOffset_; }},
    focusOffset_: {writable: true},
    enclose: {value: enclose},
    isCaret: {get: isCaret},
    isEmpty: {get: isEmpty},
    isRange: {get: isRange},
    startIsAnchor: {get: function() { return this.startIsAnchor_; }},
    startIsAnchor_: {writable: true}
  });

  return EditingSelection;
})());