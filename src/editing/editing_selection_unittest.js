// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

testCase('EditingSelection.splitTextCaret', function() {
  var context = testing.createTree('ab|cd');
  var selection = context.selection;
  expectTrue(selection.isCaret);
  expectFalse(selection.isEmpty);
  expectFalse(selection.isRange);
  expectEq('cd', selection.anchorNode.nodeValue);
  expectEq(0, selection.anchorOffset);
  expectEq('cd', selection.focusNode.nodeValue);
  expectEq(0, selection.focusOffset);
});

testCase('EditingSelection.splitTextCaretInTree', function() {
  var context = testing.createTree('<p contenteditable><b>bold_1<i>italic_1<s>strike_1|strike_2</s>italic_2</i>bold_2</b></p>');
  var selection = context.selection;
  expectTrue(selection.isCaret);
  expectFalse(selection.isEmpty);
  expectFalse(selection.isRange);
  expectEq('strike_2', selection.anchorNode.nodeValue);
  expectEq(0, selection.anchorOffset, 0);
  expectEq('strike_2', selection.focusNode.nodeValue);
  expectEq(0, selection.focusOffset, 0);
});

testCase('EditingSelection.splitTextAnchorFocus', function() {
  var context = testing.createTree('a^bc|d');
  var selection = context.selection;
  expectTrue(selection.isCaret);
  expectFalse(selection.isEmpty);
  expectFalse(selection.isRange);
  expectEq('bc', selection.anchorNode.nodeValue);
console.log('splitTextAnchorFocus', selection.anchorNode);
  expectEq(0, selection.anchorOffset);
  expectEq('d', selection.focusNode.nodeValue);
  expectEq(0, selection.focusOffset);
});

testCase('EditingSelection.splitTextFocusAnchor', function() {
  var context = testing.createTree('a|bc^d');
  var selection = context.selection;
  expectTrue(selection.isCaret);
  expectFalse(selection.isEmpty);
  expectFalse(selection.isRange);
  expectEq('bc', selection.anchorNode.nodeValue);
  expectEq(2, selection.anchorOffset, 2);
  expectEq('bc', selection.focusNode.nodeValue);
  expectEq(0, selection.focusOffset);
});
