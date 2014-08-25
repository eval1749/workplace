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
   * @constructor
   * @final
   * @param {!Node} anchorNode
   * @param {number} anchorOffset
   * @param {!Node} focusNode
   * @param {number} focusOffset
   * @param {SelectionDirection} direction
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

  /** @type {?Node} */
  ReadOnlySelection.prototype.anchorNode;

  /** @type {number} */
  ReadOnlySelection.prototype.anchorOffset;

  /** @type {?Node} */
  ReadOnlySelection.prototype.focusNode;

  /** @type {number} */
  ReadOnlySelection.prototype.focusOffset;

  /** @type {boolean} */
  ReadOnlySelection.prototype.isCaret;

  /** @type {boolean} */
  ReadOnlySelection.prototype.isEmpty;

  /**
   * @this {!ReadOnlySelection}
   * @return {?Node}
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
    if (this.isEmpty)
      return false;
    return this.anchorNode_ === this.focusNode_ &&
           this.anchorOffset_ == this.focusOffset_;
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
    return !this.isEmpty && !this.isCaret;
  }

  /**
   * @this {!ReadOnlySelection}
   * @return {?Node}
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
    startContainer: {get: startContainer},
    startOffset: {get: startOffset},
  });
  return ReadOnlySelection;
})());
