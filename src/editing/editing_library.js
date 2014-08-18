// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

editing.define('library', (function() {
  /**
   * @param {!EditingNode} node
   * @return {boolean}
   */
  function isVisibleNode(node) {
    console.assert(node instanceof editing.EditingNode);
    if (isWhitespaceNode(node))
      return false;
    if (node.domNode.nodeType != Node.ELEMENT_NODE)
      return isVisibleNode(node.parentNode);
    var style = window.getComputedStyle(node.domNode);
    if (style)
      return style.display != 'none';
    if (!node.parentNode)
      return node.nodeType == Node.TEXT_NODE;
    return isVisibleNode(node.parentNode);
  }

  /**
   * @param {!EditingNode} node
   * @return {boolean}
   */
  function isWhitespaceNode(node) {
    console.assert(node instanceof editing.EditingNode);
    if (!node.isText)
      return false;
    var text = node.nodeValue.replace(/[ \t\r\n]/g, '');
    return text == '';
  }

  function lastWithIn(current) {
    var descendant = current.lastChild;
    for (var child = descendant; child; child = child.lastChild) {
      descendant = child;
    }
    return descendant;
  }

  // nextNode(<a><b>foo|</b><a>bar) = bar
  function nextNode(current) {
    if (current.firstChild)
      return current.firstChild;
    if (current.nextSibling)
      return current.nextSibling;
    return nextAncestorOrSibling(current);
  }

  function nextAncestorOrSibling(current) {
    console.assert(!current.nextSibling);
    for (var parent = current.parentNode; parent; parent = parent.parentNode) {
      if (parent.nextSibling)
        return parent.nextSibling;
    }
    return null;
  }

  function nextNodeSkippingChildren(current) {
    if (current.nextSibling)
      return current.nextSibling;
    return nextAncestorOrSibling(current);
  }

  return Object.defineProperties({}, {
    isVisibleNode: {value: isVisibleNode},
    isWhitespaceNode: {value: isWhitespaceNode},
    lastWithIn: {value: lastWithIn},
    nextNode: {value: nextNode},
    nextNodeSkippingChildren: {value: nextNodeSkippingChildren},
  });
})());
