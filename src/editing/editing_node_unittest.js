// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

testCase('EditingNode.appendChild', function() {
  var context = testing.createContext();
  var element1 = context.createElement('e1');
  var element2 = context.createElement('e2');
  context.appendChild(element1, element2);

  expectEq(element2, function() { return element1.firstChild; });
  expectEq(element2, function() { return element1.lastChild; });
  expectEq(1, function() { return element1.childNodes.length; });
  expectEq(element2, function() { return element1.childNodes[0]; });
  expectEq(element1, function() { return element2.parentNode; });
  expectNull(function() { return element2.previousSibling; });
  expectNull(function() { return element2.nextSibling; });
});

//
// hasAttribute
//
testCase('EditingNode.hasAttribute', function() {
  var context = testing.createContext();
  var element1 = context.createElement('e1');
  context.setAttribute(element1, 'a1', 'one');
  context.setAttribute(element1, 'a2', 'one');
  expectTrue(function() { return element1.hasAttribute('a1'); });
  expectTrue(function() { return element1.hasAttribute('A1'); });
  expectFalse(function() { return element1.hasAttribute('notexist'); });
});

//
// hasChildNodes
//
testCase('EditingNode.hasChildNodes', function() {
  var context = testing.createContext();
  var element1 = context.createElement('e1');
  var element2 = context.createElement('e2');
  context.appendChild(element1, element2);
  expectTrue(function() { return element1.hasChildNodes(); });
  expectFalse(function() { return element2.hasChildNodes(); });
});

//
// insertBefore
//
testCase('EditingNode.insertBeforeNull', function() {
  var context = testing.createContext();
  var element1 = context.createElement('e1');
  var element2 = context.createElement('e2');
  context.insertBefore(element1, element2, null);

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
  var element1 = context.createElement('e1');
  var element2 = context.createElement('e2');
  var element3 = context.createElement('e3');
  context.appendChild(element1, element3);
  context.insertBefore(element1, element2, element3);

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
  var element1 = context.createElement('e1');
  var element2 = context.createElement('e2');
  var element3 = context.createElement('e3');
  var element4 = context.createElement('e4');
  context.appendChild(element1, element2);
  context.appendChild(element1, element3);
  context.insertBefore(element1, element4, element3);

  expectEq(element2, function() { return element1.firstChild; });
  expectEq(element3, function() { return element1.lastChild; });

  expectEq(element1, function() { return element4.parentNode; });
  expectEq(element3, function() { return element4.nextSibling; });
  expectEq(element2, function() { return element4.previousSibling; });

  expectEq(element4, function() { return element2.nextSibling; });
  expectEq(element4, function() { return element3.previousSibling; });
});

//
// hashCode
//
testCase('EditingNode.hasCode', function() {
  var context = testing.createContext();
  var element1 = context.createElement('e1');
  var element2 = context.createElement('e2');
  expectEq('number', function() { return typeof(element1.hashCode); });
  expectEq('number', function() { return typeof(element2.hashCode); });
  expectTrue(function() { return element1.hashCode != element2.hashCode; });
});

//
// removeChild
//
testCase('EditingNode.removeChildFirstChild', function() {
  var context = testing.createContext();
  var element1 = context.createElement('e1');
  var element2 = context.createElement('e2');
  var element3 = context.createElement('e3');
  var element4 = context.createElement('e4');
  context.appendChild(element1, element2);
  context.appendChild(element1, element3);
  context.appendChild(element1, element4);

  context.removeChild(element1, element2);

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
  var element1 = context.createElement('e1');
  var element2 = context.createElement('e2');
  var element3 = context.createElement('e3');
  var element4 = context.createElement('e4');
  context.appendChild(element1, element2);
  context.appendChild(element1, element3);
  context.appendChild(element1, element4);

  context.removeChild(element1, element3);

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
  var element1 = context.createElement('e1');
  var element2 = context.createElement('e2');
  var element3 = context.createElement('e3');
  var element4 = context.createElement('e4');
  context.appendChild(element1, element2);
  context.appendChild(element1, element3);
  context.appendChild(element1, element4);
  context.removeChild(element1, element4);

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
  var element1 = context.createElement('e1');
  var element2 = context.createElement('e2');
  var element3 = context.createElement('e3');
  context.appendChild(element1, element2);
  context.replaceChild(element1, element3, element2);

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
  var element1 = context.createElement('e1');
  var element2 = context.createElement('e2');
  var element3 = context.createElement('e3');
  var element4 = context.createElement('e4');
  context.appendChild(element1, element2);
  context.appendChild(element1, element3);
  context.replaceChild(element1, element4, element3);

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
  var element1 = context.createElement('e1');
  var element2 = context.createElement('e2');
  var element3 = context.createElement('e3');
  var element4 = context.createElement('e4');
  var element5 = context.createElement('e5');
  context.appendChild(element1, element2);
  context.appendChild(element1, element3);
  context.appendChild(element1, element4);
  context.replaceChild(element1, element5, element3);

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
  var element1 = context.createElement('e1');
  var element2 = context.createElement('e2');
  var element3 = context.createElement('e3');
  context.appendChild(element1, element2);
  context.appendChild(element1, element3);
  context.replaceChild(element1, element2, element3);

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
  var element1 = context.createElement('e1');
  context.setAttribute(element1, 'a1', 'one');
  context.setAttribute(element1, 'a2', 'two');
  expectEq('one', function() { return element1.getAttribute('a1'); });
  expectEq('two', function() { return element1.getAttribute('a2'); });
  context.setAttribute(element1, 'a1', 'abc');
  expectEq('abc', function() { return element1.getAttribute('a1'); });
  expectEq(2, function() { return element1.attributes.length; });
});
