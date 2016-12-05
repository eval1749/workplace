// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

//////////////////////////////////////////////////////////////////////
//
// Editor
//

/**
 * @constructor
 * @final
 * @param {!Document} document
 */
function Editor(document) {}

/** @type {!Document} */
Editor.prototype.document;

/**
 * @this {!Editor}
 * @param {!ReadOnlySelection} selection
 */
Editor.prototype.setDomSelection = function(selection) {};
