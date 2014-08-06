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
