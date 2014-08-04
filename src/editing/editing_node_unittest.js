// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

testCase('EditingNode.appendChild', function() {
  var context = new editing.EditingContext(document);
  var element1 = new editing.EditingNode(context, document.createElement('foo'));
  var element2 = new editing.EditingNode(context, document.createElement('bar'));
  element1.appendChild(element2);
  expectEq(element2, element1.firstChild);
  expectEq(element2, element1.lastChild);
  expectEq(1, element1.childNodes.length);
  expectEq(element2, element1.childNodes[0]);
  expectEq(element1, element2.parentNode);
  expectNull(element2.previousSibling);
  expectNull(element2.nextSibling);
});

testCase('EditingNode.splitTree', function() {
  var context = testing.createTree('<p contenteditable><b>bold_1<i>italic_1<s>strike_1|strike_2</s>italic_2</i>bold_2</b></p>');
  var selection = context.selection;
  expectEq('S', selection.focusNode.parentNode.nodeName);
  var treeRoot = selection.focusNode.parentNode.parentNode.parentNode;
  expectEq('B', treeRoot.nodeName);
  console.log('TREEROOT', treeRoot, testing.serialzieNode(treeRoot));
  var newTree = treeRoot.splitTree(selection.focusNode);
  expectEq('<p contenteditable><b>bold_1<i>italic_1<s>strike_1</s></i><b><i><s>strike_2</s>italic_2</i>bold_2</b></p>',
           testing.serialzieNode(treeRoot));
});
