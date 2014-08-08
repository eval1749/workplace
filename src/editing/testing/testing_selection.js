// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

testing.define('TestingSelection', (function() {
  function indexOfNode(node) {
    var parentNode = node.parentNode;
    var index = 0;
    for (var child = parentNode.firstChild; child;
         child = child.nextSibling) {
      if (child === node)
        return index;
      ++index;
    }
    NOTREACHED();
  }

  // If boundary point is between text nodes, we merge them.
  function fixupAnchorAndFocus(selection, containerNode, offsetInContainer) {
    function updateAnchorIfNeeded(newNode, newOffset) {
      if (selection.anchorNode_ !== node)
        return;
      if (selection.anchorOfset_ != offsetInContainer)
        return;
      selection.anchorNode_ = node;
      selection.anchorOfset_ = offsetInContainer;
    }

    function updateFocusIfNeeded(newNode, newOffset) {
      if (selection.focusNode_ !== node)
        return;
      if (selection.focusOfset_ != offsetInContainer)
        return;
      selection.focusNode_ = node;
      selection.focusOfset_ = offsetInContainer;
    }

    var node = containerNode.childNodes[offsetInContainer];
    if (!node) {
      // Boundary point is end of node.
      return;
    }
    if (node.nodeType != Node.TEXT_NODE)
      return;
    var previousSibling = node.previousSibling;
    if (!previousSibling || previousSibling.nodeType != Node.TEXT_NODE)
      return;
    var beforeText = previousSibling.textContent;
    node.textContent = beforeText + node.textContent;
    node.parentNode.removeChild(previousSibling);
    updateAnchorIfNeeded(node, beforeText.length);
    updateFocusIfNeeded(node, beforeText.length);
  }

  function parseAnchorAndFocus(selection, node) {
    var child = node.firstChild;
    if (child) {
      while (child){
        var nextSibling = child.nextSibling;
        parseAnchorAndFocus(selection, child);
        child = nextSibling;
      }
      return;
    }

    if (node.nodeType != Node.COMMENT_NODE)
      return;

    var marker = node.nodeValue;
    if (marker != '|' && marker != '^')
      return;

    // Remove marker node
    var nextSibling = node.nextSibling;
    var previousSibling = node.previousSibling;
    var offsetInContainer = indexOfNode(node);
    var containerNode = node.parentNode;
    containerNode.removeChild(node);

    if (previousSibling && previousSibling.nodeType == Node.TEXT_NODE) {
      containerNode = previousSibling;
      offsetInContainer = previousSibling.nodeValue.length;
    }

    if (nextSibling && nextSibling.nodeType == Node.TEXT_NODE) {
      containerNode = nextSibling;
      offsetInContainer = 0;
    }

    if (marker == '^') {
      selection.anchorNode_ = containerNode;
      selection.anchorOffset_ = offsetInContainer;
    } else {
      selection.focusNode_ = containerNode;
      selection.focusOffset_ = offsetInContainer;
    }

    if (!selection.anchorNode_ && selection.focusNode_) {
      selection.anchorIsStart_ = false;
      selection.anchorNode_ = selection.focusNode_;
      selection.anchorOffset_ = selection.focusOffset_;
    }
  }

  /**
   * @constructor
   * @param {!Document} document
   * @param {string} htmlText
   */
  function TestingSelection(document, htmlSource) {
    if (htmlSource.indexOf('^') != htmlSource.lastIndexOf('^'))
      throw new Error('More than one focus marker in "' + htmlSource + '"');

    if (htmlSource.indexOf('|') != htmlSource.lastIndexOf('|'))
      throw new Error('More than one focus marker in "' + htmlSource + '"');

    var htmlText = htmlSource.replace('|', '<!--|-->').replace('^', '<!--^-->');
    this.document_ = document;
    this.range_ = this.document_.createRange();
    this.root_ = this.document_.body;
    this.root_.innerHTML = htmlText;
    this.anchorIsStart_ = true;
    parseAnchorAndFocus(this, this.root_);
    fixupAnchorAndFocus(this, this.anchorNode_, this.anchorOffset_);
    fixupAnchorAndFocus(this, this.focusNode_, this.focusOffset_);

    if (!this.focusNode_)
      return;
    console.assert(this.anchorNode_,
                  'AnchorNode should no be null for', htmlSource);
    if (this.anchorIsStart_) {
      this.range_.setStart(this.anchorNode_, this.anchorOffset_);
      this.range_.setEnd(this.focusNode_, this.focusOffset_);
    } else {
      this.range_.setStart(this.focusNode_, this.focusOffset_);
      this.range_.setEnd(this.anchorNode_, this.anchorOffset_);
    }
  }

  /**
   * @this {!TestingSelection}
   * @return {boolean}
   */
  function collapsed() {
    return this.anchorNode_ && this.anchorNode_ === this.focusNode_ &&
           this.anchorOffset_ === this.focusOffset_;
  }

  Object.defineProperties(TestingSelection.prototype, {
    anchorNode: {get: function() { return this.anchorNode_; }},
    anchorNode_: {writable: true},
    anchorOffset: {get: function() { return this.anchorOffset_; }},
    anchorOffset_: {writable: true},
    collapsed: {value: collapsed},
    document: {get: function() { return this.document_; }},
    document_: {writable: true},
    focusNode: {get: function() { return this.focusNode_; }},
    focusNode_: {writable: true},
    focusOffset: {get: function() { return this.focusOffset_; }},
    focusOffset_: {writable: true},
    getRangeAt: {value: function() { return this.range_; }},
    range_: {writable: true},
    rangeCount: {get: function() { return this.anchorNode ? 1 : 0}},
    rootForTesting: {get: function() { return this.root_; }},
    root_: {writable: true},
    anchorIsStart_: {writable: true},
  });
  return TestingSelection;
})());
