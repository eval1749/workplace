// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

testing.define('serialzieNode', (function() {
  /**
   * @param {!Node} node
   * @param {Object=} opt_options
   *    selection: editing.ReadOnlySelection
   *    visibleTextNode: boolean
   * @return {string}
   */
  function serialzieNode(node, opt_options) {
    //console.assert(node instanceof Node);
    /** @const */ var options = arguments.length >= 2 ?
        /** @type {Object} */(opt_options) : {};
    /** @const */ var selection = options.selection || null;
    /** @const */ var visibleTextNode = Boolean(options.visibleTextNode);

    function marker(node, offset) {
      if (!selection)
        return '';
      if (selection.focusNode === node && selection.focusOffset == offset)
        return '|';
      if (selection.anchorNode === node && selection.anchorOffset == offset)
        return '^';
      return '';
    }

    function orderByAttributeName(attrNode1, attrNode2) {
      return attrNode1.name.localeCompare(attrNode2.name);
    }

    function visit(node) {
      if (editing.nodes.isText(node)) {
        var text = node.nodeValue;
        if (!selection)
          return text;
        if (selection.anchorNode === node && selection.focusNode === node) {
          var start = selection.startOffset;
          var end = selection.endOffset;
          var anchorIsStart = selection.anchorOffset < selection.focusOffset;
          var startMarker = anchorIsStart ? '^' : '|';
          var endMarker = anchorIsStart ? '|' : '^';
          if (start == end)
            return text.substr(0, start) + '|' + text.substr(start);
          return text.substr(0, start) + startMarker +
                 text.substring(start, end) + endMarker + text.substr(end);
        }
        if (selection.focusNode === node) {
          return text.substr(0, selection.focusOffset) + '|' +
                 text.substr(selection.focusOffset);
        }
        if (selection.anchorNode === node) {
          return text.substr(0, selection.anchorOffset) + '^' +
                 text.substr(selection.anchorOffset);
        }
        return text;
      }
      if (!editing.nodes.isElement(node)) {
        // To support |Document| node, we iterate over child nodes.
        var sink = '';
        for (var child = node.firstChild; child; child = child.nextSibling) {
          sink += visit(child);
        }
        return sink.length ? sink : node.nodeValue;
      }
      var tagName = node.nodeName.toLowerCase();
      var sink = '<' + tagName;
      [].slice.call(node.attributes).sort(orderByAttributeName).forEach(
        function(attrNode) {
          var attrName = attrNode.name;
          var attrValue = attrNode.value;
          if (attrValue){
            // IE11 append ";" for end of CSS property list.
            if (attrName == 'style')
              attrValue = attrValue.replace(/;$/, '');
            attrValue = attrValue.replace(/&/g, '&amp;')
                .replace(/\u0022/g, '&quot;');
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
        var nextSibling = child.nextSibling;
        if (visibleTextNode && editing.nodes.isText(child) && nextSibling &&
            editing.nodes.isText(nextSibling)) {
            sink += '_';
        }
        child = nextSibling;
        ++offset;
      }
      sink += marker(node, offset);
      if (!testing.END_TAG_OMISSIBLE.has(tagName))
        sink += '</' + tagName + '>';
      return sink;
    };
    return visit(node);
  }

  return serialzieNode;
})());

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

function testCaseWithSample(name, htmlText, testFunction) {
  testCase(name, function() {
    var sample = new testing.Sample(htmlText || '^foo|');
    var editor = editing.getOrCreateEditor(sample.document);
    var context = editor.createContext('noname', sample.startingSelection);
    if (!(context.startingSelection instanceof editing.ReadOnlySelection))
      throw new Error('No startingSelection');
    if (testRunner.useTryCatch) {
      try {
        testFunction(context, context.startingSelection);
      } finally {
        sample.finish();
      }
    } else {
      testFunction(context, context.startingSelection);
      sample.finish();
    }
  });
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
    var sample = new testing.Sample(data.before);
    var sample2 = new testing.Sample(data.before);
    try {
      var editor = editing.getOrCreateEditor(sample.document);
      editor.setDomSelection(sample.startingSelection);

      // Execute command and check return value
      var expectedReturnValue = data.returnValue === undefined ?
          true : data.returnValue;
      var actualReturnValue = editor.execCommand(commandName,
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
          editor.document.body.firstChild,
          {selection: editor.selection});
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
      var checkCompatiblity = function() {
        var actualResult2 = testing.serialzieNode(
          editor.document.body.firstChild, {
            selection: editor.selection,
            visibleTextNode: false
        });

        var sampleReturnValue = sample2.execCommand(
            commandName, Boolean(data.userInferface), data.value || '');
        if (actualReturnValue != sampleReturnValue) {
          testRunner.record('incompatible_return', {
              actual: sampleReturnValue,
              expected: actualReturnValue
          });
        }

        var sampleResult = testing.serialzieNode(
          sample2.document.body.firstChild, {
            selection: sample2.endingSelection,
            visibleTextNode: false
        });
        if (sampleResult == actualResult2) {
          testRunner.record('compatible');
          testRunner.record('compatible_html');
          return;
        }
        if (stripMarker(sampleResult) == stripMarker(actualResult2)) {
          testRunner.record('compatible_html');
          testRunner.record('incompatible_selection', {
            format: 'html',
            before: pretty(data.before),
            current: pretty(sampleResult),
            new: pretty(actualResult2)
          });
          return;
        }
        testRunner.record('incompatible_html', {
            format: 'html',
            before: pretty(data.before),
            current: pretty(sampleResult),
            new: pretty(actualResult2)
        });
      }
      checkCompatiblity();

      // Undo
      var checkUndo = function() {
        editor.execCommand('undo');
        var undoResult = testing.serialzieNode(
            editor.document.body.firstChild,
            {selection: editor.selection});
        if (undoResult == data.before) {
          testRunner.pass('undo');
        } else if (stripMarker(undoResult) == stripMarker(data.before)) {
          testRunner.warn('undo_selection', {
            format: 'html',
            before: pretty(data.before),
            current: pretty(sampleResult),
            new: pretty(actualResult2)
          });
          return;
        } else {
          testRunner.fail('undo', {
            format: 'html',
            before: pretty(actualResult),
            actual: pretty(undoResult),
            expected: pretty(data.before)
          });
        }
      };
      if (testRunner.useTryCatch) {
        try {
          checkUndo();
        } catch (exception) {
          testRunner.fail('undo', {exception: exception})
        }
      } else {
        checkUndo();
      }

      // Redo
      var checkRedo = function() {
        editor.execCommand('redo');
        var redoResult = testing.serialzieNode(
            editor.document.body.firstChild,
            {selection: editor.selection});
        if (redoResult == actualResult) {
          testRunner.pass('redo');
        } else if (stripMarker(redoResult) == stripMarker(actualResult)) {
          testRunner.warn('redo_selection', {
            format: 'html',
            before: pretty(data.before),
            actual: pretty(redoResult),
            expected: pretty(actualResult)
          });
        } else {
          testRunner.fail('redo', {
            format: 'html',
            before: pretty(data.before),
            actual: pretty(redoResult),
            expected: pretty(actualResult)
          });
        }
      };
      if (testRunner.useTryCatch) {
        try {
          checkRedo();
        } catch (exception) {
          testRunner.fail('redo', {exception: exception})
        }
      } else {
        checkRedo();
      }
    } finally {
      sample.finish();
      sample2.finish();
    }
  });
}
