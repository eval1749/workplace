// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

testCase('EditingNode.appendChild', function() {
  var context = testing.createContext();
  var element1 = testing.createElement(context, 'e1');
  var element2 = testing.createElement(context, 'e2');
  element1.appendChild(element2);

  expectEq(element2, function() { return element1.firstChild; });
  expectEq(element2, function() { return element1.lastChild; });
  expectEq(1, function() { return element1.childNodes.length; });
  expectEq(element2, function() { return element1.childNodes[0]; });
  expectEq(element1, function() { return element2.parentNode; });
  expectNull(function() { return element2.previousSibling; });
  expectNull(function() { return element2.nextSibling; });
});

testCase('EditingNode.insertBeforeNull', function() {
  var context = testing.createContext();
  var element1 = testing.createElement(context, 'e1');
  var element2 = testing.createElement(context, 'e2');
  element1.insertBefore(element2, null);

  expectEq(element2, function() { return element1.firstChild; });
  expectEq(element2, function() { return element1.lastChild; });
  expectEq(1, function() { return element1.childNodes.length; });
  expectEq(element2, function() { return element1.childNodes[0]; });
  expectEq(element1, function() { return element2.parentNode; });
  expectNull(function() { return element2.previousSibling; });
  expectNull(function() { return element2.nextSibling; });
});

testCase('EditingNode.insertBeforeToFirst', function() {
  var context = testing.createContext();
  var element1 = testing.createElement(context, 'e1');
  var element2 = testing.createElement(context, 'e2');
  var element3 = testing.createElement(context, 'e3');
  element1.appendChild(element3);
  element1.insertBefore(element2, element3);

  expectEq(element2, function() { return element1.firstChild; });
  expectEq(element3, function() { return element1.lastChild; });

  expectEq(element1, function() { return element2.parentNode; });
  expectEq(element3, function() { return element2.nextSibling; });
  expectNull(function() { return element2.previousSibling; });

  expectEq(element1, function() { return element3.parentNode; });
  expectNull(function() { return element3.nextSibling; });
  expectEq(element2, function() { return element3.previousSibling; });
});

testCase('EditingNode.insertBeforeToSecond', function() {
  var context = testing.createContext();
  var element1 = testing.createElement(context, 'e1');
  var element2 = testing.createElement(context, 'e2');
  var element3 = testing.createElement(context, 'e3');
  var element4 = testing.createElement(context, 'e4');
  element1.appendChild(element2);
  element1.appendChild(element3);
  element1.insertBefore(element4, element3);

  expectEq(element2, function() { return element1.firstChild; });
  expectEq(element3, function() { return element1.lastChild; });

  expectEq(element1, function() { return element4.parentNode; });
  expectEq(element3, function() { return element4.nextSibling; });
  expectEq(element2, function() { return element4.previousSibling; });

  expectEq(element4, function() { return element2.nextSibling; });
  expectEq(element4, function() { return element3.previousSibling; });
});

//
// isInteractive
//
testCase('EditingNode.isInteractive', function() {
  var context = testing.createContext();
  var elementA = testing.createElement(context, 'a');
  var elementB = testing.createElement(context, 'b');
  expectTrue(function () { return elementA.isInteractive; });
  expectFalse(function () { return elementB.isInteractive; });
});

//
// isPhrasing
//
testCase('EditingNode.isPhrasing', function() {
  var context = testing.createContext();
  var elementA = testing.createElement(context, 'a');
  var elementB = testing.createElement(context, 'b');
  var elementDiv = testing.createElement(context, 'div');
  var elementH1 = testing.createElement(context, 'h1');
  expectTrue(function () { return elementA.isPhrasing; });
  expectTrue(function () { return elementB.isPhrasing; });
  expectFalse(function () { return elementDiv.isPhrasing; });
  expectFalse(function () { return elementH1.isPhrasing; });
});

