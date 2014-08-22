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
// computeEffectiveNodes
//
testCaseWithSample('nodes.computeEffectiveNodes.1',
    '<p contenteditable>foo<b>^bar<i>baz</i></b>|quux</p>',
    function(context, selection) {
      var nodes = editing.nodes.computeEffectiveNodes(selection);
      expectEq('B,bar,I,baz', function() { return dumpNodes(nodes) });
    });

testCaseWithSample('nodes.computeEffectiveNodes.2',
    '<p contenteditable><span style="font-weight: bold">^foo</span> <span>bar|</span></p>',
    function(context, selection) {
      var nodes = editing.nodes.computeEffectiveNodes(selection);
      expectEq('SPAN,foo, ,SPAN,bar', function() { return dumpNodes(nodes) });
    });

//
// ReadOnlySelection.nodes
//
testCaseWithSample('nodes.computeSelectedNodes.NodesText',
  '<p contenteditable>^abcd|</p>', function(context, selection) {
  var nodes = editing.nodes.computeSelectedNodes(selection);
  expectEq('abcd', function() { return dumpNodes(nodes); });
});

testCaseWithSample('nodes.computeSelectedNodes.NodesTextPartial',
  '<p contenteditable>ab^c|d</p>', function(context, selection) {
  var nodes = editing.nodes.computeSelectedNodes(selection);
  expectEq('c', function() { return dumpNodes(nodes); });
});

testCaseWithSample('nodes.computeSelectedNodes.NodesTree',
  '<p contenteditable><e1><e2>e2Before<e3>^e3</e3>e2After</e2>e1After|</e1></p>',
  function(context, selection) {
    var nodes = editing.nodes.computeSelectedNodes(selection);
    expectEq('e3,e2After,e1After', function() { return dumpNodes(nodes); });
  });

testCaseWithSample('nodes.computeSelectedNodes.NodesTree2',
  '<p contenteditable>^abcd<b>efg</b>|</p>', function(context, selection) {
  var nodes = editing.nodes.computeSelectedNodes(selection);
  expectEq('abcd,B,efg', function() { return dumpNodes(nodes); });
});

testCaseWithSample('nodes.computeSelectedNodes.NodesTree3',
  '<p contenteditable>ab^cd<b>efg</b>|</p>', function(context, selection) {
  var nodes = editing.nodes.computeSelectedNodes(selection);
  expectEq('cd,B,efg', function() { return dumpNodes(nodes); });
});

testCaseWithSample('nodes.computeSelectedNodes.NodesTree4',
  '<p contenteditable><e1><e2>e2Before<e3>^e3</e3>e2After</e2><e4>e4|</e4></e1></p>',
  function(context, selection) {
    var nodes = editing.nodes.computeSelectedNodes(selection);
    expectEq('e3,e2After,E4,e4', function() { return dumpNodes(nodes); });
  });

testCaseWithSample('nodes.computeSelectedNodes.Nodes.Tree.Empty',
  '<div contenteditable><span>foo^</span><span>|bar</span></div>',
  function(context, selection) {
    var nodes = editing.nodes.computeSelectedNodes(selection);
    expectEq('', function() { return dumpNodes(nodes); });
  });

testCaseWithSample('nodes.computeSelectedNodes.NodesTreeUL',
  '<div contenteditable>^<ul><li>one</li><li>two</li></ul>|</div>',
  function(context, selection) {
    var nodes = editing.nodes.computeSelectedNodes(selection);
    expectEq('UL,LI,one,LI,two', function() { return dumpNodes(nodes); });
  });

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
