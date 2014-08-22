// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

testing.define('Sample', (function() {
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
  function fixupAnchorAndFocus(selection, node) {
    if (node.nodeType != Node.TEXT_NODE)
      return;
    var previousSibling = node.previousSibling;
    if (!previousSibling || previousSibling.nodeType != Node.TEXT_NODE)
      return;
    var beforeText = previousSibling.textContent;
    previousSibling.textContent = beforeText + node.textContent;
    node.parentNode.removeChild(node);
    if (selection.anchorNode === node) {
      selection.anchorNode = previousSibling;
      selection.anchorOffset += beforeText.length;
    }
    if (selection.focusNode === node) {
      selection.focusNode = previousSibling;
      selection.focusOffset += beforeText.length;
    }
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
      selection.anchorNode = containerNode;
      selection.anchorOffset = offsetInContainer;
    } else {
      selection.focusNode = containerNode;
      selection.focusOffset = offsetInContainer;
    }

    if (!selection.anchorNode && selection.focusNode) {
      selection.direction = editing.SelectionDirection.FOCUS_IS_START;
      selection.anchorNode = selection.focusNode;
      selection.anchorOffset = selection.focusOffset;
    }
  }

  /**
   * @param {!Document} document
   * @param {string} htmlText
   */
  function parseSample(document, htmlText) {
    if (htmlText.indexOf('^') != htmlText.lastIndexOf('^'))
      throw new Error('More than one focus marker in "' + htmlText + '"');

    if (htmlText.indexOf('|') != htmlText.lastIndexOf('|'))
      throw new Error('More than one focus marker in "' + htmlText + '"');

    if (htmlText.indexOf('|') < 0)
      throw new Error('You should have at most one | in "' + htmlText + '"');

    document.body.innerHTML = htmlText.replace('|', '<!--|-->')
        .replace('^', '<!--^-->');

    var selection = {
      anchorNode: null,
      anchorOffset: 0,
      direction: editing.SelectionDirection.ANCHOR_IS_START,
      focusNode: null,
      focusOffset: 0,
    };

    parseAnchorAndFocus(selection, document.body);
    fixupAnchorAndFocus(selection, selection.anchorNode);
    fixupAnchorAndFocus(selection, selection.focusNode);
    return new editing.ReadOnlySelection(
        selection.anchorNode, selection.anchorOffset,
        selection.focusNode, selection.focusOffset,
        selection.direction);
  }

  /**
   * @constructor
   * @param {string} htmlText
   */
  function Sample(htmlText) {
    var iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    // Note: Firefox requires focus to retrieve selection from IFRAME.
    iframe.focus();

    this.endingSelection_ = null;
    this.iframe_ = iframe;
    this.document_ = iframe.contentDocument;
    this.domSelection_ = iframe.contentWindow.getSelection();
    if (!this.domSelection_)
      throw new Error('Can not get selection from IFRAME');
    this.startingSelection_ = parseSample(this.document, htmlText);
    Object.seal(this);
  }

  
  /**
   * @this {!Sample}
   * @param {string} name
   * @param {boolean=} opt_userInterface
   * @param {string=} opt_value
   *
   * Emulation of |Document.execCommand|.
   */
  function execCommand(name, opt_userInterface, opt_value) {
    var editor = editing.getOrCreateEditor(this.document_);
    editor.setDomSelection(this.startingSelection_);
    if (testRunner.useTryCatch) {
      var returnValue = 'UNKNOWN';
      try {
        returnValue = this.document_.execCommand.apply(
            this.document_, arguments);
      } catch (exception) {
        throw new Error('execCommand ' + exception);
      }
      try {
        this.endingSelection_ = editing.ReadOnlySelection.createFromDom(
            this.document_.getSelection());
      } catch (exception){
        throw new Error('setSelection ' + exception);
      }
    } else {
      returnValue = this.document_.execCommand.apply(
          this.document_, arguments);
      editor.setDomSelection(this.endingSelection_);
    }
    return returnValue;
  }

  /**
   * @this {!Sample}
   */
  function finish() {
    console.assert(this.iframe_);
    this.iframe_.parentNode.removeChild(this.iframe_);
    this.iframe_ = null;
  }

  /**
   * @this {!Sample}
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
          // Remove last ";" since IE put ";" for "style" attribute, but
          // other browsers don't.
          if (attrName == 'style')
            attrValue = attrValue.replace(/;$/, '');
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
      if (!testing.END_TAG_OMISSIBLE.has(tagName))
        sink += '</' + tagName + '>';
      return sink;
    };
    var body = this.document_.body;
    return body ? visit(this.document_.body.firstChild) : '';
  }

  Object.defineProperties(Sample.prototype, {
    document: {get: function() { return this.document_; }},
    document_: {writable: true},
    domSelection: {get: function() { return this.domSelection_; }},
    domSelection_: {writable: true},
    endingSelection: {get: function() { return this.endingSelection_; }},
    endingSelection_: {writable: true},
    execCommand: {value: execCommand},
    finish: {value: finish},
    getResult: {value: getResult},
    iframe_: {writable: true},
    startingSelection: {get: function() { return this.startingSelection_; }},
    startingSelection_: {writable: true}
  });
  return Sample;
})());
