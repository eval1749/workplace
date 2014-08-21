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
  testing.withSample('<p contenteditable>^abcd|</p>', function(selection) {
    expectEq(editing.SelectionDirection.ANCHOR_IS_START,
             function() { return selection.direction; });
  });
});

testCase('EditingSelection.directionFocusIsStart', function() {
  testing.withSample('<p contenteditable>|abcd^</p>', function(selection) {
    expectEq(editing.SelectionDirection.FOCUS_IS_START,
             function() { return selection.direction; });
  });
});

//
// EditingSelection.nodes
//
testCase('EditingSelection.NodesText', function() {
  testing.withSample('<p contenteditable>^abcd|</p>', function(selection) {
    var nodes = selection.nodes;
    expectEq('abcd', function() { return dumpNodes(nodes); });
  });
});

testCase('EditingSelection.NodesTextPartial', function() {
  testing.withSample('<p contenteditable>ab^c|d</p>', function(selection) {
    var nodes = selection.nodes;
    expectEq('c', function() { return dumpNodes(nodes); });
  });
});

testCase('EditingSelection.NodesTree', function() {
  testing.withSample('<p contenteditable><e1><e2>e2Before<e3>^e3</e3>e2After</e2>e1After|</e1></p>', function(selection) {
    var nodes = selection.nodes;
    expectEq('e3,e2After,e1After', function() { return dumpNodes(nodes); });
  });
});

testCase('EditingSelection.NodesTree2', function() {
  testing.withSample('<p contenteditable>^abcd<b>efg</b>|</p>', function(selection) {
    var nodes = selection.nodes;
    expectEq('abcd,B,efg', function() { return dumpNodes(nodes); });
  });
});

testCase('EditingSelection.NodesTree3', function() {
  testing.withSample('<p contenteditable>ab^cd<b>efg</b>|</p>', function(selection) {
    var nodes = selection.nodes;
    expectEq('cd,B,efg', function() { return dumpNodes(nodes); });
  });
});

testCase('EditingSelection.NodesTree4', function() {
  testing.withSample('<p contenteditable><e1><e2>e2Before<e3>^e3</e3>e2After</e2><e4>e4|</e4></e1></p>', function(selection) {
    var nodes = selection.nodes;
    expectEq('e3,e2After,E4,e4', function() { return dumpNodes(nodes); });
  });
});

testCase('EditingSelection.Nodes.Tree.Empty', function() {
  testing.withSample('<div contenteditable><span>foo^</span><span>|bar</span></div>', function(selection) {
    var nodes = selection.nodes;
    expectEq('', function() { return dumpNodes(nodes); });
  });
});

testCase('EditingSelection.NodesTreeUL', function() {
  testing.withSample('<div contenteditable>^<ul><li>one</li><li>two</li></ul>|</div>', function(selection) {
    var nodes = selection.nodes;
    expectEq('UL,LI,one,LI,two', function() { return dumpNodes(nodes); });
  });
});


//
// constructor splitText
//
testCase('EditingSelection.splitTextCaret', function() {
  testing.withSample('<p contenteditable>ab|cd</p>', function(selection) {
    expectTrue(function() { return selection.isCaret; });
    expectFalse(function() { return selection.isEmpty; });
    expectFalse(function() { return selection.isRange; });
    expectEq('cd', function() { return selection.anchorNode.nodeValue; });
    expectEq(0, function() { return selection.anchorOffset; });
    expectEq('cd', function() { return selection.focusNode.nodeValue; });
    expectEq(0, function() { return selection.focusOffset; });
  });
});

testCase('EditingSelection.splitTextCaretInTree', function() {
  testing.withSample('<p contenteditable><b>bold_1<i>italic_1<s>strike_1|strike_2</s>italic_2</i>bold_2</b></p>', function(selection) {
    expectTrue(function() { return selection.isCaret; });
    expectFalse(function() { return selection.isEmpty; });
    expectFalse(function() { return selection.isRange; });
    expectEq('strike_2', function() { return selection.anchorNode.nodeValue; });
    expectEq(0, function() { return selection.anchorOffset; });
    expectEq('strike_2', function() { return selection.focusNode.nodeValue; });
    expectEq(0, function() { return selection.focusOffset; });
  });
});

testCase('EditingSelection.splitTextAnchorFocus', function() {
  testing.withSample('<p contenteditable>a^bc|d</p>', function(selection) {
    expectFalse(function() { return selection.isCaret; });
    expectFalse(function() { return selection.isEmpty; });
    expectTrue(function() { return selection.isRange; });
    expectEq('P', function() { return selection.anchorNode.nodeName; });
    expectEq(1, function() { return selection.anchorOffset; });
    expectEq('P', function() { return selection.focusNode.nodeName; });
    expectEq(2, function() { return selection.focusOffset; });
  });
});

testCase('EditingSelection.splitTextFocusAnchor', function() {
  testing.withSample('<p contenteditable>a|bc^d</p>', function(selection) {
    expectFalse(function() { return selection.isCaret; });
    expectFalse(function() { return selection.isEmpty; });
    expectTrue(function() { return selection.isRange; });
    expectEq('P', function() { return selection.anchorNode.nodeName; });
    expectEq(2, function() { return selection.anchorOffset, 2; });
    expectEq('P', function() { return selection.focusNode.nodeName; });
    expectEq(1, function() { return selection.focusOffset; });
  });
});
