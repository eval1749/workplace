// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

function TestRunner() {
  this.allTestCases_ = [];
  this.results_ = [];
  this.sectionName_ = '';
  this.testCaseMap_ = {};
  this.useTryCatch_ = true;
  Object.seal(this);
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

    var heading = document.createElement('h3');
    heading.setAttribute('id', sectionName);
    heading.textContent = sectionName;
    document.body.appendChild(heading);

    var div = document.createElement('div');
    document.body.appendChild(div);

    var ol = document.createElement('ol');
    ol.classList.add('log');
    div.appendChild(ol);
    return ol;
  }

  /**
   * @param {!function} closure
   * @return {string}
   *
   * Note: Firefox inserts "use strict" and inserts spaces.
   */
  function toPrettyString(closure){
    var text = closure.toString()
        .replace('"use strict";', '')  // Firefox add "use strict".
        .replace(/function\s*\(\)\s*\{\s*return\s*/, '')
        .replace(/;\s*}/g, '');
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
    this.allTestCases_.push(testCase);
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
   * @this {!TestRunner}
   * @return {!Array.<string>}
   */
  function getSectionNames() {
    var sectionNames = new Set();
    var list = [];
    this.allTestCases_.forEach(function(testCase) {
      var name = testCase.name;
      var sectionName = name.substr(0, name.indexOf('.'));
      if (sectionNames.has(sectionName))
        return;
      list.push(sectionName);
      sectionNames.add(sectionName);
    });
    return list.sort();
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
   * @param {string=} opt_sectionName
   */
  function runAllTests(opt_sectionNameToRun) {
    /** @const */
    var CLASS_ORDERS = {
      exception: 1,
      fail: 2,
      warn: 3,
      incompatible_html: 4,
      incompatible_selection: 5,
      incompatible_return: 6,
      pass: 100,
    };

    /** @const */
    var KEY_NAME_OREDERS = {
      actual: '1',
      before: '0',
      expected: '2'
    };

    /** @const Key names aren't displayed in test results */
    var SKIP_KEY_NAMES = {
      className: 1,
      format: 1,
      message: 1
    };

    function compareKeys(key1, key2) {
      key1 = KEY_NAME_OREDERS[key1] || key1;
      key2 = KEY_NAME_OREDERS[key2] || key2;
      return key1.localeCompare(key1);
    }

    function orderOfClass(className) {
      return CLASS_ORDERS[className] || 9999;
    }

    // To report number of test cases in progress report, we populate
    // |testCasesByClass| here.
    var testCasesByClass = {};
    Object.keys(CLASS_ORDERS).forEach(function(key) {
      testCasesByClass[key] = [];
    });

    function classifyTestCase(testCase, className) {
      var testCases = testCasesByClass[className];
      if (!testCases) {
        testCases = [];
        testCasesByClass[className] = testCases;
      }
      testCases.push(testCase);
    }

    var runTests = [];

    /**
     * @this {!TestRunner}
     */
    function runTestCase(testCase) {
      this.useTryCatch_ = true;
      runTests.push(testCase);
      this.results_ = [];
      try {
        testCase.testFunction();
      } catch (exception) {
        this.fail(testCase.testFunction, {exception: exception});
      }

      // Emit test case result.
      var olSection = addSectionIfNeeded(this, testCase.name);
      var liTestCase = document.createElement('li');
      liTestCase.setAttribute('id', testCase.name);
      liTestCase.textContent = testCase.name;
      olSection.appendChild(liTestCase);
      var ol = document.createElement('ol');
      liTestCase.appendChild(ol);

      // Parse test results
      var testCaseClass = 'pass';
      var overrideResult = testing.TEST_EXPECTATIONS[testCase.name] ||
          {expected: 'pass'};
      if (overrideResult.reason) {
        overrideResult.className = 'override';
        overrideResult.message = overrideResult.reason;
        delete overrideResult['reason'];
        this.results_.push(overrideResult);
      }
      this.results_.forEach(function(result) {
        var className = result.className;
        if (className == overrideResult.expected) {
          if (overrideResult.expected != 'pass')
            classifyTestCase(testCase, 'override');
          className = 'pass';
        }
        classifyTestCase(testCase, className);

        // Total result class
        if (orderOfClass(testCaseClass) > orderOfClass(className))
          testCaseClass = className;

        var li = document.createElement('li');
        ol.appendChild(li);
        var spanMessage = document.createElement('span');
        spanMessage.classList.add(className);
        spanMessage.textContent = result.message;
        li.appendChild(spanMessage);
        var ulResult = document.createElement('ul');
        ulResult.classList.add(className);
        li.appendChild(ulResult);

        Object.keys(result).filter(function(key) {
          return !(key in SKIP_KEY_NAMES);
        }).sort(compareKeys).forEach(function(key) {
          var li = document.createElement('li');
          li.classList.add(key);
          ulResult.appendChild(li);
          var value = result[key];
          var filler = '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'
          if (result.format == 'html')
            li.innerHTML = (key + filler).substr(0, 10) + ' ' + value;
          else
            li.textContent = (key + filler).substr(0, 10) + ' ' + value;
        });
      });
      liTestCase.classList.add(testCaseClass);
    }

    var startAt = new Date();
    /**
     * @this {!TestRunner}
     */
    function finish() {
      var endAt = new Date();
      //document.getElementById('statusBar').outerHTML = '';

      var resultElement = document.getElementById('results');
      resultElement.innerHTML =
        'Run ' + runTests.length + ' tests' +
        ' in ' + Math.floor((endAt - startAt) * 1000) / 1000 + ' ms' +
        Object.keys(testCasesByClass).reduce(function(sink, key) {
          var count = testCasesByClass[key].length;
          return sink + ', <span class="' + key + '">' + count + ' ' + key +
                 '</span>';
        }, '');

      Object.keys(testCasesByClass).filter(function(key) {
        return key != 'pass';
      }).sort(function(key1, key2) {
        return orderOfClass(key1) - orderOfClass(key2);
      }).forEach(function(sectionName) {
        var testCases = testCasesByClass[sectionName];
        if (!testCases.length)
          return;
        var h3 = document.createElement('h3');
        h3.textContent = sectionName + ' (' + testCases.length + ')';
        resultElement.appendChild(h3);
        var p = document.createElement('p');
        resultElement.appendChild(p);
        var MAX_LINKS = 50;
        testCases.slice(0, MAX_LINKS).forEach(function(testCase, index) {
          p.appendChild(document.createTextNode(' '));
          var a = document.createElement('a');
          a.href = '#' + testCase.name;
          a.textContent = testCase.name;
          p.appendChild(a);
          if (index == MAX_LINKS - 1 && testCases.length >= MAX_LINKS)
            p.appendChild(document.createTextNode(' AND MORE!'));
        });
      });
    }

    var allTestCases = opt_sectionNameToRun ?
        this.allTestCases_.filter(function(testCase) {
          return testCase.name.startsWith(opt_sectionNameToRun);
        }) : this.allTestCases_;
    var testRunner = this;
    var lastBeginFrameTimeStamp = 0;
    var waitingTestCases = allTestCases.slice();

    function didBeginFrame(timeStamp) {
      /** @const */ var NUM_RUN = 5;
      for (var count = 0; count < NUM_RUN; ++count) {
        var testCase = waitingTestCases.shift();
        if (!testCase) {
          finish.call(testRunner);
          return;
        }

       var numRun = runTests.length;
       var percent = Math.floor((numRun / allTestCases.length) * 1000) / 10;
        var status= 'Run ' +
            numRun + '/' + allTestCases.length + '(' + percent + '%) tests.';
        document.getElementById('progress').style.width = percent + '%';

        ['exception', 'fail'].forEach(function(key) {
          if (!testCasesByClass[key].length)
            return;
          status += ' ' + testCasesByClass[key].length + ' ' + key + '.';
        });

        status += ' Elapsed: ' + ((new Date())- startAt) + 'ms';
        if (lastBeginFrameTimeStamp) {
          var durationUs = timeStamp - lastBeginFrameTimeStamp;
          status += ' latency=' + Math.floor(durationUs * 100) / 100 + 'us';
        }
        document.getElementById('status').textContent = status;

        runTestCase.call(testRunner, testCase);
      }
      lastBeginFrameTimeStamp = timeStamp;
      window.requestAnimationFrame(didBeginFrame);
    }

    window.requestAnimationFrame(didBeginFrame);
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
    allTestCases_: {writable: true},
    constructor: TestRunner,
    fail: {value: fail},
    getSectionNames: {value: getSectionNames},
    pass: {value: pass},
    record: {value: record},
    results_: {writable: true},
    runAllTests: {value: runAllTests},
    runTests_: {writable: true},
    sectionName_: {writable: true},
    skip: {value: skip},
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
