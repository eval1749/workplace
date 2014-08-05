// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

testCase('EditingNode.appendChild', function() {
  var context = new editing.EditingContext(document);
  var element1 = testing.createElement(context, 'e1');
  var element2 = testing.createElement(context, 'e2');
  element1.appendChild(element2);

  expectEq(element2, element1.firstChild);
  expectEq(element2, element1.lastChild);
  expectEq(1, element1.childNodes.length);
  expectEq(element2, element1.childNodes[0]);
  expectEq(element1, element2.parentNode);
  expectNull(element2.previousSibling);
  expectNull(element2.nextSibling);
});

testCase('EditingNode.insertBeforeNull', function() {
  var context = new editing.EditingContext(document);
  var element1 = testing.createElement(context, 'e1');
  var element2 = testing.createElement(context, 'e2');
  element1.insertBefore(element2, null);

  expectEq(element2, element1.firstChild);
  expectEq(element2, element1.lastChild);
  expectEq(1, element1.childNodes.length);
  expectEq(element2, element1.childNodes[0]);
  expectEq(element1, element2.parentNode);
  expectNull(element2.previousSibling);
  expectNull(element2.nextSibling);
});

testCase('EditingNode.insertBeforeToFirst', function() {
  var context = new editing.EditingContext(document);
  var element1 = testing.createElement(context, 'e1');
  var element2 = testing.createElement(context, 'e2');
  var element3 = testing.createElement(context, 'e3');
  element1.appendChild(element3);
  element1.insertBefore(element2, element3);

  expectEq(element2, element1.firstChild);
  expectEq(element3, element1.lastChild);

  expectEq(element1, element2.parentNode);
  expectEq(element3, element2.nextSibling);
  expectNull(element2.previousSibling);

  expectEq(element1, element3.parentNode);
  expectNull(element3.nextSibling);
  expectEq(element2, element3.previousSibling);
});

testCase('EditingNode.insertBeforeToSecond', function() {
  var context = new editing.EditingContext(document);
  var element1 = testing.createElement(context, 'e1');
  var element2 = testing.createElement(context, 'e2');
  var element3 = testing.createElement(context, 'e3');
  var element4 = testing.createElement(context, 'e4');
  element1.appendChild(element2);
  element1.appendChild(element3);
  element1.insertBefore(element4, element3);

  expectEq(element2, element1.firstChild);
  expectEq(element3, element1.lastChild);

  expectEq(element1, element4.parentNode);
  expectEq(element3, element4.nextSibling);
  expectEq(element2, element4.previousSibling);

  expectEq(element4, element2.nextSibling);
  expectEq(element4, element3.previousSibling);
});

testCase('EditingNode.removeChildFirstChild', function() {
  var context = new editing.EditingContext(document);
  var element1 = testing.createElement(context, 'e1');
  var element2 = testing.createElement(context, 'e2');
  var element3 = testing.createElement(context, 'e3');
  var element4 = testing.createElement(context, 'e4');
  element1.appendChild(element2);
  element1.appendChild(element3);
  element1.appendChild(element4);

  element1.removeChild(element2);

  expectEq(element3, element1.firstChild);
  expectEq(element4, element1.lastChild);
  expectEq(2, element1.childNodes.length);

  expectEq(element4, element3.nextSibling);
  expectEq(element3, element4.previousSibling);

  expectNull(element2.nextSibling);
  expectNull(element2.parentNode);
  expectNull(element2.previousSibling);
});

testCase('EditingNode.removeChildSecondChild', function() {
  var context = new editing.EditingContext(document);
  var element1 = testing.createElement(context, 'e1');
  var element2 = testing.createElement(context, 'e2');
  var element3 = testing.createElement(context, 'e3');
  var element4 = testing.createElement(context, 'e4');
  element1.appendChild(element2);
  element1.appendChild(element3);
  element1.appendChild(element4);

  element1.removeChild(element3);

  expectEq(element2, element1.firstChild);
  expectEq(element4, element1.lastChild);
  expectEq(2, element1.childNodes.length);

  expectEq(element4, element2.nextSibling);
  expectEq(element2, element4.previousSibling);

  expectNull(element3.nextSibling);
  expectNull(element3.parentNode);
  expectNull(element3.previousSibling);
});

