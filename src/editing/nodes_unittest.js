// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

//
// isEditable
//
testCaseWithSample('nodes.isEditable', '', function(context, selection) {
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
testCaseWithSample('nodes.isInteractive', '', function(context, selection) {
  var elementA = context.createElement('a');
  var elementB = context.createElement('b');
  expectTrue(function () { return editing.nodes.isInteractive(elementA); });
  expectFalse(function () { return editing.nodes.isInteractive(elementB); });
});

//
// isPhrasing
//
testCaseWithSample('nodes.isPhrasing', '', function(context, selection) {
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
testCaseWithSample('nodes.isWhitespaceNode', '', function(context, selection) {
  var elementA = context.createElement('a');
  var textB = context.createTextNode('b');
  var textC = context.createTextNode('  ');
  expectFalse(function () { return editing.nodes.isWhitespaceNode(elementA); });
  expectFalse(function () { return editing.nodes.isWhitespaceNode(textB); });
  expectTrue(function () { return editing.nodes.isWhitespaceNode(textC); });
});

//
// splitTree
//
testCaseWithSample('nodes.splitTree.Shallow',
    '<p contenteditable><e1>one</e1>|<e2>two</e2><e3>three</e3></p>',
    function(context, selection) {
          var refNode = selection.focusNode.childNodes[selection.focusOffset];
      var oldTree = refNode.parentNode;
      var newTree = context.splitTree(oldTree, refNode);
      expectEq('<p contenteditable><e1>one</e1></p>',
               function() { return testing.serialzieNode(oldTree); });
      expectEq('<p contenteditable><e2>two</e2><e3>three</e3></p>',
              function() { return testing.serialzieNode(newTree); });
    });

testCaseWithSample('nodes.splitTree.Deep',
    '<p contenteditable><b>bold1<i>italic1<s>strike1|strike2</s>italic2</i>bold2</b></p>',
    function(context, selection) {
          var refNode = selection.focusNode.childNodes[selection.focusOffset];
      var oldTree = refNode.parentNode.parentNode.parentNode;
      var newTree = context.splitTree(oldTree, refNode);
      expectEq('<b>bold1<i>italic1<s>strike1</s></i></b>',
               function() { return testing.serialzieNode(oldTree); });
      expectEq('<b><i><s>strike2</s>italic2</i>bold2</b>',
               function() { return testing.serialzieNode(newTree); });
    });
