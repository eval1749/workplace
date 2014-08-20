// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

//
// isEditable
//
testCase('nodes.isEditable', function() {
  var context = testing.createContext();
  var elementA = context.createElement('a');
  expectFalse(function () { return editing.nodes.isEditable(elementA); });

  var elementB = context.createElement('b');
  context.appendChild(elementA, elementB);
  context.setAttribute(elementA, 'contentEditable', 'true');
  expectTrue(function () { return editing.nodes.isContentEditable(elementA); });
  expectFalse(function () { return editing.nodes.isEditable(elementA); });
  expectTrue(function () { return editing.nodes.isEditable(elementB); });
});

//
// isInteractive
//
testCase('nodes.isInteractive', function() {
  var context = testing.createContext();
  var elementA = context.createElement('a');
  var elementB = context.createElement('b');
  expectTrue(function () { return editing.nodes.isInteractive(elementA); });
  expectFalse(function () { return editing.nodes.isInteractive(elementB); });
});

//
// isPhrasing
//
testCase('nodes.isPhrasing', function() {
  var context = testing.createContext();
  var elementA = context.createElement('a');
  var elementB = context.createElement('b');
  var elementDiv = context.createElement('div');
  var elementH1 = context.createElement('h1');
  expectTrue(function () { return editing.nodes.isPhrasing(elementA); });
  expectTrue(function () { return editing.nodes.isPhrasing(elementB); });
  expectFalse(function () { return editing.nodes.isPhrasing(elementDiv); });
  expectFalse(function () { return editing.nodes.isPhrasing(elementH1); });
});

//
// nodes.isWhitespaceNode
//
testCase('nodes.isWhitespaceNode', function() {
  var context = testing.createContext();
  var elementA = context.createElement('a');
  var textB = testing.createTextNode(context, 'b');
  var textC = testing.createTextNode(context, '  ');
  expectFalse(function () { return editing.nodes.isWhitespaceNode(elementA); });
  expectFalse(function () { return editing.nodes.isWhitespaceNode(textB); });
  expectTrue(function () { return editing.nodes.isWhitespaceNode(textC); });
});

//
// splitTree
//
testCase('nodes.splitTree.Shallow', function() {
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

testCase('nodes.splitTree.Deep', function() {
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
