// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

editing.define('nodes', (function() {
  /* @const */ var INTERACTIVE = editing.CONTENT_CATEGORY.INTERACTIVE;
  /* @const */ var PHRASING = editing.CONTENT_CATEGORY.PHRASING;

  // NextNodes iterator
  function NextNodes(startNode) {
    this.currentNode_ = startNode;
    Object.seal(this);
  }

  Object.defineProperty(NextNodes.prototype, 'next', {
    value: function() {
      var resultNode = this.currentNode_;
      if (!resultNode)
        return {done: true};
      this.currentNode_ = nextNode(this.currentNode_);
      return {done: false, value: resultNode};
    }
  });

  /**
   * @param {!Node} node1
   * @param {!Node} node2
   * @return {?Node}
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
   * @param {!editing.ReadONlySelection} selection
   * @return {!Array.<!Node>}
   *
   * Note: When selection range has no node, e.g. <p><a>foo^</a>|</p>; enclosing
   * end tag, return value is empty array.
   */
  function computeSelectedRange(selection) {
    if (selection.isEmpty)
      return [];

    var startNode = selection.startContainer.childNodes[selection.startOffset];
    if (!startNode)
      startNode = nextNode(selection.startContainer.lastChild);
    var endContainer = selection.endContainer;
    var endNode = endContainer.childNodes[selection.endOffset];
    if (!endNode)
      endNode = nextNodeSkippingChildren(endContainer.lastChild);

    // Both, |startNode| and |endNode| are nullable, e.g. <a><b>abcd|</b></a>
    if (!startNode)
      return [];

    var nodes = [];
    var iterator = nextNodes(startNode);
    var current;
    while (!(current = iterator.next()).done) {
      if (current.value === endNode)
        break;
      if (current.value == endContainer && !selection.endOffset)
        break;
      nodes.push(current.value);
    }
    return nodes;
  }

  /**
   * @param {!Element} element
   * @return {boolean}
   */
  function isContentEditable(element) {
    for (var runner = element; runner && editing.nodes.isElement(runner);
         runner = runner.parentNode) {
      var contentEditable = runner.getAttribute('contenteditable');
      if (typeof(contentEditable) == 'string')
        return contentEditable.toLowerCase() != 'false';
      if (editing.isContentEditable(runner))
        return true;
    }
    return false;
  }

  /**
   * @param {!Node} node
   * @param {!Node} other
   * Returns true if |other| is an ancestor of |node|, otherwise false.
   */
  function isDescendantOf(node, other) {
    for (var runner = node.parentNode; runner; runner = runner.parentNode) {
      if (runner == other)
        return true;
    }
    return false;
  }

  /**
   * @param {!Node} node
   * @return {boolean}
   */
  function isEditable(node) {
    var container = node.parentNode;
    if (!container)
      return false;
    return editing.nodes.isContentEditable(container);
  }

  /**
   * @param {!Node} node
   * @return {boolean}
   */
  function isElement(node) {
    return node.nodeType == Node.ELEMENT_NODE;
  }

  /**
   * @param {!Node} node
   * @return {boolean}
   */
  function isInteractive(node) {
    var model = editing.contentModel[node.nodeName];
    return model !== undefined && Boolean(model.categories[INTERACTIVE]);
  }

  /**
   * @param {!Node} node
   * @return {boolean}
   */
  function isPhrasing(node) {
    if (!editing.nodes.isElement(node))
      return true;
    var model = editing.contentModel[node.nodeName];
    return model !== undefined && Boolean(model.categories[PHRASING]);
  }

  /**
   * @param {!Node} node
   * @return {boolean}
   */
  function isText(node) {
    return node.nodeType == Node.TEXT_NODE;
  }

  /**
   * @param {!Node} node
   * @return {boolean}
   */
  function isVisibleNode(node) {
    if (isWhitespaceNode(node))
      return false;
    if (node.nodeType != Node.ELEMENT_NODE)
      return isVisibleNode(node.parentNode);
    var style = window.getComputedStyle(node);
    if (style)
      return style.display != 'none';
    if (!node.parentNode)
      return node.nodeType == Node.TEXT_NODE;
    return isVisibleNode(node.parentNode);
  }

  /**
   * @param {!Node} node
   * @return {boolean}
   */
  function isWhitespaceNode(node) {
    if (!editing.nodes.isText(node))
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

  /**
   * @param {!Node} node
   * @return {number}
   */
  function maxOffset(node) {
    return editing.nodes.isText(node) ? node.nodeValue.length :
                                        node.childNodes.length;
  }

  // nextNode(<a><b>foo|</b><a>bar) = bar
  function nextNode(current) {
    if (current.firstChild)
      return current.firstChild;
    if (current.nextSibling)
      return current.nextSibling;
    return nextAncestorOrSibling(current);
  }

  /**
   * @param {!Node} node
   * @return {!NextNodes}
   */
  function nextNodes(node) {
    return new NextNodes(node);
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

  /**
   * @param {!Node} node
   * @return {number}
   */
  function nodeIndex(node) {
    var index = 0;
    var parentNode = node.parentNode;
    for (var child = parentNode.firstChild; child; child = child.nextSibling) {
      if (child === node)
        return index;
      ++index;
    }
    throw new Error('NOTREACEHD');
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
    computeSelectedRange: {value: computeSelectedRange},
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
    maxOffset: {value: maxOffset},
    nextNode: {value: nextNode},
    nextNodes: {value: nextNodes},
    nextAncestorOrSibling: {value: nextAncestorOrSibling},
    nextNodeSkippingChildren: {value: nextNodeSkippingChildren},
    nodeIndex: {value: nodeIndex},
    previousNode: {value: previousNode},
    previousNodeSkippingChildren: {value: previousNodeSkippingChildren},
  });
})());
