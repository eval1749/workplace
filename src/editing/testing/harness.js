// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

function TestRunner() {
  this.failedCount_ = 0;
  this.logListElement_ = null;
  this.localFailedCount_ = 0;
  this.name_ = '';
  this.succeededCount_ = 0;
  this.testCount_ = 0;
  this.testNames_ = {};
}

Object.defineProperties(TestRunner.prototype, (function() {
  function getOrCreateListElement() {
    var logListElement = document.getElementById('log');
    if (logListElement)
      return logListElement;
    var newLogListElement = document.createElement('ol');
    newLogListElement.setAttribute('id', 'log');
    document.body.appendChild(newLogListElement);
    return newLogListElement
  }

  /**
   * @this {!TestRunner}
   * @param {string} name
   */
  function beginTest(name) {
    console.assert(this.name_ == '');
    if (this.testNames_[name])
      throw new Error('Test case ' + name + ' is already executed.');
    this.testNames_[name] = true;
    this.name_ = name;
    this.localFailedCount_ = this.failedCount_;
    var item = document.createElement('li');
    item.textContent = name;
    getOrCreateListElement().appendChild(item);
    var list = document.createElement('ol');
    item.appendChild(list);
    this.logListElement_ = list;
  }

  /**
   * @this {!TestRunner}
   * @param {string} name
   */
  function endTest(name){
    console.assert(this.name_ == name);
    if (this.localFailedCount_ == this.failedCount_)
      this.logListElement_.parentNode.classList.add('succeeded');
    else
      this.logListElement_.parentNode.classList.add('failed');
    this.logListElement_ = null;
    this.name_ = '';
  }

  /**
   * @this {!TestRunner}
   * @return {!HTMLElement}
   */
  function failed(closure) {
    ++this.testCount_;
    ++this.failedCount_;
    var element = this.log(toPrettyString(closure));
    element.classList.add('failed');
    return element;
  }

  /**
   * @this {!TestRunner}
   * @param {string} message
   * @return {!HTMLLIElement}
   */
  function log(message) {
    var logListItem = document.createElement('li');
    this.logListElement_.appendChild(logListItem);
    logListItem.textContent = message;
    return logListItem;
  }

  /**
   * @this {!TestRunner}
   * @param {string} html
   */
  function logWithHtml(html) {
    var logListItem = document.createElement('li');
    this.logListElement_.appendChild(logListItem);
    logListItem.innerHTML = html;
  }

  /**
   * @this {!TestRunner}
   * @return {!HTMLLIElement}
   */
  function succeeded(closure) {
    ++this.testCount_;
    ++this.succeededCount_;
    if (!closure)
      return null;
    var element = this.log(toPrettyString(closure));
    element.classList.add('succeeded');
    return element;
  }

  function toPrettyString(closure){
    var text = closure.toString().replace('function () { return ', '')
        .replace('; }', '');
    return text;
  }

  return {
    beginTest: {value: beginTest},
    constructor: TestRunner,
    endTest: {value: endTest},
    failed: {value: failed},
    failedCount_: {writable: true},
    log: {value: log},
    logListElement_: {writable: true},
    logWithHtml: {value: logWithHtml},
    name_: {writable: true},
    succeeded: {value: succeeded},
    testCount_: {writable: true},
    succeededCount_: {writable: true},
  }
})());
var testRunner = new TestRunner();

function expectEq(expected_result, testFunction) {
  var actual_result;
  try {
    actual_result = testFunction();
  } catch (exception) {
    actual_result = exception;
    // TODO(yosin) We throw |execption| for debugging. Once, debugging is done,
    // we should remove this.
    throw exception;
  }
  function equal() {
    if (typeof(expected_result) != typeof(actual_result))
      return false;
    if (typeof(expected_result) == 'object')
      return expected_result === actual_result;
    return expected_result == actual_result;
  }
  if (equal()) {
    testRunner.succeeded();
    return;
  }
  var logElement = testRunner.failed(testFunction);
  var listElement = document.createElement('ul');
  logElement.appendChild(listElement);
  ['Expected:' + expected_result, 'Actual__:' + actual_result].forEach(
    function(value) {
      var listItemElement = document.createElement('li');
      listItemElement.textContent = value;
      listElement.appendChild(listItemElement);
  });
}

function expectFalse(testFunction) {
  expectEq(false, testFunction);
}

function expectNull(testFunction) {
  expectEq(null, testFunction);
}

function expectTrue(testFunction) {
  expectEq(true, testFunction);
}

function expectUndefined(testFunction) {
  expectEq(undefined, testFunction);
}

function testCase(name, testFunction) {
  testRunner.beginTest(name);

  try {
    testFunction();
  } catch (exception) {
    testRunner.log(name + ' exception: ' + exception.toString());
    testRunner.failed(name);
    throw exception;
  } finally {
    testRunner.endTest(name);
  }
}

function NOTREACHED() {
  throw new Error('NOTREACHED');
}

var testing = {};
Object.defineProperty(testing, 'define', {
  value:
  /**
   * @param {string} name
   * @param {*} value
   */
  function(name, value) {
    Object.defineProperty(testing, name, {value: value});
  }
});

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

testing.define('createTree', (function() {
  function createTree(htmlText) {
    var testingDocument = document.implementation.createHTMLDocument();
    var testingSelection = new testing.TestingSelection(testingDocument,
                                                        htmlText);
    return new editing.EditingContext(testingDocument, testingSelection);
  }

  return createTree;
})());

testing.define('getResultHtml', (function() {
  function getResultHtml(context) {
    return testing.serialzieNode(context.selection.rootForTesting,
                                 context.endingSelection);
  }
  return getResultHtml;
})());

testing.define('serialzieNode', (function() {
  /// TODO(yosin) We should add more end tag omissible tag names.
  /** @const */ var END_TAG_OMISSIBLE = {
    BR: true,
    HR: true,
    IMG: true
  };

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
      if (!END_TAG_OMISSIBLE[tagName])
        sink += '</' + tagName + '>';
      return sink;
    };
    return visit(node);
  }

  return serialzieNode;
})());
