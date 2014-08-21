// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

function dumpNodes(nodes) {
  var sink = ''
  var delimiter = '';
  nodes.forEach(function(node) {
    if (editing.nodes.isText(node))
      sink += delimiter + node.nodeValue;
    else
      sink += delimiter + node.nodeName;
    delimiter = ',';
  });
  return sink;
}

//
// EditingSelection.direction
//
testCaseWithSample('EditingSelection.directionAnchorIsStart',
  '<p contenteditable>^abcd|</p>', function(selection) {
  expectEq(editing.SelectionDirection.ANCHOR_IS_START, function() {
    return selection.direction; });
});

testCaseWithSample('EditingSelection.directionFocusIsStart',
  '<p contenteditable>|abcd^</p>', function(selection) {
  expectEq(editing.SelectionDirection.FOCUS_IS_START, function() {
    return selection.direction; });
});

//
// EditingSelection.nodes
//
testCaseWithSample('EditingSelection.NodesText',
  '<p contenteditable>^abcd|</p>', function(selection) {
  var nodes = selection.nodes;
  expectEq('abcd', function() { return dumpNodes(nodes); });
});

testCaseWithSample('EditingSelection.NodesTextPartial',
  '<p contenteditable>ab^c|d</p>', function(selection) {
  var nodes = selection.nodes;
  expectEq('c', function() { return dumpNodes(nodes); });
});

testCaseWithSample('EditingSelection.NodesTree',
  '<p contenteditable><e1><e2>e2Before<e3>^e3</e3>e2After</e2>e1After|</e1></p>',
  function(selection) {
    var nodes = selection.nodes;
    expectEq('e3,e2After,e1After', function() { return dumpNodes(nodes); });
  });

testCaseWithSample('EditingSelection.NodesTree2',
  '<p contenteditable>^abcd<b>efg</b>|</p>', function(selection) {
  var nodes = selection.nodes;
  expectEq('abcd,B,efg', function() { return dumpNodes(nodes); });
});

testCaseWithSample('EditingSelection.NodesTree3',
  '<p contenteditable>ab^cd<b>efg</b>|</p>', function(selection) {
  var nodes = selection.nodes;
  expectEq('cd,B,efg', function() { return dumpNodes(nodes); });
});

testCaseWithSample('EditingSelection.NodesTree4',
  '<p contenteditable><e1><e2>e2Before<e3>^e3</e3>e2After</e2><e4>e4|</e4></e1></p>',
  function(selection) {
    var nodes = selection.nodes;
    expectEq('e3,e2After,E4,e4', function() { return dumpNodes(nodes); });
  });

testCaseWithSample('EditingSelection.Nodes.Tree.Empty',
  '<div contenteditable><span>foo^</span><span>|bar</span></div>',
  function(selection) {
    var nodes = selection.nodes;
    expectEq('', function() { return dumpNodes(nodes); });
  });

testCaseWithSample('EditingSelection.NodesTreeUL',
  '<div contenteditable>^<ul><li>one</li><li>two</li></ul>|</div>',
  function(selection) {
    var nodes = selection.nodes;
    expectEq('UL,LI,one,LI,two', function() { return dumpNodes(nodes); });
  });

//
// constructor splitText
//
testCaseWithSample('EditingSelection.splitTextCaret',
  '<p contenteditable>ab|cd</p>', function(selection) {
  expectTrue(function() { return selection.isCaret; });
  expectFalse(function() { return selection.isEmpty; });
  expectFalse(function() { return selection.isRange; });
  expectEq('P', function() { return selection.anchorNode.nodeName; });
  expectEq(1, function() { return selection.anchorOffset; });
  expectEq('P', function() { return selection.focusNode.nodeName; });
  expectEq(1, function() { return selection.focusOffset; });
});

testCaseWithSample('EditingSelection.splitTextCaretInTree',
  '<p contenteditable><b>bold_1<i>italic_1<s>strike_1|strike_2</s>italic_2</i>bold_2</b></p>',
  function(selection) {
    expectTrue(function() { return selection.isCaret; });
    expectFalse(function() { return selection.isEmpty; });
    expectFalse(function() { return selection.isRange; });
    expectEq('S', function() { return selection.anchorNode.nodeName; });
    expectEq(1, function() { return selection.anchorOffset; });
    expectEq('S', function() { return selection.focusNode.nodeName; });
    expectEq(1, function() { return selection.focusOffset; });
  });

testCaseWithSample('EditingSelection.splitTextAnchorFocus',
  '<p contenteditable>a^bc|d</p>', function(selection) {
    expectFalse(function() { return selection.isCaret; });
    expectFalse(function() { return selection.isEmpty; });
    expectTrue(function() { return selection.isRange; });
    expectEq('P', function() { return selection.anchorNode.nodeName; });
    expectEq(1, function() { return selection.anchorOffset; });
    expectEq('P', function() { return selection.focusNode.nodeName; });
    expectEq(2, function() { return selection.focusOffset; });
  });

testCaseWithSample('EditingSelection.splitTextFocusAnchor',
  '<p contenteditable>a|bc^d</p>', function(selection) {
    expectFalse(function() { return selection.isCaret; });
    expectFalse(function() { return selection.isEmpty; });
    expectTrue(function() { return selection.isRange; });
    expectEq('P', function() { return selection.anchorNode.nodeName; });
    expectEq(2, function() { return selection.anchorOffset; });
    expectEq('P', function() { return selection.focusNode.nodeName; });
    expectEq(1, function() { return selection.focusOffset; });
  });
