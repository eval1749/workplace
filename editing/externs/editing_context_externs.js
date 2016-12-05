// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @constructor
 * @final
 * @param {!Editor} editor
 * @param {string} name A name for this context for error message.
 * @param {!ReadOnlySelection} selection
 */
function EditingContext(editor, name, selection) {}

/** @type {!Document} */
EditingContext.prototype.document;

/**
 * @this {!EditingContext}
 * @param {!Node} parentNode
 * @param {!Node} newChild
 */
EditingContext.prototype.appendChild = function(parentNode, newChild) {};

/** @type {!ReadOnlySelection} */
EditingContext.prototype.endingSelection;

/**
 * @this {!EditingContext}
 * @param {!Node} node
 * @return {boolean}
 */
EditingContext.prototype.inDocument = function(node) {};

/**
 * @this {!EditingContext}
 * @param {!Node} parentNode
 * @param {!Node} newChild
 * @param {?Node} refChild
 */
EditingContext.prototype.insertAfter = function(
    parentNode, newChild, refChild) {};

/**
 * @this {!EditingContext}
 * @param {!Node} parentNode
 * @param {!Node} newChild
 * @param {?Node} refChild
 */
EditingContext.prototype.insertBefore = function(
    parentNode, newChild, refChild) {};


/** @type {!Array.<!Operation>} */
EditingContext.prototype.operations;

/**
 * @this {!EditingContext}
 * @param {!Node} parentNode
 * @param {!Node} oldChild
 */
EditingContext.prototype.removeChild = function(parentNode, oldChild) {};

/**
 * @this {!EditingContext}
 * @param {!Node} parentNode
 * @param {!Node} newChild
 * @param {!Node} oldChild
 */
EditingContext.prototype.replaceChild = function(
    parentNode, newChild, oldChild) {};

/**
 * @this {!EditingContext}
 * @param {!ReadOnlySelection} selection
 */
EditingContext.prototype.setEndingSelection = function(selection) {};

/**
 * @this {!EditingContext}
 * @param {!Node} parent
 * @param {!Node} child
 * @return {!Node}
 */
EditingContext.prototype.splitNode = function(parent, child) {};

/**
 * @this {!EditingContext}
 * @param {!Text} node
 * @param {number} offset
 * @return {!Text}
 */
EditingContext.prototype.splitText = function(node, offset) {};

/**
  * @this {!EditingContext}
  * @param {!Node} refNode
  * @return {!Node}
 */
EditingContext.prototype.splitTree = function(treeNode, refNode) {};

/** @type {!ReadOnlySelection} */
EditingContext.prototype.startingSelection;
