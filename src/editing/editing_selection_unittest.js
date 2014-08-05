// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

testCase('EditingSelection.splitTextCaret', function() {
  var context = testing.createTree('ab|cd');
  var selection = context.selection;
  expectTrue(function() { return selection.isCaret; });
  expectFalse(function() { return selection.isEmpty; });
  expectFalse(function() { return selection.isRange; });
  expectEq('cd', function() { return selection.anchorNode.nodeValue; });
  expectEq(0, function() { return selection.anchorOffset; });
  expectEq('cd', function() { return selection.focusNode.nodeValue; });
  expectEq(0, function() { return selection.focusOffset; });
});

testCase('EditingSelection.splitTextCaretInTree', function() {
  var context = testing.createTree('<p contenteditable><b>bold_1<i>italic_1<s>strike_1|strike_2</s>italic_2</i>bold_2</b></p>');
  var selection = context.selection;
  expectTrue(function() { return selection.isCaret; });
  expectFalse(function() { return selection.isEmpty; });
  expectFalse(function() { return selection.isRange; });
  expectEq('strike_2', function() { return selection.anchorNode.nodeValue; });
  expectEq(0, function() { return selection.anchorOffset, 0; });
  expectEq('strike_2', function() { return selection.focusNode.nodeValue; });
  expectEq(0, function() { return selection.focusOffset, 0; });
});

testCase('EditingSelection.splitTextAnchorFocus', function() {
  var context = testing.createTree('<p contenteditable>a^bc|d</p>');
  var selection = context.selection;
  expectFalse(function() { return selection.isCaret; });
  expectFalse(function() { return selection.isEmpty; });
  expectTrue(function() { return selection.isRange; });
  expectEq('bc', function() { return selection.anchorNode.nodeValue; });
  expectEq(0, function() { return selection.anchorOffset; });
  expectEq('bc', function() { return selection.focusNode.nodeValue; });
  expectEq(2, function() { return selection.focusOffset; });
});

testCase('EditingSelection.splitTextFocusAnchor', function() {
  var context = testing.createTree('<p contenteditable>a|bc^d</p>');
  var selection = context.selection;
  expectFalse(function() { return selection.isCaret; });
  expectFalse(function() { return selection.isEmpty; });
  expectTrue(function() { return selection.isRange; });
  expectEq('bc', function() { return selection.anchorNode.nodeValue; });
  expectEq(2, function() { return selection.anchorOffset, 2; });
  expectEq('bc', function() { return selection.focusNode.nodeValue; });
  expectEq(0, function() { return selection.focusOffset; });
});
