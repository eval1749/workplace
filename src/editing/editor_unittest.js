// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

//
// splitTree
//
testCase('Editor.splitTree.Shallow', function() {
  var context = testing.createTree('<p contenteditable><e1>one</e1>|<e2>two</e2><e3>three</e3></p>');
  var editor = context.editor;
  var selection = context.selection;
  var refNode = selection.focusNode.childNodes[selection.focusOffset];
  var oldTree = refNode.parentNode;
  var newTree = context.splitTree(oldTree, refNode);
  expectEq('<p contenteditable><e1>one</e1></p>',
           function() { return testing.serialzieNode(oldTree); });
  expectEq('<p contenteditable><e2>two</e2><e3>three</e3></p>',
          function() { return testing.serialzieNode(newTree); });
});

testCase('Editor.splitTree.Deep', function() {
  var context = testing.createTree('<p contenteditable><b>bold_1<i>italic_1<s>strike_1|strike_2</s>italic_2</i>bold_2</b></p>');
  var editor = context.editor;
  var selection = context.selection;
  var refNode = selection.focusNode.childNodes[selection.focusOffset];
  var oldTree = refNode.parentNode.parentNode.parentNode;
  var newTree = context.splitTree(oldTree, refNode);
  expectEq('<b>bold_1<i>italic_1<s>strike_1</s></i></b>',
           function() { return testing.serialzieNode(oldTree); });
  expectEq('<b><i><s>strike_2</s>italic_2</i>bold_2</b>',
           function() { return testing.serialzieNode(newTree); });
});
