// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

var editing = {}

Object.defineProperty(editing, 'define', {
  value:
  /**
   * @param {string} name
   * @param {*} value
   */
  function(name, value) {
    Object.defineProperty(editing, name, {value: value});
  }
});

// TODO(yosin) We should move |Math.sign| Polyfill to different place.
if (!Math.sign) {
  Math.sign = function(x) {
    if (isNaN(x))
      return NaN;
    if (x === 0)
      return x;
    return x > 0 ? 1 : -1;
  }
}

// TODO(yosin) Once, Node.isContentEditable works for nodes without render
// object, we dont' need to have |isContentEditablePollyfill|.
// http://crbug.com/313082
editing.define('isContentEditable', function(domNode) {
  if (window.document === domNode.ownerDocument &&
      domNode.style.display != 'none') {
    return domNode.isContentEditable;
  }
  if (domNode.isContentEditable)
    return true;
  if (domNode.nodeType != Node.ELEMENT_NODE)
    return false;
  var contentEditable = domNode.getAttribute('contenteditable');
  if (typeof(contentEditable) != 'string')
    return false;
  return contentEditable.toLowerCase() != 'false';
});
