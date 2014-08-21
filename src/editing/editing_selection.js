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
// |EditingSelection| constructor split text node at offset in |Node|
// with editing instructions.
//
editing.define('EditingSelection', (function() {
  // NextNodes iterator
  function NextNodes(startNode) {
    this.currentNode_ = startNode;
  }

  NextNodes.prototype.next = function() {
    var resultNode = this.currentNode_;
    if (!resultNode)
      return {done: true};
    this.currentNode_ = nextNode(this.currentNode_);
    return {done: false, value: resultNode};
  };

  // nextNode(<a><b>foo|</b><a>bar) = bar
  function nextNode(current) {
    if (current.firstChild)
      return current.firstChild;
    if (current.nextSibling)
      return current.nextSibling;
    return nextAncestorOrSibling(current);
  }

  function nextAncestorOrSibling(current) {
    console.assert(!current.nextSibling);
    for (var parent = current.parentNode; parent; parent = parent.parentNode) {
      if (parent.nextSibling)
        return parent.nextSibling;
    }
    return null;
  }

  function nextNodeSkippingChildren(current) {
    if (current.nextSibling)
      return current.nextSibling;
    return nextAncestorOrSibling(current);
  }

  /**
   * @param {!EditingSelection} selection
   * @return {!Array.<!Node>}
   *
   * Note: When selection range has no node, e.g. <p><a>foo^</a>|</p>; enclosing
   * end tag, return value is empty array.
   */
  function collectNodesInSelection(selection) {
    if (selection.isEmpty)
      return [];

    var startNode = selection.startContainer.childNodes[selection.startOffset];
    if (!startNode)
      startNode = nextNode(selection.startContainer.lastChild);
    var endContainer = selection.endContainer;
    var endNode = endContainer.childNodes[selection.endOffset];
    if (!endNode)
      endNode = nextNodeSkippingChildren(endContainer.lastChild);

    // Both, |startNode| and |endNode| are nullable, e.g. <a><b>abcd|</b></a>
    if (!startNode)
      return [];

    var nodes = [];
    var iterator = new NextNodes(startNode);
    var current;
    while (!(current = iterator.next()).done) {
      if (current.value === endNode)
        break;
      if (current.value == endContainer && !selection.endOffset)
        break;
      nodes.push(current.value);
    }
    return nodes;
  }

  /**
   * @param {!Node} node1
   * @param {!Node} node2
   * @return {?Node}
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
   * @param {!Node} node
   * @return {!Node}
   * |node| should be common ancestor of |anchorNode| and |focusNode|.
   */
  function computeEditingRoot(node) {
    var lastEditable = null;
    for (var runner = node; runner; runner = runner.parentNode) {
      if (editing.isContentEditable(runner))
        lastEditable = runner;
      else if (lastEditable)
        return lastEditable;
    }
    console.log('computeEditingRoot', 'No editable');
    return null;
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
   * @param {!EditingSelection} selection
   * @param {!editing.EditingContext} context
   */
  function initSelection(selection, context) {
    /**
     * @param {!Node} node
     * @param {number} offset
     * @return {boolean}
     */
    function isNeedSplit(node, offset) {
      return editing.nodes.isText(node) && offset &&
             offset < node.nodeValue.length;
    }

    if (selection.isEmpty)
      return;

    if (selection.isCaret) {
      if (isNeedSplit(selection.anchorNode, selection.anchorOffset)) {
        selection.anchorNode_ = splitTextAndInsert(
            context, selection.anchorNode, selection.anchorOffset);
        selection.anchorOffset_ = 0;
        selection.focusNode_ = selection.anchorNode;
        selection.focusOffset_ = 0;
      }
      return;
    }

    var anchorNode = selection.anchorNode;
    var anchorOffset = selection.anchorOffset;
    var focusNode = selection.focusNode;
    var focusOffset = selection.focusOffset;
    var splitAnchorNode = isNeedSplit(anchorNode, anchorOffset);
    var splitFocusNode = isNeedSplit(focusNode, focusOffset);
    if (anchorNode === focusNode && splitAnchorNode && splitFocusNode) {
      if (selection.anchorIsStart_) {
        anchorNode = splitTextAndInsert(context, anchorNode, anchorOffset);
        focusNode = anchorNode;
        focusOffset -= anchorOffset;
        anchorOffset = 0;
        splitTextAndInsert(context, focusNode, focusOffset);
      } else {
        focusNode = splitTextAndInsert(context, focusNode, focusOffset);
        anchorNode = focusNode;
        anchorOffset -= focusOffset;
        focusOffset = 0;
        splitTextAndInsert(context, anchorNode, anchorOffset);
      }

    } else {
      if (splitAnchorNode) {
        var newNode = splitTextAndInsert(context, anchorNode, anchorOffset);
        if (selection.anchorIsStart_) {
          anchorNode = newNode;
          anchorOffset = 0;
          if (newNode.parentNode == focusNode)
            ++focusOffset;
        }
      }

      if (splitFocusNode) {
        var newNode = splitTextAndInsert(context, focusNode, focusOffset);
        if (!selection.anchorIsStart_) {
          focusNode = newNode;
          focusOffset = 0;
        }
      }
    }

    // Convert text node + offset to container node + offset.
    if (editing.nodes.isText(anchorNode)) {
      console.assert(!anchorOffset ||
                     anchorOffset == anchorNode.nodeValue.length);
      anchorOffset = anchorOffset ? indexOfNode(anchorNode) + 1
                                  : indexOfNode(anchorNode);
      anchorNode = anchorNode.parentNode;
    }

    if (editing.nodes.isText(focusNode)) {
      if (focusOffset && focusOffset != focusNode.nodeValue.length) {
        throw new Error('focusOffset ' + focusOffset + ' must be zero or ' +
                        focusNode.nodeValue.length);
      }
      focusOffset = focusOffset ? indexOfNode(focusNode) + 1
                                : indexOfNode(focusNode);
      focusNode = focusNode.parentNode;
    }
    selection.anchorNode_ = anchorNode;
    selection.anchorOffset_ = anchorOffset;
    selection.focusNode_ = focusNode;
    selection.focusOffset_ = focusOffset;
    selection.nodes_ = collectNodesInSelection(selection);
  }

  /**
   * @param {!EditingContext} context
   * @param {!Node} node
   * @param {number} offset
   * @return {!Node}
   *
   * TODO(yosin) We should remove |splitText| and |insertAfter| instructions
   * if we don't change anchor and focus of selection.
   */
  function splitTextAndInsert(context, node, offset) {
    console.assert(node.parentNode);
    if (!offset || offset >= node.nodeValue.length) {
      throw new Error('Offset ' + offset + ' must be grater than zero and ' +
                      'less than ' + node.nodeValue.length + ' for ' + node);
    }
    var newNode = context.splitText(node, offset);
    context.insertAfter(node.parentNode, newNode, node);
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
  function EditingSelection(context, selection) {
    this.anchorIsStart_ =
        selection.direction == editing.SelectionDirection.ANCHOR_IS_START;
    this.anchorNode_ = selection.anchorNode;
    this.anchorOffset_ = selection.anchorOffset;
    this.context_ = context;
    this.focusNode_ = selection.focusNode;
    this.focusOffset_ = selection.focusOffset;
    this.nodes_ = [];
    initSelection(this, context);
    Object.seal(this);
  }

  /**
   * @param {!EditingSelection} context
   * @return {!Array.<!Node>}
   * Computes effective nodes for inline formatting commands.
   */
  function computeEffectiveNodes() {
    var nodesInRange = this.nodes;
    if (!nodesInRange.length)
      return nodesInRange;
    var firstNode = nodesInRange[0];
    for (var ancestor = firstNode.parentNode; ancestor;
         ancestor = ancestor.parentNode) {
      if (!editing.nodes.isEditable(ancestor))
        break;
      if (ancestor.firstChild !== firstNode)
        break;
      // TODO(yosin) We should use more efficient way to check |ancestor| is
      // in selection.
      var lastNode = editing.nodes.lastWithIn(ancestor);
      if (nodesInRange.findIndex(function(x) { return x == lastNode; }) < 0)
        break;
      nodesInRange.unshift(ancestor);
      firstNode = ancestor;
    }
    return nodesInRange;
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
   * @return {!Node}
   */
  function endContainer() {
    console.assert(this.anchorNode_);
    return this.anchorIsStart ? this.focusNode_ : this.anchorNode_;
  }

  /**
   * @this {!editing.EditingSelection}
   * @return {number}
   */
  function endOffset() {
    console.assert(this.anchorNode_);
    return this.anchorIsStart ? this.focusOffset_ : this.anchorOffset_;
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


  /**
   * @this {!editing.EditingSelection}
   * @return {!Node}
   */
  function startContainer() {
    console.assert(this.anchorNode_);
    return this.anchorIsStart ? this.anchorNode_ : this.focusNode_;
  }

  /**
   * @this {!editing.EditingSelection}
   * @return {number}
   */
  function startOffset() {
    console.assert(this.anchorNode_);
    return this.anchorIsStart ? this.anchorOffset_ : this.focusOffset_;
  }

  /**
   * @this {!editing.EditingSelection}
   * @return {!editing.ReadOnlySelection}
   */
  function value() {
    return new editing.ReadOnlySelection(
        this.anchorNode_, this.anchorOffset_,
        this.focusNode_, this.focusOffset_,
        this.anchorIsStart_ ? editing.SelectionDirection.ANCHOR_IS_START :
                              editing.SelectionDirection.FOCUS_IS_START);
  }

  Object.defineProperties(EditingSelection.prototype, {
    anchorIsStart: {get: function() { return this.anchorIsStart_; }},
    anchorIsStart_: {writable: true},
    anchorNode: {get: function() { return this.anchorNode_; }},
    anchorNode_: {writable: true},
    anchorOffset: {get: function() { return this.anchorOffset_; }},
    anchorOffset_: {writable: true},
    computeEffectiveNodes: {value: computeEffectiveNodes},
    context: {get: function() { return this.context_;}},
    context_: {writable: true},
    direction: {get: direction},
    endContainer: {get: endContainer},
    endOffset: {get: endOffset},
    focusNode: {get: function() { return this.focusNode_; }},
    focusNode_: {writable: true},
    focusOffset: {get: function() { return this.focusOffset_; }},
    focusOffset_: {writable: true},
    isCaret: {get: isCaret},
    isEmpty: {get: isEmpty},
    isRange: {get: isRange},
    nodes: {get: function() { return this.nodes_; }},
    nodes_: {writable: true},
    startContainer: {get: startContainer},
    startOffset: {get: startOffset},
    value: {get: value}
  });

  return EditingSelection;
})());
