// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

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

function testCaseFor(commandName, testCaseId, data) {
  if (typeof(data.after) != 'string')
    throw new Error('You must specify before sample');
  if (typeof(data.before) != 'string')
    throw new Error('You must specify before sample');
  testCase(commandName + '.' + testCaseId, function() {
    var context = testing.createSample(data.before);
    expectTrue(function() {
      return testing.execCommand(context, commandName,
                                 Boolean(data.userInferface),
                                 data.value || '');
    });
    expectEq(data.after, function() { return testing.getResultHtml(context); });
  });
}
