// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

function TestRunner() {
  this.commandCount_ = 0;
  this.failedCommands_ = [];
  this.failedCount_ = 0;
  this.failedSelections_ = [];
  this.lastCommandName_ = null;
  this.logListElement_ = null;
  this.localFailedCount_ = 0;
  this.name_ = '';
  this.section_ = null;
  this.succeededCount_ = 0;
  this.succeededCommands_ = [];
  this.testCount_ = 0;
  this.testNames_ = {};
}

Object.defineProperties(TestRunner.prototype, (function() {
  function getOrCreateListElement(testRunner) {
    if (testRunner.logListElement_)
      return testRunner.logListElement_;
    if (!testRunner.section_)
      testRunner.section_ = document.querySelector('h2');
    testRunner.LogListElement_ = testRunner.section_.querySelector('ol');
    if (testRunner.logListElement_)
      return testRunner.logListElement_;
    testRunner.LogListElement_ = document.createElement('ol');
    testRunner.LogListElement_.classList.add('log');
    testRunner.section_.appendChild(testRunner.LogListElement_);
    return testRunner.LogListElement_;
  }

  /**
   * @this {!TestRunner}
   * @param {string} name
   */
  function beginCommandTest(commandName) {
    if (this.lastCommandName_ == commandName)
      return;
    this.lastCommandName_ = commandName;
    this.beginSection(commandName);
  }

  /**
   * @this {!TestRunner}
   * @param {string} name
   */
  function beginSection(name) {
    this.section_ = document.createElement('h2');
    this.section_.textContent = name;
    document.body.appendChild(this.section_);
    this.logListElement_ = null;
    getOrCreateListElement(this);
  }

  /**
   * @this {!TestRunner}
   * @param {string} name
   */
  function endCommandTest(commandName) {
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
    getOrCreateListElement(this).appendChild(item);
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
   */
  function finishTesting() {
    var resultElement = document.getElementById('result');
    resultElement.textContent = 'Run ' + this.testCount_ + ' tests, ' +
        this.failedCount_ + ' tests are failed.';
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

  function skipped() {
    this.log('Skpped');
  }

  /**
   * @this {!TestRunner}
   * @return {!HTMLLIElement}
   */
  function recordCommandFailed(commandName, caseName) {
    this.failedCommands_.push(caseName);
    var element = this.log(caseName);
    element.classList.add('failed');
    return element;
  }

  /**
   * @this {!TestRunner}
   * @return {!HTMLLIElement}
   */
  function recordCommandSucceeded(commandName, caseName) {
    if (this.lastCommandName_ != commandName) {
      this.lastCommandName_ = commandName;
      this.beginSection(commandName);
    }
    this.succeededCommands_.push(caseName);
    var element = this.log(caseName);
    element.classList.add('succeeded');
    return element;
  }

  function recordSelectionFailure(commandName, caseName) {
    this.failedSelections_.push(caseName);
    return this.warn('Selections are different');
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

  /**
   * @this {!TestRunner}
   * @return {!HTMLElement}
   */
  function warn(closure) {
    ++this.testCount_;
    var element = this.log(toPrettyString(closure));
    element.classList.add('warn');
    return element;
  }

  return {
    beginCommandTest: {value: beginCommandTest},
    beginSection: {value: beginSection},
    beginTest: {value: beginTest},
    commandCount_: {writable: true},
    constructor: TestRunner,
    endCommandTest: {value: endCommandTest},
    endTest: {value: endTest},
    failed: {value: failed},
    failedCommands_: {writable: true},
    failedCount_: {writable: true},
    failedSelections_: {writable: true},
    finishTesting: {value: finishTesting},
    lastCommandName_: {writable: true},
    log: {value: log},
    logListElement_: {writable: true},
    logHtml: {value: logHtml},
    name_: {writable: true},
    recordCommandFailed: {value: recordCommandFailed},
    recordCommandSucceeded: {value: recordCommandSucceeded},
    recordSelectionFailure: {value: recordSelectionFailure},
    skipped: {value: skipped},
    succeeded: {value: succeeded},
    testCount_: {writable: true},
    section_: {writable: true},
    succeededCount_: {writable: true},
    succeededCommands_: {writable: true},
    warn: {value: warn}
  }
})());
var testRunner = new TestRunner();
