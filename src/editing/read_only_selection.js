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
   * @param {!Node} anchorNode
   * @param {number} anchorOffset
   * @param {!Node} focusNode
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
    Object.seal(this);
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

  /**
   * @this {!ReadOnlySelection}
   * @return {!Node}
   */
  function endContainer() {
    console.assert(this.anchorNode_);
    return this.direction_ == editing.SelectionDirection.FOCUS_IS_START ?
        this.anchorNode_ : this.focusNode_;
  }

  /**
   * @this {!ReadOnlySelection}
   * @return {number}
   */
  function endOffset() {
    console.assert(this.anchorNode_);
    return this.direction_ == editing.SelectionDirection.FOCUS_IS_START ?
        this.anchorOffset_ : this.focusOffset_;
  }

  /**
   * @this {!ReadOnlySelection}
   * @return {boolean}
   */
  function isCaret() {
    return !this.isEmpty && !this.isRange;
  }

  /**
   * @this {!ReadOnlySelection}
   * @return {boolean}
   */
  function isEmpty() {
    return !this.anchorNode_;
  }

  /**
   * @this {!ReadOnlySelection}
   * @return {boolean}
   */
  function isRange() {
    if (!this.isEmpty)
      return false;
    return this.anchorNode_ !== this.focusNode_ ||
           this.anchorOffset_ != this.focusOffset_;
  }

  /**
   * @this {!ReadOnlySelection}
   * @param {!Selection} domSelection
   */
  function setDomSelection(domSelection) {
    domSelection.collapse(this.anchorNode, this.anchorOffset);
    domSelection.extend(this.focusNode, this.focusOffset);
  }

  /**
   * @this {!ReadOnlySelection}
   * @return {!Node}
   */
  function startContainer() {
    console.assert(this.anchorNode_);
    return this.direction_ == editing.SelectionDirection.ANCHOR_IS_START ?
        this.anchorNode_ : this.focusNode_;
  }

  /**
   * @this {!ReadOnlySelection}
   * @return {number}
   */
  function startOffset() {
    console.assert(this.anchorNode_);
    return this.direction_ == editing.SelectionDirection.ANCHOR_IS_START ?
        this.anchorOffset_ : this.focusOffset_;
  }

  Object.defineProperties(ReadOnlySelection.prototype, {
    anchorNode: {get: function () { return this.anchorNode_; }},
    anchorNode_: {writable: true},
    anchorOffset: {get: function () { return this.anchorOffset_; }},
    anchorOffset_: {writable: true},
    direction: {get: function() { return this.direction_; }},
    direction_: {writable: true},
    endContainer: {get: endContainer},
    endOffset: {get: endOffset},
    focusNode: {get: function () { return this.focusNode_; }},
    focusNode_: {writable: true},
    focusOffset: {get: function () { return this.focusOffset_; }},
    focusOffset_: {writable: true},
    isCaret: {get: isCaret},
    isEmpty: {get: isEmpty},
    isRange: {get: isRange},
    setDomSelection: {value: setDomSelection},
    startContainer: {get: startContainer},
    startOffset: {get: startOffset},
  });
  return ReadOnlySelection;
})());