//
// removeChild
//
testCase('EditingNode.removeChildFirstChild', function() {
  var context = testing.createContext();
  var element1 = testing.createElement(context, 'e1');
  var element2 = testing.createElement(context, 'e2');
  var element3 = testing.createElement(context, 'e3');
  var element4 = testing.createElement(context, 'e4');
  element1.appendChild(element2);
  element1.appendChild(element3);
  element1.appendChild(element4);

  element1.removeChild(element2);

  expectEq(element3, function() { return element1.firstChild; });
  expectEq(element4, function() { return element1.lastChild; });
  expectEq(2, function() { return element1.childNodes.length; });

  expectEq(element4, function() { return element3.nextSibling; });
  expectEq(element3, function() { return element4.previousSibling; });

  expectNull(function() { return element2.nextSibling; });
  expectNull(function() { return element2.parentNode; });
  expectNull(function() { return element2.previousSibling; });
});

testCase('EditingNode.removeChildSecondChild', function() {
  var context = testing.createContext();
  var element1 = testing.createElement(context, 'e1');
  var element2 = testing.createElement(context, 'e2');
  var element3 = testing.createElement(context, 'e3');
  var element4 = testing.createElement(context, 'e4');
  element1.appendChild(element2);
  element1.appendChild(element3);
  element1.appendChild(element4);

  element1.removeChild(element3);

  expectEq(element2, function() { return element1.firstChild; });
  expectEq(element4, function() { return element1.lastChild; });
  expectEq(2, function() { return element1.childNodes.length; });

  expectEq(element4, function() { return element2.nextSibling; });
  expectEq(element2, function() { return element4.previousSibling; });

  expectNull(function() { return element3.nextSibling; });
  expectNull(function() { return element3.parentNode; });
  expectNull(function() { return element3.previousSibling; });
});

testCase('EditingNode.removeChildLastChild', function() {
  var context = testing.createContext();
  var element1 = testing.createElement(context, 'e1');
  var element2 = testing.createElement(context, 'e2');
  var element3 = testing.createElement(context, 'e3');
  var element4 = testing.createElement(context, 'e4');
  element1.appendChild(element2);
  element1.appendChild(element3);
  element1.appendChild(element4);
  element1.removeChild(element4);

  expectEq(element2, function() { return element1.firstChild; });
  expectEq(element3, function() { return element1.lastChild; });
  expectEq(2, function() { return element1.childNodes.length; });

  expectEq(element3, function() { return element2.nextSibling; });
  expectEq(element2, function() { return element3.previousSibling; });

  expectNull(function() { return element4.nextSibling; });
  expectNull(function() { return element4.parentNode; });
  expectNull(function() { return element4.previousSibling; });
});

//
// replaceChild
//
testCase('EditingNode.replaceChildFirstChildByNew', function() {
  var context = testing.createContext();
  var element1 = testing.createElement(context, 'e1');
  var element2 = testing.createElement(context, 'e2');
  var element3 = testing.createElement(context, 'e3');
  element1.appendChild(element2);
  element1.replaceChild(element3, element2);

  expectEq(element3, function() { return element1.firstChild; });
  expectEq(element3, function() { return element1.lastChild; });

  expectNull(function() { return element2.parentNode; });
  expectNull(function() { return element2.nextSibling; });
  expectNull(function() { return element2.previousSibling; });

  expectEq(element1, function() { return element3.parentNode; });
  expectNull(function() { return element3.nextSibling; });
  expectNull(function() { return element3.previousSibling; });
});

testCase('EditingNode.replaceChildLastChildByNew', function() {
  var context = testing.createContext();
  var element1 = testing.createElement(context, 'e1');
  var element2 = testing.createElement(context, 'e2');
  var element3 = testing.createElement(context, 'e3');
  var element4 = testing.createElement(context, 'e4');
  element1.appendChild(element2);
  element1.appendChild(element3);
  element1.replaceChild(element4, element3);

  expectEq(element2, function() { return element1.firstChild; });
  expectEq(element4, function() { return element1.lastChild; });

  expectEq(element1, function() { return element2.parentNode; });
  expectEq(element4, function() { return element2.nextSibling; });
  expectNull(function() { return element2.previousSibling; });

  expectNull(function() { return element3.parentNode; });
  expectNull(function() { return element3.nextSibling; });
  expectNull(function() { return element3.previousSibling; });

  expectEq(element1, function() { return element4.parentNode; });
  expectNull(function() { return element4.nextSibling; });
  expectEq(element2, function() { return element4.previousSibling; });
});

