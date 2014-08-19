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
  }

  /**
   * @constructor
   * @final
   * @param {!EditingNode} node
   * @param {number} offset
   * @param {!StartOrEnd} startOrEnd
   */
  function TrackablePosition(node, offset, startOrEnd) {
    console.assert(node.isElement, 'node=' + node);
    if (!node.hasChildNodes()) {
      this.type_ = TrackingType.BEFORE_ALL_CHILDREN;
      this.node_ = node;
    } else if (node.maxOffset == node) {
      this.type_ = TrackingType.AFTER_ALL_CHILDREN;
      this.node_ = node.lastChild;
    } else if (offset && startOrEnd == StartOrEnd.END) {
      this.type_ = TrackingType.AFTER_NODE;
      this.node_ = node.childNodes[offset - 1];
    } else {
      this.type_ = TrackingType.NODE;
      this.node_ = node.childNodes[offset];
    }
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
        break;
      case TrackingType.AFTER_ALL_CHILDREN:
        return new NodeAndOffset(node.parentNode, node.maxOffset);
      case TrackingType.BEFORE_ALL_CHILDREN:
        return new NodeAndOffset(node, 0);
      case TrackingType.NODE:
        return new NodeAndOffset(node.parentNode, node.nodeIndex);
      default:
        throw new Error('Bad TrackablePosition.type ' + this.type_);
    }
  }

  Object.defineProperties(TrackablePosition.prototype, {
    convertToNodeAndOffset: {value: convertToNodeAndOffset},
    node_: {writable: true},
    type_: {writable: true}
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

  Object.defineProperties(SelectionTracker.prototype, {
    constructor: {value: SelectionTracker},
    context_: {writable: true},
    end_:{writable: true},
    setEndingSelection: {value: setEndingSelection},
    start_: {writable: true}
  });

  return SelectionTracker;
})());
