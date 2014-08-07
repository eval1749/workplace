// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

testing.define('createContext', (function() {
  function createContext() {
    return new editing.EditingContext(
        document.implementation.createHTMLDocument());
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
    var testingDocument = document.implementation.createHTMLDocument();
    var testingSelection = new testing.TestingSelection(testingDocument,
                                                        htmlText);
    var context = new editing.EditingContext(testingDocument, testingSelection);
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
    var testResult = context.execCommand.apply(context, args);
    var sampleContext = context.sampleContext_;
    var sampleResult = sampleContext.execCommand.apply(sampleContext, args);
    if (testResult != sampleResult)
      expectEq(sampleResult, function() { return testResult; });
    return testResult;
  }
  return execCommand;
})());

testing.define('getResultHtml', (function() {
  function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
  }
  function pretty(text) {
    var anchorIndex = text.indexOf('^');
    var focusIndex = text.indexOf('|');
    var escaped = escapeHtml(text);
    if (focusIndex < 0)
      return escaped;
    if (anchorIndex < 0) {
      return escaped.replace('|', '<span class="selectionAnchorFocus"></span>');
    }
    if (anchorIndex < focusIndex) {
      return escaped.replace('^', '<span class="selectionAnchorFocus">')
        .replace('|', '</span>');
    }
    return escaped.replace('|', '<span class="selectionFocusAnchor">')
        .replace('^', '</span>');
  }

  function getResultHtml(context) {
    var result = testing.serialzieNode(context.selection.rootForTesting,
                                       context.endingSelection);
    var sample = context.sampleContext_.getResult();
    if (result != sample) {
      testRunner.logHtml('Src: ' + pretty(context.sampleHtmlText_));
      testRunner.logHtml('Cur: ' + pretty(sample));
      testRunner.logHtml('New: ' + pretty(result));
    }
    return result;
  }
  return getResultHtml;
})());

testing.define('serialzieNode', (function() {
  /**
   * @param {!EditingNode} node
   * @param {editing.ReadOnlySelection=} opt_selection
   * @return {string}
   */
  function serialzieNode(node, opt_selection) {
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
      var attributes = node.attributes;
      Object.keys(attributes).sort().forEach(function(attrName) {
        var attrValue = attributes[attrName];
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
        child = child.nextSibling;
        ++offset;
      }
      sink += marker(node, offset);
      if (!testing.END_TAG_OMISSIBLE[tagName])
        sink += '</' + tagName + '>';
      return sink;
    };
    return visit(node);
  }

  return serialzieNode;
})());
