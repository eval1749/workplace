// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

testing.define('createContext', (function() {
  function createContext(htmlText) {
    var sample = new testing.SampleContext(htmlText || '^foo|');
    var editor = editing.getOrCreateEditor(sample.document);
    return editor.createContext('noname', sample.startingSelection);
  }
  return createContext;
})());

testing.define('createEditor', (function() {
  function createEditor(htmlText) {
    var document = window.document.implementation.createHTMLDocument('title');
    var sample = new testing.SampleContext(htmlText);
    var editor = editing.getOrCreateEditor(sample.document);
    editor.setSelection(sample.startingSelection);
    return editor;
  }
  return createEditor;
})());

testing.define('withSample', (function() {
  function withSample(htmlText, callback) {
    var sample = new testing.SampleContext(htmlText);
    var context = testing.createContext('<p contenteditable>^abcd|</p>');
    var editor = editing.getOrCreateEditor(sample.document);
    var context = editor.createContext('noname', sample.startingSelection);
    try {
      callback(context.selection);
    } finally {
      sample.finish();
    }
  }
  return withSample;
})());

testing.define('serialzieNode', (function() {
  /**
   * @param {!Node} node
   * @param {Object=} opt_options
   *    selection: editing.ReadOnlySelection
   *    visibleTextNode: boolean
   * @return {string}
   */
  function serialzieNode(node, opt_options) {
    //console.assert(node instanceof Node);
    /** @const */ var options = arguments.length >= 2 ?
        /** @type {Object} */(opt_options) : {};
    /** @const */ var selection = options.selection || null;
    /** @const */ var visibleTextNode = Boolean(options.visibleTextNode);

    function marker(node, offset) {
      if (!selection)
        return '';
      if (selection.focusNode === node && selection.focusOffset == offset)
        return '|';
      if (selection.anchorNode === node && selection.anchorOffset == offset)
        return '^';
      return '';
    }

    function orderByAttributeName(attrNode1, attrNode2) {
      return attrNode1.name.localeCompare(attrNode2.name);
    }

    function visit(node) {
      if (!editing.nodes.isElement(node)) {
        // To support |Document| node, we iterate over child nodes.
        var sink = '';
        for (var child = node.firstChild; child; child = child.nextSibling) {
          sink += visit(child);
        }
        return sink.length ? sink : node.nodeValue;
      }
      var tagName = node.nodeName.toLowerCase();
      var sink = '<' + tagName;
      [].slice.call(node.attributes).sort(orderByAttributeName).forEach(
        function(attrNode) {
          var attrName = attrNode.name;
          var attrValue = attrNode.value;
          if (attrValue){
            attrValue = attrValue.replace(/&/g, '&amp;')
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
        if (visibleTextNode && editing.nodes.isText(child) && nextSibling &&
            editing.nodes.isText(nextSibling)) {
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
    return visit(node);
  }

  return serialzieNode;
})());
