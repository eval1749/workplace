// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

//////////////////////////////////////////////////////////////////////
//
// ReadOnlySelection
//

/**
 * @constructor
 * @final
 * @param {!Node} anchorNode
 * @param {number} anchorOffset
 * @param {!Node} focusNode
 * @param {number} focusOffset
 * @param {!SelectionDirection} direction
 */
function ReadOnlySelection(anchorNode, anchorOffset, focusNode, focusOffset,
                           direction) {}

/** @type {?Node} */
ReadOnlySelection.prototype.anchorNode;

/** @type {number} */
ReadOnlySelection.prototype.anchorOffset;

/** @type {!SelectionDirection} */
ReadOnlySelection.prototype.direction;

/** @type {?Node} */
ReadOnlySelection.prototype.endContainer;

/** @type {number} */
ReadOnlySelection.prototype.endOffset;

/** @type {?Node} */
ReadOnlySelection.prototype.focusNode;

/** @type {number} */
ReadOnlySelection.prototype.focusOffset;

/** @type {boolean} */
ReadOnlySelection.prototype.isCaret;

/** @type {boolean} */
ReadOnlySelection.prototype.isEmpty;

/** @type {boolean} */
ReadOnlySelection.prototype.isRange;

/** @type {?Node} */
ReadOnlySelection.prototype.startContainer;

/** @type {number} */
ReadOnlySelection.prototype.startOffset;

