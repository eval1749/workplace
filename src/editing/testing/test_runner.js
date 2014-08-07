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
  function logHtml(html) {
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
    logHtml: {value: logHtml},
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
