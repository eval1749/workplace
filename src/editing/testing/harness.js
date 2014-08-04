// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

function TestRunner() {
  this.failedCount_ = 0;
  this.logListElement_ = null;
  this.name_ = '';
  this.succeededCount_ = 0;
  this.testCount_ = 0;
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
    this.name_ = name;
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
    this.logListElement_ = null;
    this.name_ = '';
  }

  /**
   * @this {!TestRunner}
   * @return {!HTMLElement}
   */
  function failed() {
    ++this.testCount_;
    ++this.failedCount_;
    var element = this.log(this.name_);
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
  function succeeded() {
    ++this.testCount_;
    ++this.succeededCount_;
    var element = this.log(this.name_);
    element.classList.add('succeeded');
    return element;
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

function expectEq(expected_result, actual_result) {
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
  var logElement = testRunner.failed();
  var listElement = document.createElement('ul');
  logElement.appendChild(listElement);
  ['Expected:' + expected_result, 'Actual: ' + actual_result].forEach(
    function(value) {
      var listItemElement = document.createElement('li');
      listItemElement.textContent = value;
      listElement.appendChild(listItemElement);
  });
}

function expectFalse(actual_result) {
  expectEq(false, actual_result);
}

function expectNull(actual_result) {
  expectEq(null, actual_result);
}

function expectTrue(actual_result) {
  expectEq(true, actual_result);
}

function expectUndefined(actual_result) {
  expectEq(undefined, actual_result);
}


function testCase(name, testFunction) {
  testRunner.beginTest(name);

  // TODO(yosin) We should use catch version.
  try {
    testFunction();
  } finally {
    testRunner.endTest(name);
  }
  return;

  try {
    testFunction();
  } catch (exception) {
    testRunner.log(name + ' exception: ' + exception.toString());
    testRunner.failed();
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

testing.define('createTree', (function() {
  function indexOfNode(node) {
    var parentNode = node.parentNode;
    var index = 0;
    for (var child = parentNode.firstChild; child;
         child = child.previousSibling) {
      if (child == node)
        return index;
      ++index;
    }
    NOTREACEHD();
  }

  function locateMarkers(node, markers) {
    var child = node.firstChild;
    if (child) {
      while (child){
        var nextSibling = child.nextSibling;
        locateMarkers(child, markers);
        if (markers.anchorNode && markers.focusNode)
          return markers;
        child = nextSibling;
      }
      return markers;
    }

    if (node.nodeType != Node.TEXT_NODE)
      return markers;

    var templateText = node.nodeValue;
    var text = templateText.replace('^', '').replace('|', '');

    var anchorOffset = templateText.replace('|', '').indexOf('^');
    var focusOffset = templateText.replace('^', '').indexOf('|');

    if (anchorOffset < 0 && focusOffset < 0)
      return markers;

    if (text.length) {
      if (anchorOffset >= 0) {
        markers.anchorNode = node;
        markers.anchorOffset = anchorOffset;
      }
      if (focusOffset >= 0) {
        markers.focusNode = node;
        markers.focusOffset = focusOffset;
      }
console.log('createTree', 'Foo', templateText, anchorOffset, focusOffset);
      node.nodeValue = text;
      return markers;
    }

    if (anchorOffset >= 0) {
      markers.anchorNode = node.parentNode;
      markers.anchorOffset = indexOfNode(node);
    }
    if (focusOffset >= 0) {
      markers.focusNode = node.parentNode;
      markers.focusOffset = indexOfNode(node);
    }
    node.parentNode.removeChild(node);
  }

  function createTree(htmlText) {
    var rootElement = document.createElement('div');
    rootElement.innerHTML = htmlText;
    document.body.appendChild(rootElement);

    if (htmlText.indexOf('^') != htmlText.lastIndexOf('^'))
      throw new Error('More than one focus marker in "' + htmlText + '"');

    if (htmlText.indexOf('|') != htmlText.lastIndexOf('|'))
      throw new Error('More than one focus marker in "' + htmlText + '"');

    var markers = locateMarkers(rootElement, {});
    var selection = window.getSelection();
    selection.removeAllRanges();
    if (markers.anchodNode) {
      selection.collapse(markers.anchorNode, markers.anchorOffset);
      if (markers.focusNode)
        selection.extend(markers.focusNode, markers.focusOffset);
    } else if (markers.focusNode) {
      selection.collapse(markers.focusNode, markers.focusOffset);
    }
    console.log('createTree HTM', rootElement.outerHTML);
    console.log('creareTree SEL', selection.anchorNode, selection.anchorOffset,
                selection.focusNode, selection.focusOffset);
    var context = new editing.EditingContext(document);
    //rootElement.parentNode.removeChild(rootElement);
    return context;
  }

  return createTree;
})());


testing.define('serialzieNode', (function() {
  /// TODO(yosin) We should add more end tag omissible tag names.
  /** @const */ var END_TAG_OMISSIBLE = {
    br: true,
    hr: true
  };

  /**
   * @param {!EditingNode} node
   * @return {string}
   */
  function serialzieNode(node) {
    console.assert(node instanceof editing.EditingNode);
    function visit(node) {
      if (!node.isElement)
        return node.nodeValue;
      var tagName = node.domNode.nodeName.toLowerCase();
      var sink = '<' + tagName;
      var attributes = node.attributes;
      for (var attrName in attributes) {
        var attrValue = attributes[attrName].replace(/&/g, '&amp;')
            .replace(/\u0022/g, '&quot;')
        sink += ' ' + attrName + '="' + attrValue + '"';
      }
      sink += '>';
      var child = node.firstChild;
      while (child) {
        sink += visit(child);
        child = child.nextSibling;
      }
      if (!END_TAG_OMISSIBLE[tagName])
        sink += '</' + tagName + '>';
      return sink;
    };
    return visit(node);
  }

  return serialzieNode;
})());
