// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

function expectEq(expectedResult, testFunction, message) {
  function equal(expectedResult, actualResult) {
    if (typeof(expectedResult) != typeof(actualResult))
      return false;
    if (typeof(expectedResult) == 'object')
      return expectedResult === actualResult;
    return expectedResult == actualResult;
  }

  message = message || testFunction;

  var actualResult;
  if (testRunner.useTryCatch) {
    try {
      actualResult = testFunction();
    } catch (exception) {
      testRunner.fail(message, {exception: exception});
      return;
    }
  } else {
    actualResult = testFunction();
  }

  if (equal(expectedResult, actualResult)) {
    testRunner.pass(message);
    return;
  }
  testRunner.fail(message, {
    actual: actualResult,
    expected: expectedResult,
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
  testRunner.addTest(name, testFunction);
}

function testCaseFor(commandName, testCaseId, data) {
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
    if (anchorIndex < 0)
      return escaped.replace('|', '<span class="selectionAnchorFocus"></span>');
    if (anchorIndex < focusIndex) {
      return escaped.replace('^', '<span class="selectionAnchorFocus">')
        .replace('|', '</span>');
    }
    return escaped.replace('|', '<span class="selectionFocusAnchor">')
        .replace('^', '</span>');
  }

  function stripMarker(text) {
    return text.replace('^', '').replace('|', '');
  }

  if (typeof(data.after) != 'string') {
    testRunner.fail('Test data after must be string: ' + data.after);
    return;
  }
  if (data.after.indexOf('|') < 0) {
    testRunner.fail('Test data after must have '|': ' + data.after);
    return;
  }

  if (typeof(data.before) != 'string') {
    testRunner.fail('Test data before must be string: ' + data.before);
    return;
  }
  if (data.before.indexOf('|') < 0) {
    testRunner.fail('Test data before must have '|': ' + data.before);
    return;
  }

  var testCaseName = commandName + '.' + testCaseId;
  testCase(testCaseName, function() {
    var context = testing.createSample(data.before);

    // Execute command and check return value
    var expectedReturnValue = data.returnValue === undefined ?
        true : data.returnValue;
    var actualReturnValue = context.execCommand(commandName,
                                                Boolean(data.userInferface),
                                                data.value || '');
    if (expectedReturnValue == actualReturnValue) {
      testRunner.pass('execCommand return value');
    } else {
      testRunner.fail('execCommand return value', {
        actual: actualReturnValue,
        expected: expectedReturnValue,
      });
    }

    // Compare result HTML and selection
    var actualResult = testing.serialzieNode(
        context.selection.rootForTesting,
        {selection: context.endingSelection});
    var expectedResult = data.after;
    if (stripMarker(expectedResult) == stripMarker(actualResult)) {
      testRunner.pass('Result HTML');
      if (expectedResult != actualResult) {
        testRunner.warn('Result Selection', {
            format: 'html',
            before: pretty(data.before),
            actual: pretty(actualResult),
            expected: pretty(expectedResult)
        });
      }
    } else {
      testRunner.fail('Result HTML', {
        format: 'html',
        before: pretty(data.before),
        actual: pretty(actualResult),
        expected: pretty(expectedResult)
      });
    }

    // Compare result with browser's result.
    var actualResult2 = testing.serialzieNode(
        context.selection.rootForTesting, {
        selection: context.endingSelection,
        visbleTestNode: true
    });

    var sampleContext = context.sampleContext_;
    var sampleReturnValue = sampleContext.execCommand(
        commandName, Boolean(data.userInferface), data.value || '');
    if (actualReturnValue != sampleReturnValue) {
      testRunner.record('incompatible', {
          actual: sampleReturnValue,
          expected: actualReturnValue
      });
    }

    var sampleResult = context.sampleContext_.getResult();
    if (sampleResult == actualResult2) {
      testRunner.record('compatible');
      return;
    }
    if (stripMarker(sampleResult) == stripMarker(actualResult2)) {
      testRunner.record('selection', {
        format: 'html',
        before: pretty(data.before),
        actual: pretty(sampleResult),
        expected: pretty(actualResult2)
      });
      return;
    }
    testRunner.record('incompatible', {
        format: 'html',
        before: pretty(data.before),
        actual: pretty(sampleResult),
        expected: pretty(actualResult2)
    });
  });
}
