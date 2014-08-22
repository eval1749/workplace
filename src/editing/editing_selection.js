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
   * @param {!EditingSelection} selection
   */
  function normalizeSelection(selection) {
    var context = selection.context_;

    /**
     * @param {!EditingContext} context
     * @param {!Node} node
     * @param {number} offset
     * TODO(yosin) We should remove |splitText| and |insertAfter| instructions
     * if we don't change anchor and focus of selection.
     */
    function splitIfNeeded(node, offset) {
      if (!editing.nodes.isText(node) || !offset)
        return;
      var text = node.nodeValue;
      if (text.length == offset)
        return;
      if (!offset || offset >= text.length) {
        throw new Error('Offset ' + offset + ' must be grater than zero and ' +
                        'less than ' + text.length + ' for ' + node);
      }
      var newNode = context.splitText(node, offset);
      context.insertAfter(node.parentNode, newNode, node);
      if (selection.anchorNode === node && selection.anchorOffset >= offset) {
        selection.anchorNode_ = newNode;
        selection.anchorOffset_ -= offset;
      }
      if (selection.focusNode === node && selection.focusOffset >= offset) {
        selection.focusNode_ = newNode;
        selection.focusOffset_ -= offset;
      }
    }

    function useContainerIfNeeded(node, offset) {
      if (!editing.nodes.isText(node))
        return;
      var container = node.parentNode;
      var offsetInContainer = editing.nodes.nodeIndex(node);
      if (selection.anchorNode === node && selection.anchorOffset == offset) {
        selection.anchorNode_ = container;
        selection.anchorOffset_ = offset ? offsetInContainer + 1 :
                                           offsetInContainer;
      }
      if (selection.focusNode === node && selection.focusOffset == offset) {
        selection.focusNode_ = container;
        selection.focusOffset_ = offset ? offsetInContainer + 1 :
                                          offsetInContainer;
      }
    }

    if (selection.isEmpty)
      return;

    // Split text boundary point
    splitIfNeeded(selection.anchorNode, selection.anchorOffset);
    splitIfNeeded(selection.focusNode, selection.focusOffset);

    // Convert text node + offset to container node + offset.
    useContainerIfNeeded(selection.anchorNode, selection.anchorOffset);
    useContainerIfNeeded(selection.focusNode, selection.focusOffset);

    selection.nodes_ = editing.nodes.computeSelectedRange(selection);
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
    normalizeSelection(this);
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
