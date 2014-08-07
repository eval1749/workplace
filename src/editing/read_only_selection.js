// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';


editing.define('SelectionDirection', {
  ANCHOR_IS_START: 'ANCHOR_IS_START',
  FOCUS_IS_START: 'FOCUS_IS_START'
});

editing.define('ReadOnlySelection', (function() {
  /**
   * @param {!editing.EditingNode} anchorNode
   * @param {number} anchorOffset
   * @param {!editing.EditingNode} focusNode
   * @param {number} focusOffset
   * @param {editing.SelectionDirection} direction
   */
  function ReadOnlySelection(anchorNode, anchorOffset, focusNode, focusOffset,
                             direction) {
    this.anchorNode_ = anchorNode;
    this.anchorOffset_ = anchorOffset;
    this.direction_ = direction;
    this.focusNode_ = focusNode;
    this.focusOffset_ = focusOffset;
  }

  /**
   * @param {!Selection} selection
   * @return {!ReadOnlySelection}
   */
  ReadOnlySelection.createFromDom = function(domSeleciton) {
    function direction() {
      if (!domSeleciton.rangeCount)
        return editing.SelectionDirection.ANCHOR_IS_START;
      var range = domSeleciton.getRangeAt(0);
      if (range.startContainer === domSeleciton.anchorNode &&
          range.startOffset == domSeleciton.anchorOffset) {
        return editing.SelectionDirection.ANCHOR_IS_START;
      }
      return editing.SelectionDirection.FOCUS_IS_START;
    }
    return new ReadOnlySelection(
        domSeleciton.anchorNode, domSeleciton.anchorOffset,
        domSeleciton.focusNode, domSeleciton.focusOffset,
        direction());
  }

  Object.defineProperties(ReadOnlySelection.prototype, {
    anchorNode: {get: function () { return this.anchorNode_; }},
    anchorNode_: {writable: true},
    anchorOffset: {get: function () { return this.anchorOffset_; }},
    anchorOffset_: {writable: true},
    direction: {get: function() { return this.direction_; }},
    direction_: {writable: true},
    focusNode: {get: function () { return this.focusNode_; }},
    focusNode_: {writable: true},
    focusOffset: {get: function () { return this.focusOffset_; }},
    focusOffset_: {writable: true},
  });
  return ReadOnlySelection;
})());
