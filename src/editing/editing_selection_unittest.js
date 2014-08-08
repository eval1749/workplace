// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

function dumpNodes(nodes) {
  var sink = ''
  var delimiter = '';
  nodes.forEach(function(node) {
    sink += delimiter + (node.nodeValue || node.nodeName);
    delimiter = ',';
  });
  return sink;
}

//
// EditingSelection.direction
//
testCase('EditingSelection.directionAnchorIsStart', function() {
  var context = testing.createTree('<p contenteditable>^abcd|</p>');
  var selection = context.selection;
  expectEq(editing.SelectionDirection.ANCHOR_IS_START,
           function() { return selection.direction; });
});

testCase('EditingSelection.directionFocusIsStart', function() {
  var context = testing.createTree('<p contenteditable>|abcd^</p>');
  var selection = context.selection;
  expectEq(editing.SelectionDirection.FOCUS_IS_START,
           function() { return selection.direction; });
});

//
// EditingSelection.nodes
//
testCase('EditingSelection.NodesText', function() {
  var context = testing.createTree('<p contenteditable>^abcd|</p>');
  var selection = context.selection;
  var nodes = selection.nodes;
  expectEq('abcd', function() { return dumpNodes(nodes); });
});

testCase('EditingSelection.NodesTextPartial', function() {
  var context = testing.createTree('<p contenteditable>ab^c|d</p>');
  var selection = context.selection;
  var nodes = selection.nodes;
  expectEq('c', function() { return dumpNodes(nodes); });
});

testCase('EditingSelection.NodesTree', function() {
  var context = testing.createTree('<p contenteditable><e1><e2>e2Before<e3>^e3</e3>e2After</e2>e1After|</e1></p>');
  var selection = context.selection;
  var nodes = selection.nodes;
  expectEq('e3,e2After,e1After', function() { return dumpNodes(nodes); });
});

testCase('EditingSelection.NodesTree2', function() {
  var context = testing.createTree('<p contenteditable>^abcd<b>efg</b>|</p>');
  var selection = context.selection;
  var nodes = selection.nodes;
  expectEq('abcd,B,efg', function() { return dumpNodes(nodes); });
});

testCase('EditingSelection.NodesTree3', function() {
  var context = testing.createTree('<p contenteditable>ab^cd<b>efg</b>|</p>');
  var selection = context.selection;
  var nodes = selection.nodes;
  expectEq('cd,B,efg', function() { return dumpNodes(nodes); });
});

testCase('EditingSelection.NodesTree4', function() {
  var context = testing.createTree('<p contenteditable><e1><e2>e2Before<e3>^e3</e3>e2After</e2><e4>e4|</e4></e1></p>');
  var selection = context.selection;
  var nodes = selection.nodes;
  expectEq('e3,e2After,E4,e4', function() { return dumpNodes(nodes); });
});

testCase('EditingSelection.NodesTreeUL', function() {
  var context = testing.createTree('<div contenteditable>^<ul><li>one</li><li>two</li></ul>|</div>');
  var selection = context.selection;
  var nodes = selection.nodes;
  expectEq('UL,LI,one,LI,two', function() { return dumpNodes(nodes); });
});


//
// constructor splitText
//
testCase('EditingSelection.splitTextCaret', function() {
  var context = testing.createTree('<p contenteditable>ab|cd</p>');
  var selection = context.selection;
  expectTrue(function() { return selection.isCaret; });
  expectFalse(function() { return selection.isEmpty; });
  expectFalse(function() { return selection.isRange; });
  expectEq('P', function() { return selection.anchorNode.nodeName; });
  expectEq(1, function() { return selection.anchorOffset; });
  expectEq('P', function() { return selection.focusNode.nodeName; });
  expectEq(1, function() { return selection.focusOffset; });
});

testCase('EditingSelection.splitTextCaretInTree', function() {
  var context = testing.createTree('<p contenteditable><b>bold_1<i>italic_1<s>strike_1|strike_2</s>italic_2</i>bold_2</b></p>');
  var selection = context.selection;
  expectTrue(function() { return selection.isCaret; });
  expectFalse(function() { return selection.isEmpty; });
  expectFalse(function() { return selection.isRange; });
  expectEq('S', function() { return selection.anchorNode.nodeName; });
  expectEq(1, function() { return selection.anchorOffset; });
  expectEq('S', function() { return selection.focusNode.nodeName; });
  expectEq(1, function() { return selection.focusOffset; });
});

testCase('EditingSelection.splitTextAnchorFocus', function() {
  var context = testing.createTree('<p contenteditable>a^bc|d</p>');
  var selection = context.selection;
  expectFalse(function() { return selection.isCaret; });
  expectFalse(function() { return selection.isEmpty; });
  expectTrue(function() { return selection.isRange; });
  expectEq('P', function() { return selection.anchorNode.nodeName; });
  expectEq(1, function() { return selection.anchorOffset; });
  expectEq('P', function() { return selection.focusNode.nodeName; });
  expectEq(2, function() { return selection.focusOffset; });
});

testCase('EditingSelection.splitTextFocusAnchor', function() {
  var context = testing.createTree('<p contenteditable>a|bc^d</p>');
  var selection = context.selection;
  expectFalse(function() { return selection.isCaret; });
  expectFalse(function() { return selection.isEmpty; });
  expectTrue(function() { return selection.isRange; });
  expectEq('P', function() { return selection.anchorNode.nodeName; });
  expectEq(2, function() { return selection.anchorOffset, 2; });
  expectEq('P', function() { return selection.focusNode.nodeName; });
  expectEq(1, function() { return selection.focusOffset; });
});
