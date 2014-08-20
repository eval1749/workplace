// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

editing.define('nodes', (function() {
  /* @const */ var INTERACTIVE = editing.CONTENT_CATEGORY.INTERACTIVE;
  /* @const */ var PHRASING = editing.CONTENT_CATEGORY.PHRASING;

  /**
   * @param {!EditingNode} node1
   * @param {!EditingNode} node2
   * @return {?EditingNode}
   */
  function commonAncestor(node1, node2) {
    console.assert(node1.ownerDocument === node2.ownerDocument);
    if (node1 === node2)
      return node1;
    var depth1 = 0;
    for (var node = node1; node; node = node.parentNode) {
      if (node == node2)
        return node;
      ++depth1;
    }
    var depth2 = 0;
    for (var node = node2; node; node = node.parentNode) {
      if (node == node1)
        return node;
      ++depth2;
    }
    var runner1 = node1;
    var runner2 = node2;
    if (depth1 > depth2) {
      for (var depth  = depth1; depth > depth2; --depth) {
        runner1 = runner1.parentNode;
      }
    } else if (depth2 > depth1) {
      for (var depth  = depth2; depth > depth1; --depth) {
        runner2 = runner2.parentNode;
      }
    }
    while (runner1) {
      if (runner1 == runner2)
        return runner1;
       runner1 = runner1.parentNode;
       runner2 = runner2.parentNode;
    }
    console.assert(!runner2);
    return null;
  }

  /**
   * @param {!EditingNode} node
   * @return {boolean}
   */
  function inDocument(node) {
    // TODO(yosin) We should have real version of |inDocument|.
    for (var runner = node; runner; runner = runner.parentNode) {
      if (!runner.parentNode)
        return editing.nodes.isContentEditable(runner);
    }
    return false;
  }

  /**
   * @param {!EditingNode} node
   * @return {boolean}
   */
  function isContentEditable(node) {
    for (var runner = node; runner; runner = runner.parentNode) {
      var contentEditable = runner.getAttribute('contenteditable');
      if (typeof(contentEditable) == 'string')
        return contentEditable.toLowerCase() != 'false';
      if (editing.isContentEditable(runner.domNode_))
        return true;
    }
    return false;
  }

  /**
   * @param {!EditingNode} node
   * @param {!EditingNode} other
   * Returns true if |other| is an ancestor of |node|, otherwise false.
   */
  function isDescendantOf(node, other) {
    console.assert(node instanceof editing.EditingNode);
    console.assert(other instanceof editing.EditingNode);
    for (var runner = node.parentNode; runner; runner = runner.parentNode) {
      if (runner == other)
        return true;
    }
    return false;
  }

  /**
   * @param {!EditingNode} node
   * @return {boolean}
   */
  function isEditable(node) {
    console.assert(node instanceof editing.EditingNode);
    var container = node.parentNode;
    if (!container)
      return false;
    return editing.nodes.isContentEditable(container);
  }

  /**
   * @param {!EditingNode} node
   * @return {boolean}
   */
  function isElement(node) {
    return node.nodeType == Node.ELEMENT_NODE;
  }

  /**
   * @param {!EditingNode} node
   * @return {boolean}
   */
  function isInteractive(node) {
    var model = editing.contentModel[node.domNode_.nodeName];
    return model !== undefined && Boolean(model.categories[INTERACTIVE]);
  }

  /**
   * @param {!EditingNode} node
   * @return {boolean}
   */
  function isPhrasing(node) {
    if (!editing.nodes.isElement(node))
      return true;
    var model = editing.contentModel[node.domNode_.nodeName];
    return model !== undefined && Boolean(model.categories[PHRASING]);
  }

  /**
   * @param {!EditingNode} node
   * @return {boolean}
   */
  function isText(node) {
    return node.nodeType == Node.TEXT_NODE;
  }

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

  function previousNode(current) {
    var previous = current.previousSibling;
    if (!previous)
      return current.parentNode;
    var child;
    while (child = previous.lastChild) {
      previous = child;
    }
    return previous;
  }

  function previousNodeSkippingChildren(current) {
    if (current.previousSibling)
      return current.previousSibling;
    for (var parent = current.parentNode; parent; parent = parent.parentNode) {
      if (parent.previousSibling)
        return parent.previousSibling;
    }
    return null;
  }

  return Object.defineProperties({}, {
    commonAncestor: {value: commonAncestor},
    inDocument: {value: inDocument},
    isContentEditable: {value: isContentEditable},
    isDescendantOf: {value: isDescendantOf},
    isEditable: {value: isEditable},
    isElement: {value: isElement},
    isInteractive: {value: isInteractive},
    isPhrasing: {value: isPhrasing},
    isText: {value: isText},
    isVisibleNode: {value: isVisibleNode},
    isWhitespaceNode: {value: isWhitespaceNode},
    lastWithIn: {value: lastWithIn},
    nextNode: {value: nextNode},
    nextNodeSkippingChildren: {value: nextNodeSkippingChildren},
    previousNode: {value: previousNode},
    previousNodeSkippingChildren: {value: previousNodeSkippingChildren},
  });
})());