testCase('EditingNode.removeChildLastChild', function() {
  var context = new editing.EditingContext(document);
  var element1 = testing.createElement(context, 'e1');
  var element2 = testing.createElement(context, 'e2');
  var element3 = testing.createElement(context, 'e3');
  var element4 = testing.createElement(context, 'e4');
  element1.appendChild(element2);
  element1.appendChild(element3);
  element1.appendChild(element4);
  element1.removeChild(element4);

  expectEq(element2, element1.firstChild);
  expectEq(element3, element1.lastChild);
  expectEq(2, element1.childNodes.length);

  expectEq(element3, element2.nextSibling);
  expectEq(element2, element3.previousSibling);

  expectNull(element4.nextSibling);
  expectNull(element4.parentNode);
  expectNull(element4.previousSibling);
});

// replaceChild
testCase('EditingNode.replaceChildFirst', function() {
  var context = new editing.EditingContext(document);
  var element1 = testing.createElement(context, 'e1');
  var element2 = testing.createElement(context, 'e2');
  var element3 = testing.createElement(context, 'e3');
  element1.appendChild(element2);
  element1.replaceChild(element3, element2);

  expectEq(element3, element1.firstChild);
  expectEq(element3, element1.lastChild);

  expectNull(element2.parentNode);
  expectNull(element2.nextSibling);
  expectNull(element2.previousSibling);

  expectEq(element1, element3.parentNode);
  expectNull(element3.nextSibling);
  expectNull(element3.previousSibling);
});

testCase('EditingNode.replaceChildLast', function() {
  var context = new editing.EditingContext(document);
  var element1 = testing.createElement(context, 'e1');
  var element2 = testing.createElement(context, 'e2');
  var element3 = testing.createElement(context, 'e3');
  var element4 = testing.createElement(context, 'e4');
  element1.appendChild(element2);
  element1.appendChild(element3);
  element1.replaceChild(element4, element3);

  expectEq(element2, element1.firstChild);
  expectEq(element4, element1.lastChild);

  expectEq(element1, element2.parentNode);
  expectEq(element4, element2.nextSibling);
  expectNull(element2.previousSibling);

  expectNull(element3.parentNode);
  expectNull(element3.nextSibling);
  expectNull(element3.previousSibling);

  expectEq(element1, element4.parentNode);
  expectNull(element4.nextSibling);
  expectEq(element2, element4.previousSibling);
});

// splitTree
testCase('EditingNode.splitTreeShallow', function() {
  var context = testing.createTree('<p><e1>one</e1>|<e2>two</e2><e3>three</e3></p>');
  var selection = context.selection;
  var refNode = selection.focusNode.childNodes[selection.focusOffset];
  var oldTree = refNode.parentNode;
  var newTree = oldTree.splitTree(refNode);
  expectEq('<p><e1>one</e1></p>', testing.serialzieNode(oldTree));
  expectEq('<p><e2>two</e2><e3>three</e3></p>', testing.serialzieNode(newTree));
});

testCase('EditingNode.splitTreeDeep', function() {
  var context = testing.createTree('<p><b>bold_1<i>italic_1<s>strike_1|strike_2</s>italic_2</i>bold_2</b></p>');
  var selection = context.selection;
  var refNode = selection.focusNode;
  var oldTree = refNode.parentNode.parentNode.parentNode;
  var newTree = oldTree.splitTree(refNode);
  expectEq('<b>bold_1<i>italic_1<s>strike_1</s></i></b>',
           testing.serialzieNode(oldTree));
  expectEq('<b><i><s>strike_2</s>italic_2</i>bold_2</b>',
           testing.serialzieNode(newTree));
});
