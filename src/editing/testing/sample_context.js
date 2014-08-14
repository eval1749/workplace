// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

testing.define('SampleContext', (function() {
  /**
   * @constructor
   * @param {string} htmlText
   */
  function SampleContext(htmlText) {
    var iframe = document.createElement('iframe');
    this.iframe_ = iframe;
    document.body.appendChild(iframe);
    this.document_ = iframe.contentDocument;
    // Note: Firefox requires focus to retrieve selection from IFRAME.
    iframe.focus();
    this.selection_ = iframe.contentWindow.getSelection();
    if (!this.selection_)
      throw new Error('Can not get selection from IFRAME');

    // TODO(yosin) We should factor out TestingSelection.
    var sample = new testing.TestingSelection(this.document_, htmlText);

    if (!sample.rangeCount) {
      this.startingSelection_ = new editing.ReadOnlySelection(null, 0, null, 0);
      return;
    }

    if (this.selection_.extend) {
      this.selection_.collapse(sample.anchorNode, sample.anchorOffset);
      this.selection_.extend(sample.focusNode, sample.focusOffset);
    } else {
      var range = document.createRange();
      range.setStart(sample.anchorNode, sample.anchorOffset);
      range.setEnd(sample.focusNode, sample.focusOffset);
      this.selection_.addRange(range);
    }

    // Since Blink normalize anchor and focus position, we use normalized
    // value rather than user specified value.
    this.startingSelection_ = editing.ReadOnlySelection.createFromDom(
        this.selection_);
  }

  
  /**
   * @this {!SampleContext}
   * @param {string} name
   * @param {boolean=} opt_userInterface
   * @param {string=} opt_value
   *
   * Emulation of |Document.execCommand|.
   */
  function execCommand(name, opt_userInterface, opt_value) {
    var result;
    try {
        result = this.document_.execCommand.apply(this.document_, arguments);
    } catch (exception) {
      result = exception;
    }
    if (this.selection_) {
      this.endingSelection_ = editing.ReadOnlySelection.createFromDom(
          this.selection_);
    }
    this.iframe_.parentNode.removeChild(this.iframe_);
    return result;
  }

  /**
   * @this {!SampleContext}
   * @return {string}
   */
  function getResult() {
    var selection = this.endingSelection_;

    function insertMarker(text, offset, marker) {
      return text.substr(0, offset) + marker + text.substr(offset);
    }

    function marker(node, offset) {
      if (!selection)
        return '';
      if (selection.focusNode === node && selection.focusOffset == offset)
        return '|';
      if (selection.anchorNode === node && selection.anchorOffset == offset)
        return '^';
      return '';
    }

    /**
     * @param {!Node} node
     * @return {string}
     */
    function visit(node) {
      if (node.nodeType == Node.TEXT_NODE) {
        var text = node.nodeValue;
        if (selection) {
          if (selection.focusNode == node)
            return insertMarker(text, selection.focusOffset, '|');
          if (selection.anchorNode == node)
            return insertMarker(text, selection.anchorOffset, '^');
        }
        return text;
      }
      if (node.nodeType != Node.ELEMENT_NODE) {
        // To support |Document| node, we iterate over child nodes.
        var sink = '';
        for (var child = node.firstChild; child; child = child.nextSibling) {
          sink += visit(child);
        }
        return sink.length ? sink : node.nodeValue;
      }
      var tagName = node.nodeName.toLowerCase();
      var sink = '<' + tagName;
      var attributes = node.attributes;
      var attrs = [];
      for (var index = 0; index < attributes.length; ++index) {
        attrs.push(attributes[index]);
      }
      attrs.sort(function(a, b) {
        return a.name <= b.name ? -1 : 0;
      }).forEach(function(attr) {
        var attrName = attr.name;
        // We ignore Firefox speicfic attributes inserted by |execCommand|.
        if (attrName.startsWith('_moz'))
          return;
        var attrValue = attr.value;
        if (attrValue){
          attrValue = String(attrValue).replace(/&/g, '&amp;')
              .replace(/\u0022/g, '&quot;')
          sink += ' ' + attrName + '="' + attrValue + '"';
        } else {
          sink += ' ' + attrName;
        }
      });
      sink += '>';
      var child = node.firstChild;
      var offset = 0;
      while (child) {
        sink += marker(node, offset);
        sink += visit(child);
        var nextSibling = child.nextSibling;
        if (child.nodeType == Node.TEXT_NODE && nextSibling &&
            nextSibling.nodeType == Node.TEXT_NODE) {
          sink += '_';
        }
        child = nextSibling;
        ++offset;
      }
      sink += marker(node, offset);
      if (!testing.END_TAG_OMISSIBLE[tagName])
        sink += '</' + tagName + '>';
      return sink;
    };
    var body = this.document_.body;
    return body ? visit(this.document_.body.firstChild) : '';
  }

  Object.defineProperties(SampleContext.prototype, {
    document: {get: function() { return this.document_; }},
    document_: {writable: true},
    endingSelection: {value: function() { return this.endingSelection_; }},
    endingSelection_: {writable: true},
    execCommand: {value: execCommand},
    getResult: {value: getResult},
    iframe_: {writable: true},
    selection: {get: function() { return this.selection_; }},
    selection_: {writable: true},
    startingSelection: {value: function() { return this.startingSelection_; }},
    startingSelection_: {writable: true}
  });
  return SampleContext;
})());