testCase('EditingNode.replaceChildMiddleChildByNew', function() {
  var context = testing.createContext();
  var element1 = testing.createElement(context, 'e1');
  var element2 = testing.createElement(context, 'e2');
  var element3 = testing.createElement(context, 'e3');
  var element4 = testing.createElement(context, 'e4');
  var element5 = testing.createElement(context, 'e5');
  element1.appendChild(element2);
  element1.appendChild(element3);
  element1.appendChild(element4);
  element1.replaceChild(element5, element3);

  expectEq(element2, function() { return element1.firstChild; });
  expectEq(element4, function() { return element1.lastChild; });

  expectEq(element1, function() { return element2.parentNode; });
  expectEq(element5, function() { return element2.nextSibling; });
  expectNull(function() { return element2.previousSibling; });

  expectNull(function() { return element3.parentNode; });
  expectNull(function() { return element3.nextSibling; });
  expectNull(function() { return element3.previousSibling; });

  expectEq(element1, function() { return element5.parentNode; });
  expectEq(element4, function() { return element5.nextSibling; });
  expectEq(element2, function() { return element5.previousSibling; });
});

testCase('EditingNode.replaceChildByChild', function() {
  var context = testing.createContext();
  var element1 = testing.createElement(context, 'e1');
  var element2 = testing.createElement(context, 'e2');
  var element3 = testing.createElement(context, 'e3');
  element1.appendChild(element2);
  element1.appendChild(element3);
  element1.replaceChild(element2, element3);

  expectEq(element2, function() { return element1.firstChild; });
  expectEq(element2, function() { return element1.lastChild; });

  expectEq(element1, function() { return element2.parentNode; });
  expectNull(function() { return element2.nextSibling; });
  expectNull(function() { return element2.previousSibling; });

  expectNull(function() { return element3.parentNode; });
  expectNull(function() { return element3.nextSibling; });
  expectNull(function() { return element3.previousSibling; });
});

//
// setAttribute
//
testCase('EditingNode.setAttribute', function() {
  var context = testing.createContext();
  var element1 = testing.createElement(context, 'e1');
  element1.setAttribute('a1', 'one');
  element1.setAttribute('a2', 'two');
  expectEq('one', function() { return element1.attributes['a1']; });
  expectEq('two', function() { return element1.attributes['a2']; });
  element1.setAttribute('a1', 'abc');
  expectEq('abc', function() { return element1.attributes['a1']; });
  expectEq(2, function() { return Object.keys(element1.attributes).length; });
});

//
// splitTree
//
testCase('EditingNode.splitTreeShallow', function() {
  var context = testing.createTree('<p><e1>one</e1>|<e2>two</e2><e3>three</e3></p>');
  var selection = context.selection;
  var refNode = selection.focusNode.childNodes[selection.focusOffset];
  var oldTree = refNode.parentNode;
  var newTree = oldTree.splitTree(refNode);
  expectEq('<p><e1>one</e1></p>',
           function() { return testing.serialzieNode(oldTree); });
  expectEq('<p><e2>two</e2><e3>three</e3></p>',
          function() { return testing.serialzieNode(newTree); });
});

testCase('EditingNode.splitTreeDeep', function() {
  var context = testing.createTree('<p><b>bold_1<i>italic_1<s>strike_1|strike_2</s>italic_2</i>bold_2</b></p>');
  var selection = context.selection;
  var refNode = selection.focusNode.childNodes[selection.focusOffset];
  var oldTree = refNode.parentNode.parentNode.parentNode;
  var newTree = oldTree.splitTree(refNode);
  expectEq('<b>bold_1<i>italic_1<s>strike_1</s></i></b>',
           function() { return testing.serialzieNode(oldTree); });
  expectEq('<b><i><s>strike_2</s>italic_2</i>bold_2</b>',
           function() { return testing.serialzieNode(newTree); });
});
