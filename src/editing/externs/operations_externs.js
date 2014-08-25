// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @constructor
 * @param {string} operationName
 */
function Operation(operationName) {}

/** @type {!function()} */
Operation.prototype.execute = function() {};

/** @type {string} */
Operation.prototype.operationName;

/** @type {!function()} */
Operation.prototype.redo = function() {};

/** @type {!function()} */
Operation.prototype.undo= function() {};

/**
 * @constructor
 * @extends {Operation}
 * @final
 * @param {!Node} parentNode
 * @param {!Node} newChild
 */
function AppendChild(parentNode, newChild) {}

/**
 * @constructor
 * @extends {Operation}
 * @final
 * @param {!Node} parentNode
 * @param {!Node} newChild
 * @param {?Node} refChild
 */
function InsertBefore(parentNode, newChild, refChild) {}

/**
 * @constructor
 * @extends {Operation}
 * @final
 * @param {!Element} element
 * @param {string} attrName
 */
function RemoveAttribute(element, attrName) {}

/**
 * @constructor
 * @extends {Operation}
 * @final
 * @param {!Element} element
 * @param {string} propertyName
 * @param {string} newValue
 */
function SetStyle(element, propertyName, newValue) {}
