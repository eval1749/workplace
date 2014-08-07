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

  function visit(selection, node) {
    var child = node.firstChild;
    if (child) {
      while (child){
        var nextSibling = child.nextSibling;
        visit(selection, child);
        if (selection.anchorNode && selection.focusNode)
          return;
        child = nextSibling;
      }
      return;
    }

    if (node.nodeType != Node.TEXT_NODE)
      return;

    var sampleText = node.nodeValue;
    var text = sampleText.replace('^', '').replace('|', '');

    var anchorOffset = sampleText.replace('|', '').indexOf('^');
    var focusOffset = sampleText.replace('^', '').indexOf('|');

    if (anchorOffset < 0 && focusOffset < 0)
      return;

    if (text.length) {
      if (anchorOffset >= 0) {
        selection.anchorNode_ = node;
        selection.anchorOffset_ = anchorOffset;
      }
      if (focusOffset >= 0) {
        selection.focusNode_ = node;
        selection.focusOffset_ = focusOffset;
      }
      node.nodeValue = text;
    } else {
      if (anchorOffset >= 0) {
        selection.anchorNode_ = node.parentNode;
        selection.anchorOffset_ = indexOfNode(node);
      }

      if (focusOffset >= 0) {
        selection.focusNode_ = node.parentNode;
        selection.focusOffset_ = indexOfNode(node);
      }
      node.parentNode.removeChild(node);
    }
    if (selection.focusNode && !selection.anchorNode) {
      selection.anchorIsStart_ = false;
      selection.anchorNode_ = selection.focusNode;
      selection.anchorOffset_ = selection.focusOffset;
    }
  }

  /**
   * @constructor
   * @param {!Document} document
   * @param {string} htmlText
   */
  function TestingSelection(document, htmlText) {
    this.document_ = document;
    this.range_ = this.document_.createRange();
    this.root_ = this.document_.body;
    this.root_.innerHTML = htmlText;
    this.anchorIsStart_ = true;

    if (htmlText.indexOf('^') != htmlText.lastIndexOf('^'))
      throw new Error('More than one focus marker in "' + htmlText + '"');

    if (htmlText.indexOf('|') != htmlText.lastIndexOf('|'))
      throw new Error('More than one focus marker in "' + htmlText + '"');

    visit(this, this.root_);

    if (!this.anchorNode_)
      return;

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
