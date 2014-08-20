// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

editing.define('SelectionTracker', (function() {
  /** @enum {string} */
  var StartOrEnd = {
    END: 'END',
    START: 'START'
  };

  /** @enum {string} */
  var TrackingType = {
    // <b>foo|</b> node is "foo".
    AFTER_NODE: 'AFTER',
    // <b>foo</b>| node is "b"
    AFTER_ALL_CHILDREN: 'AFTER_ALL_CHILDREN',
    // <b>|foo</b> node is "b"
    BEFORE_ALL_CHILDREN: 'BEFORE_ALL_CHILDREN',
    // |<b>foo</b> node is "b"
    NODE: 'NODE'
  };

  /**
   * @constructor
   * @final
   * @param {!EditingNode} node
   * @param {number} offset
   */
  function NodeAndOffset(node, offset) {
    this.node = node;
    this.offset = offset;
    Object.seal(this);
  }

  Object.defineProperties(NodeAndOffset.prototype, {
    node: {writable: true},
    offset: {writable: true}
  });

  /**
   * @constructor
   * @final
   * @param {!EditingNode} node
   * @param {number} offset
   * @param {!StartOrEnd} startOrEnd
   */
  function TrackablePosition(node, offset, startOrEnd) {
    console.assert(editing.nodes.isElement(node), 'node=' + node);
    if (!node.hasChildNodes()) {
      this.type_ = TrackingType.BEFORE_ALL_CHILDREN;
      this.node_ = node;
    } else if (editing.nodes.maxOffset(node) == node) {
      this.type_ = TrackingType.AFTER_ALL_CHILDREN;
      this.node_ = node.lastChild;
    } else if (offset && startOrEnd == StartOrEnd.END) {
      this.type_ = TrackingType.AFTER_NODE;
      this.node_ = node.childNodes[offset - 1];
    } else {
      this.type_ = TrackingType.NODE;
      this.node_ = node.childNodes[offset];
    }
    Object.seal(this);
  }

  /**
   * @this {!TrackablePosition}
   * @return {!NodeAndOffset}
   */
  function convertToNodeAndOffset() {
    var node = this.node_;
    switch (this.type_) {
      case TrackingType.AFTER_NODE:
        return new NodeAndOffset(node.parentNode, node.nodeIndex + 1);
      case TrackingType.AFTER_ALL_CHILDREN:
        return new NodeAndOffset(node.parentNode, editing.nodes.maxOffset(node));
      case TrackingType.BEFORE_ALL_CHILDREN:
        return new NodeAndOffset(node, 0);
      case TrackingType.NODE:
        return new NodeAndOffset(node.parentNode, node.nodeIndex);
      default:
        throw new Error('Bad TrackablePosition.type ' + this.type_);
    }
  }

  function willRemoveNodeTrackablePosition(node, startOrEnd) {
    if (this.node_ !== node)
      return;
    switch (this.type_) {
      case TrackingType.AFTER_NODE:
        this.node_ = editing.nodes.previousNode(this.node_);
        break;
      case TrackingType.AFTER_ALL_CHILDREN:
        this.type_ = TrackingType.NODE;
        this.node_ = editing.nodes.nextNodeSkippingChildren(this.node_);
        break;
      case TrackingType.BEFORE_ALL_CHILDREN:
        this.type_ = TrackingType.AFTER_NODE;
        this.node_ = editing.nodes.previousNode(this.node_);
        break;
      case TrackingType.NODE:
        this.type_ = TrackingType.AFTER_NODE;
        this.node_ = editing.nodes.previousNode(this.node_);
        break;
      default:
        throw new Error('Bad TrackablePosition.type ' + this.type_);
    }
  }

  Object.defineProperties(TrackablePosition.prototype, {
    convertToNodeAndOffset: {value: convertToNodeAndOffset},
    node_: {writable: true},
    type_: {writable: true},
    willRemoveNode: {value: willRemoveNodeTrackablePosition}
  });

  /**
   * @constructor
   * @final
   * @param {!EditingContext} context
   */
  function SelectionTracker(context) {
    this.context_ = context;
    var selection = context.selection;
    this.start_ = new TrackablePosition(selection.startContainer,
                                        selection.startOffset,
                                        StartOrEnd.START);
    this.end_ = new TrackablePosition(selection.endContainer,
                                      selection.endOffset,
                                      StartOrEnd.END);
    Object.seal(this);
  }

  /**
   * @this {!SelectionTracker}
   */
  function setEndingSelection() {
    var anchorNodeAndOffset;
    var focusNodeAndOffset;
    var selection = this.context_.selection;
    if (selection.direction == editing.SelectionDirection.ANCHOR_IS_START) {
      anchorNodeAndOffset = this.start_.convertToNodeAndOffset();
      focusNodeAndOffset = this.end_.convertToNodeAndOffset();
    } else {
      anchorNodeAndOffset = this.start_.convertToNodeAndOffset();
      focusNodeAndOffset = this.end_.convertToNodeAndOffset();
    }
    this.context_.setEndingSelection(new editing.ReadOnlySelection(
        anchorNodeAndOffset.node, anchorNodeAndOffset.offset,
        focusNodeAndOffset.node, focusNodeAndOffset.offset,
        selection.direction));
  }

  /**
   * @this {!SelectionTracker}
   * @param {!EditingNode} node
   */
  function willRemoveNode(node) {
    this.start_.willRemoveNode(node, StartOrEnd.START);
    this.end_.willRemoveNode(node, StartOrEnd.END);
  }

  Object.defineProperties(SelectionTracker.prototype, {
    constructor: {value: SelectionTracker},
    context_: {writable: true},
    end_:{writable: true},
    setEndingSelection: {value: setEndingSelection},
    start_: {writable: true},
    willRemoveNode: {value: willRemoveNode}
  });

  return SelectionTracker;
})());
