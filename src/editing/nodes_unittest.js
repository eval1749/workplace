// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

//
// nodes.isWhitespaceNode
//
testCase('nodes.isWhitespaceNode', function() {
  var context = testing.createContext();
  var elementA = testing.createElement(context, 'a');
  var textB = testing.createTextNode(context, 'b');
  var textC = testing.createTextNode(context, '  ');
  expectFalse(function () { return editing.nodes.isWhitespaceNode(elementA); });
  expectFalse(function () { return editing.nodes.isWhitespaceNode(textB); });
  expectTrue(function () { return editing.nodes.isWhitespaceNode(textC); });
});
