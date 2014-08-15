// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

editing.define('library', (function() {
  /**
   * @param {!EditingNode} node
   * @return {boolean}
   */
  function isWhitespaceNode(node) {
    if (!node.isText)
      return false;
    var text = node.nodeValue.replace(/[ \t\r\n]/g, '');
    return text == '';
  }

  return Object.defineProperties({}, {
    isWhitespaceNode: {value: isWhitespaceNode}
  });
})());
