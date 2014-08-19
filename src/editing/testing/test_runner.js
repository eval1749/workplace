// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

function TestRunner() {
  this.testListElement_ = null;
  this.name_ = '';
  this.results_ = [];
  this.sectionName = '';
  this.testCaseListElement_ = null;
  this.testListElement_ = null;
  this.testCaseList_ = [];
  this.testCaseMap_ = {};
  this.useTryCatch_ = true;
}

Object.defineProperties(TestRunner.prototype, (function() {
  /**
   * @param {!TestRunner} testRunner
   * @param {string} testName
   * @return {?HTMLElement}
   */
  function addSectionIfNeeded(testRunner, testName) {
    var dotIndex = testName.indexOf('.');
    var sectionName = dotIndex > 0 ? testName.substr(0, dotIndex) : testName;
    if (testRunner.sectionName_ == sectionName)
      return document.getElementById(sectionName).nextSibling
          .querySelector('ol');

    testRunner.sectionName_ = sectionName;
    var present = document.getElementById(sectionName);
    if (present)
      present.outerHTML = '';

    var h2 = document.createElement('h2');
    h2.setAttribute('id', sectionName);
    h2.textContent = sectionName;
    document.body.appendChild(h2);

    var div = document.createElement('div');
    document.body.appendChild(div);

    var ol = document.createElement('ol');
    ol.classList.add('log');
    div.appendChild(ol);
    return ol;
  }

  function toPrettyString(closure){
    var text = closure.toString().replace('function () { return ', '')
        .replace('; }', '');
    return text;
  }

  /**
   * @this {!TestRunner}
   * @param {string} name
   * @param {!function} testFunction
   */
  function addTest(name, testFunction) {
    if (name in this.testCaseMap_)
      throw new Error('Test ' + name + ' is already registered.');
    var testCase = {name: name, testFunction: testFunction};
    this.testCaseList_.push(testCase);
    this.testCaseMap_[name] = testCase;
  }

  /**
   * @this {!TestRunner}
   * @param {string|!function} message
   * @param {Object=} opt_result
   * @return {!HTMLElement}
   */
  function fail(message, opt_result) {
    var result = mergeResult(
        {className: 'fail', message: toPrettyString(message)}, opt_result);
    if (result.exception)
      result.className = 'exception';
    this.results_.push(mergeResult(result, opt_result));
  }

  /**
   * @param {!Object} result
   * @param {?Object} moreResult
   */
  function mergeResult(result, moreResult){
    if (!moreResult)
      return result;
    Object.keys(moreResult).forEach(function(name) {
      result[name] = moreResult[name];
    });
    return result;
  }

  /**
   * @this {!TestRunner}
   * @param {string|!function} message
   * @param {Object=} opt_result
   * @return {!HTMLElement}
   */
  function pass(message, opt_result) {
    var result = {className: 'pass', message: toPrettyString(message)};
    this.results_.push(mergeResult(result, opt_result));
  }

  /**
   * @this {!TestRunner}
   * @param {string} reason
   * @param {Object=} opt_result
   */
  function skip(reason, opt_result) {
    var result = {className: 'skip', reason: reason};
    this.results_.push(mergeResult(result, opt_result));
  }

  /**
   * @this {!TestRunner}
   * @param {string} reason
   * @param {Object=} opt_result
   */
  function record(className, opt_result) {
    var result = {className: className, message: className};
    this.results_.push(mergeResult(result, opt_result));
  }

  /**
   * @this {!TestRunner}
   */
  function runAllTests() {
    var KEY_MAP = {
      actual: '1',
      before: '0',
      expected: '2'
    };
    function compareKeys(key1, key2) {
      key1 = KEY_MAP[key1] || key1;
      key2 = KEY_MAP[key2] || key2;
      return key1.localeCompare(key1);
    }

    var failTests = [];
    var runTests = [];
    var skipTests = [];
    var throwTests = [];
    var SKIP = {className: 1, format: 1, message: 1};
    this.useTryCatch_ = true;
    this.testCaseList_.forEach(function(testCase) {
      runTests.push(testCase);
      this.results_ = [];
      try {
        testCase.testFunction();
      } catch (exception) {
        this.fail(testCase.testFunction, {exception: exception});
      }
      var olSection = addSectionIfNeeded(this, testCase.name);
      var liTestCase = document.createElement('li');
      liTestCase.setAttribute('id', testCase.name);
      liTestCase.textContent = testCase.name;
      olSection.appendChild(liTestCase);

      // Parse test results
      var ol = document.createElement('ol');
      liTestCase.appendChild(ol);
      var testCaseClassName = 'pass';
      this.results_.forEach(function(result) {
        var li = document.createElement('li');
        ol.appendChild(li);
        var spanMessage = document.createElement('span');
        spanMessage.classList.add(result.className);
        spanMessage.textContent = result.message;
        li.appendChild(spanMessage);

        if (result.className == 'exception') {
          testCaseClassName = result.className;
        } else if (result.className == 'fail') {
          if (testCaseClassName != 'exception')
            testCaseClassName = result.className;
        }

        var ulResult = document.createElement('ul');
        ulResult.classList.add(result.className);
        li.appendChild(ulResult);
        Object.keys(result).filter(function(key) {
          return !(key in SKIP);
        }).sort(compareKeys).forEach(function(key) {
          var li = document.createElement('li');
          li.classList.add(key);
          ulResult.appendChild(li);
          var value = result[key];
          if (result.format == 'html')
            li.innerHTML = (key + '_____').substr(0, 10) + ' ' + value;
          else
            li.textContent = (key + '____').substr(0, 10) + ' ' + value;
        });
      });

      if (testCaseClassName == 'fail')
        failTests.push(testCase);
      else if (testCaseClassName == 'exception')
        throwTests.push(testCase);
      liTestCase.classList.add(testCaseClassName);
    }, this);

    var resultElement = document.getElementById('result');
    if (!failTests.length && !throwTests.length) {
      resultElement.innerHTML = '<font color="green">' +
        'Run' + runTests.length + ' tests,' +
        ' all tests are passed!</font>';
      return;
    }

    resultElement.innerHTML =
      'Run ' + runTests.length + ' tests,' +
      ' <font color="red">' + failTests.length + ' failed tests,' +
      ' ' + throwTests.length + ' thrown tests.</font>';

    function emitLinkToTestCase(sectionName, testCases) {
      if (!testCases.length)
        return;
      var h3 = document.createElement('h3');
      h3.textContent = sectionName;
      resultElement.appendChild(h3);
      var ol = document.createElement('ol');
      resultElement.appendChild(ol);
      testCases.forEach(function(testCase) {
        var li = document.createElement('li');
        ol.appendChild(li);
        var a = document.createElement('a');
        a.href = '#' + testCase.name;
        a.textContent = testCase.name;
        li.appendChild(a);
      });
    }

    emitLinkToTestCase('Failed Tests', failTests);
    emitLinkToTestCase('Thrown Tests', throwTests);
  }

  /**
   * @this {!TestRunner}
   * @param {string|!function} message
   * @param {Object=} opt_result
   * @return {!HTMLElement}
   */
  function warn(message, opt_result) {
    var result = {className: 'warn', message: toPrettyString(message)};
    this.results_.push(mergeResult(result, opt_result));
  }

  return {
    addTest: {value: addTest},
    constructor: TestRunner,
    fail: {value: fail},
    pass: {value: pass},
    record: {value: record},
    results_: {writable: true},
    runAllTests: {value: runAllTests},
    runTests_: {writable: true},
    skip: {value: skip},
    testsCaseList_: {writable: true},
    testsCaseMap_: {writable: true},
    useTryCatch: {get: function() { return this.useTryCatch_; }},
    useTryCatch_: {writable: true},
    warn: {value: warn}
  }
})());
var testRunner = new TestRunner();


/**
 * For running test case from console.
 */
function run(testName) {
  var testCase = testRunner.testCaseMap_[testName];
  if (!testCase) {
    console.log('No such test case', testName);
    return;
  }
  testRunner.results_ = [];
  testRunner.useTryCatch_ = false;
  testCase.testFunction();
  testRunner.results_.forEach(function(result) {
    console.log(result);
  });
}
