// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

editing.define('Editor', (function() {
  /**
   * @constructor
   * @param {!Document} document
   */
  function Editor(document) {
    this.context_ = null;
    this.document_ = document;
    Object.seal(this);
  }

  /**
   * @this {!Editor}
   * @param {?Object} domSelection Once |Selection| keeps passed node and
   *    offset, we don't need to use |selection| parameter.
   * @return {!EditingContext}
   */
  function newContext(domSelection) {
    console.assert(!arguments.length || this.document === domSelection.document);
    return new editing.EditingContext(this, domSelection);
  }

  Object.defineProperties(Editor.prototype, {
    document: {get: function() { return this.document_; }},
    document_: {writable: true},
    newContext: {value: newContext},
  });
  return Editor;
})());
