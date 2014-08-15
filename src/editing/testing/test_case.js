// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

function expectEq(expectedResult, testFunction, message) {
  var actualResult;
  try {
    actualResult = testFunction();
  } catch (exception) {
    actualResult = exception;
    // TODO(yosin) We throw |exception| for debugging. Once, debugging is done,
    // we should remove this.
    throw exception;
  }
  function equal() {
    if (typeof(expectedResult) != typeof(actualResult))
      return false;
    if (typeof(expectedResult) == 'object')
      return expectedResult === actualResult;
    return expectedResult == actualResult;
  }
  if (equal()) {
    testRunner.succeeded();
    return;
  }
  var logElement = testRunner.failed(message || testFunction);
  var listElement = document.createElement('ul');
  logElement.appendChild(listElement);
  ['Expected: ' + expectedResult, 'Actual__: ' + actualResult].forEach(
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
testFunction();
testRunner.endTest(name);
return;
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

  if (typeof(data.after) != 'string')
    throw new Error('You must specify before sample');
  if (typeof(data.before) != 'string')
    throw new Error('You must specify before sample');

  var testCaseName = commandName + '.' + testCaseId;
  testCase(testCaseName, function() {
    var context = testing.createSample(data.before);
    var expectedReturnValue = data.returnValue === undefined ?
        true : data.returnValue;
    expectEq(expectedReturnValue, function() {
      return testing.execCommand(context, commandName,
                                 Boolean(data.userInferface),
                                 data.value || '');
    });

    var actualResult = testing.serialzieNode(context.selection.rootForTesting,
                                             context.endingSelection);
    var expectedResult = data.after;
    if (expectedResult == actualResult) {
      testRunner.succeeded();
    } else {
      var logElement = testRunner.failed(testCaseName);
      var listElement = document.createElement('ul');
      logElement.appendChild(listElement);
      ['Expected:' + expectedResult, 'Actual__:' + actualResult].forEach(
        function(text) {
          var listItemElement = document.createElement('li');
          listItemElement.innerHTML = pretty(text);
          listElement.appendChild(listItemElement);
      });
      if (stripMarker(expectedResult) == stripMarker(actualResult))
        testRunner.succeeded(testCaseName);
      else
        testRunner.failed('Both result HTML and selection are different.');
    }

    var actualResult2 = testing.serialzieNode(context.selection.rootForTesting,
                                              context.endingSelection, true);
    var sample = context.sampleContext_.getResult();
    if (sample == actualResult2)
      return;
    if (sample != expectedResult) {
        if (stripMarker(sample) == stripMarker(expectedResult)) {
          testRunner.logHtml('<b class="red">' +
            'Cur and expected results are same.' +
            ' but selection is different.</b>');
        } else {
          testRunner.logHtml('<b class="green">' +
              'Cur and expected results are different.</b>');
        }
    }
    if (stripMarker(sample) == stripMarker(actualResult2))
        testRunner.logHtml('<b class="green">Cur and New results are same,' +
                           ' but selection is different.</b>');
    testRunner.logHtml('Src: ' + pretty(context.sampleHtmlText_));
    testRunner.logHtml('Cur: ' + pretty(sample));
    testRunner.logHtml('New: ' + pretty(actualResult2));
  });
}
