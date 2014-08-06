// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

//////////////////////////////////////////////////////////////////////
//
// EditingSelection
//
// This class represent selection for editing initialized from DOM selection.
// Unlike DOM selection API, |anchorNode| and |focusNode| are always container
// node. If DOM selection API holds text node in |anchorNode| or |focusNode|,
// |EditingSelection| constructor split text node at offset in |EditingNode|
// with editing instructions.
//
editing.define('EditingSelection', (function() {
  function followingNode(node) {
    if (!node)
      return null;
    if (node.firstChild)
      return node.firstChild;
     var nextSibling = node.nextSibling;
     if (nextSibling)
       return nextSibling;
     var parentNode = node.parentNode;
     while (parentNode) {
       if (parentNode.nextSibling)
         return parentNode.nextSibling;
       parentNode = parentNode.parentNode;
     }
     return null;
  }

  function FollowingNodes(startNode) {
    this.currentNode_ = startNode;
  }

  FollowingNodes.prototype.next = function() {
    var resultNode = this.currentNode_;
    if (!resultNode)
      return {done: true};
    this.currentNode_ = followingNode(this.currentNode_);
    return {done: false, value: resultNode};
  };

  // nextNode(<a><b>foo|</b><a>bar) = bar
  function nextNode(node) {
    while (node) {
      if (node.nexeSibling)
        return node.nextSibling;
      node = node.parentNode;
    }
    return null;
  }

  /**
   * @param {!EditingSelection} selection
   * @return {!Array.<!EditingNode>}
   *
   * Note: When selection range has no node, e.g. <p><a>foo^</a>|</p>; enclosing
   * end tag, return value is empty array.
   */
  function collectNodesInSelection(selection) {
    if (selection.isEmpty)
      return [];
    var startNode = selection.anchorNode.childNodes[selection.anchorOffset];
    if (!startNode)
      startNode = nextNode(selection.anchorNode.lastChild);
    var endNode = selection.focusNode.childNodes[selection.focusOffset];
    if (!endNode)
      endNode = nextNode(selection.focusNode.lastChild);
    if (!selection.anchorIsStart_) {
      var temp = startNode;
      startNode = endNode;
      endNode = temp;
    }
    // Both, |startNode| and |endNode| are nullable, e.g. <a><b>abcd|</b></a>
    if (!startNode)
      return [];

    var nodes = [];
    var iterator = new FollowingNodes(startNode);
    var current;
    while (!(current = iterator.next()).done) {
      nodes.push(current.value);
      if (current.value === endNode)
        break;
    }
    return nodes;
  }

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
   * @param {!Node} domNode
   * @return {!Node}
   * |domNode| should be common ancestor of |anchorNode| and |focusNode|.
   */
  function computeEditingRoot(domNode) {
    var lastEditable = null;
    for (var domRunner = domNode; domRunner; domRunner = domRunner.parentNode) {
      if (editing.isContentEditable(domRunner))
        lastEditable = domRunner;
      else if (lastEditable)
        return lastEditable;
    }
    console.log('computeEditingRoot', 'No editable');
    return null;
  }

  /**
   * @param {!Object} treeContext
   * @param {!Node} domNode
   * @return {!editing.EditingNode}
   */
  function createEditingTree(treeContext, domNode) {
    console.assert(domNode instanceof Node);
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
   * @param {!EditingNode} node
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
   * @param {!editing.EditingNode} node
   * @param {number} offset
   * @return {!editing.EditingNode}
   *
   * TODO(yosin) We should remove |splitText| and |insertAfter| instructions
   * if we don't change anchor and focus of selection.
   */
  function splitText(node, offset) {
    console.assert(node.parentNode);
    var newNode = node.splitText(offset);
    node.parentNode.insertAfter(newNode, node);
    console.assert(node.nextSibling === newNode);
    console.assert(newNode.previousSibling === node);
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

    this.anchorIsStart_ = false;
    this.anchorNode_ = null;
    this.anchorOffset_ = 0;
    this.context_ = context;
    this.focusNode_ = null;
    this.focusOffset_ = null;
    this.nodes_ = [];

    if (!domSelection || !domSelection.rangeCount)
      return;

    var domCommonAncestor = computeCommonAncestor(domSelection.anchorNode,
                                                  domSelection.focusNode);
    console.assert(domCommonAncestor instanceof Node);
    var treeContext = {
      context: context,
      domSelection: domSelection,
      selection: this
    };
    var domRoot = computeEditingRoot(domCommonAncestor);
    if (!domRoot) {
      // There is no editable in selection.
      return;
    }
    this.rootForTesting_ = createEditingTree(treeContext, domRoot);

    var anchorNode = this.anchorNode_;
    var anchorOffset = domSelection.anchorOffset;
    var focusNode = this.focusNode_;
    var focusOffset = domSelection.focusOffset;

    if (domSelection.collapsed()) {
      if (isNeedSplit(anchorNode, anchorOffset)) {
        anchorNode = splitText(anchorNode, anchorOffset);
        anchorOffset = 0;
        focusNode = anchorNode;
        focusOffset = 0;
      }

    } else {
      var range = domSelection.getRangeAt(0);
      this.anchorIsStart_ = range.startContainer == anchorNode.domNode &&
                            range.startOffset == anchorOffset;
      var splitAnchorNode = isNeedSplit(anchorNode, anchorOffset);
      var splitFocusNode = isNeedSplit(focusNode, focusOffset);

      if (anchorNode === focusNode && splitAnchorNode && splitFocusNode) {
        if (this.anchorIsStart_) {
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
          if (this.anchorIsStart_) {
            anchorNode = newNode;
            anchorOffset = 0;
            if (newNode.parentNode == focusNode)
              ++focusOffset;
          }
        }

        if (splitFocusNode) {
          var newNode = focusNode.splitText(focusNode, focusOffset);
          if (!this.anchorIsStart_) {
            focusNode = newNode;
            focusOffset = 0;
          }
        }
      }
    }

    // Convert text node + offset to container node + offset.
    if (anchorNode.isText) {
      console.assert(!anchorOffset ||
                     anchorOffset == anchorNode.nodeValue.length);
      anchorOffset = anchorOffset ? indexOfNode(anchorNode) + 1
                                  : indexOfNode(anchorNode);
      anchorNode = anchorNode.parentNode;
    }

    if (focusNode.isText) {
      console.assert(!focusOffset ||
                     focusOffset == focusNode.nodeValue.length);
      focusOffset = focusOffset ? indexOfNode(focusNode) + 1
                                : indexOfNode(focusNode);
      focusNode = focusNode.parentNode;
    }
    this.anchorNode_ = anchorNode;
    this.anchorOffset_ = anchorOffset;
    this.focusNode_ = focusNode;
    this.focusOffset_ = focusOffset;
    this.nodes_ = collectNodesInSelection(this);
  }

  /**
   * @this {!editing.EditingSelection}
   * @return {editing.SelectionDirection}
   */
  function direction() {
    return this.anchorIsStart_ ? editing.SelectionDirection.ANCHOR_IS_START :
                                 editing.SelectionDirection.FOCUS_IS_START;
  }

  /**
   * @this {!editing.EditingSelection}
   * @return {boolean}
   */
  function isCaret() {
    return !this.isEmpty && this.anchorNode_ === this.focusNode_ &&
           this.anchorOffset_ === this.focusOffset_;
  }

  /**
   * @this {!editing.EditingSelection}
   * @return {boolean}
   */
  function isEmpty() {
    return !this.anchorNode_;
  }

  /**
   * @this {!editing.EditingSelection}
   * @return {boolean}
   */
  function isRange() {
    return !this.isEmpty && !this.isCaret;
  }

  Object.defineProperties(EditingSelection.prototype, {
    anchorIsStart_: {writable: true},
    anchorNode: {get: function() { return this.anchorNode_; }},
    anchorNode_: {writable: true},
    anchorOffset: {get: function() { return this.anchorOffset_; }},
    anchorOffset_: {writable: true},
    context: {get: function() { return this.context_;}},
    context_: {writable: true},
    direction: {get: direction},
    focusNode: {get: function() { return this.focusNode_; }},
    focusNode_: {writable: true},
    focusOffset: {get: function() { return this.focusOffset_; }},
    focusOffset_: {writable: true},
    isCaret: {get: isCaret},
    isEmpty: {get: isEmpty},
    isRange: {get: isRange},
    nodes: {get: function() { return this.nodes_; }},
    nodes_: {writable: true},
    rootForTesting: {get: function() { return this.rootForTesting_; }},
    rootForTesting_: {writable: true},
  });

  return EditingSelection;
})());
