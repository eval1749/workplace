// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

testing.define('createContext', (function() {
  function createContext() {
    var sampleDocument = document.implementation.createHTMLDocument('title');
    var editor = editing.getOrCreateEditor(sampleDocument);
    return editor.newContext();
  }
  return createContext;
})());

testing.define('createElement', (function() {
  function createElement(context, tagName) {
    var domNode = context.document.createElement(tagName);
    return new editing.EditingNode(context, domNode);
  }
  return createElement;
})());

testing.define('createSample', (function() {
  function createSample(htmlText){
    var context = testing.createTree(htmlText);
    context.sampleContext_ = new testing.SampleContext(htmlText);
    return context;
  }

  return createSample;
})());

testing.define('createTree', (function() {
  function createTree(htmlText) {
    var testingDocument = document.implementation.createHTMLDocument('title');
    var testingSelection = new testing.TestingSelection(testingDocument,
                                                        htmlText);
    var editor = editing.getOrCreateEditor(testingDocument);
    var context = editor.newContext(testingSelection);
    context.sampleHtmlText_ = htmlText;
    return context;
  }
  return createTree;
})());

testing.define('execCommand', (function() {
  /**
   * @param {!editing.EditingContext} context
   * @param {string} commandName
   * @param {boolean=} opt_userInterface
   * @param {string=} opt_value
   * @return {boolean}
   */
  function execCommand(context, commandName, opt_userInterface, opt_value) {
    var args = [];
    for (var index = 1; index < arguments.length; ++index) {
      args.push(arguments[index]);
    }
    var actualReturnValue = context.execCommand.apply(context, args);
    var sampleContext = context.sampleContext_;
    var sampleReturnValue = sampleContext.execCommand.apply(sampleContext,
                                                            args);
    if (actualReturnValue != sampleReturnValue) {
      testRunner.log('Current return value is ' + sampleReturnValue +
        ', but new result is ' + actualReturnValue + '.');
    }
    return actualReturnValue;
  }
  return execCommand;
})());

testing.define('serialzieNode', (function() {
  /**
   * @param {!EditingNode} node
   * @param {editing.ReadOnlySelection=} opt_selection
   * @param {boolean=} opt_visibleTextNode
   * @return {string}
   */
  function serialzieNode(node, opt_selection, opt_visibleTextNode) {
    console.assert(node instanceof editing.EditingNode);
    /** @const */ var selection = arguments.length >= 2 ?
        /** @type {!editing.ReadOnlySelection} */(opt_selection) : null;

    function marker(node, offset) {
      if (!selection)
        return '';
      if (selection.focusNode === node && selection.focusOffset == offset)
        return '|';
      if (selection.anchorNode === node && selection.anchorOffset == offset)
        return '^';
      return '';
    }

    function visit(node) {
      if (!node.isElement) {
        // To support |Document| node, we iterate over child nodes.
        var sink = '';
        for (var child = node.firstChild; child; child = child.nextSibling) {
          sink += visit(child);
        }
        return sink.length ? sink : node.nodeValue;
      }
      var tagName = node.domNode.nodeName.toLowerCase();
      var sink = '<' + tagName;
      node.attributeNames.sort().forEach(function(attrName) {
        var attrValue = node.getAttribute(attrName);
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
        if (opt_visibleTextNode && child.isText && nextSibling &&
            nextSibling.isText) {
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
