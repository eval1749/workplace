// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';


// When |url| parameter is empty, |createLink| does nothing and returns
// false.
testCase('createLinkNoUrl', function() {
  var context = testing.createSample('<p contenteditable>abcd|</p>');
  expectFalse(function() {
    return testing.execCommand(context, 'CreateLink');
  });
});

// Simple createLink
// <b>foo|bar</b> => <b>foo^<a>url</a>|bar</b>
testCase('createLinkCaretAtFirst', function() {
  var context = testing.createSample('<p contenteditable>|abcd</p>');
  expectTrue(function() {
    return testing.execCommand(context, 'CreateLink', false, 'URL');
  });
  expectEq('<p contenteditable>^<a href="URL">URL</a>|abcd</p>',
           function() { return testing.getResultHtml(context); });
});

testCase('createLinkCaretAtLast', function() {
  var context = testing.createSample('<p contenteditable>abcd|</p>');
  expectTrue(function() {
    return testing.execCommand(context, 'CreateLink', false, 'URL');
  });
  expectEq('<p contenteditable>abcd^<a href="URL">URL</a>|</p>',
           function() { return testing.getResultHtml(context); });
});

testCase('createLinkCaretAtMiddle', function() {
  var context = testing.createSample('<p contenteditable>ab|cd</p>');
  expectTrue(function() {
    return testing.execCommand(context, 'CreateLink', false, 'URL');
  });
  expectEq('<p contenteditable>ab^<a href="URL">URL</a>|cd</p>',
           function() { return testing.getResultHtml(context); });
});

// createLink in interactive
// <a><b>foo|bar</b></a> => <a><b>foo</b></a><b><a>URL</a></b><a><b>bar</a>
testCase('createLinkCaretInteractiveAtFirst', function() {
  var context = testing.createSample('<p contenteditable><a><b>|abcd</b></a></p>');
  expectTrue(function() {
    return testing.execCommand(context, 'CreateLink', false, 'URL');
  });
  expectEq('<p contenteditable><b>^<a href="URL">URL</a>|</b><a><b>abcd</b></a></p>',
           function() { return testing.getResultHtml(context); });
});

testCase('createLinkCaretInteractiveAtLast', function() {
  var context = testing.createSample('<p contenteditable><a><b>abcd|</b></a></p>');
  expectTrue(function() { return testing.execCommand(context, 'CreateLink', false, 'URL'); });
  expectEq('<p contenteditable><a><b>abcd</b></a><b>^<a href="URL">URL</a>|</b></p>',
           function() { return testing.getResultHtml(context); });
});

testCase('createLinkCaretInteractiveAtMiddle', function() {
  var context = testing.createSample('<p contenteditable><a><b>ab|cd</b></a></p>');
  expectTrue(function() {
    return testing.execCommand(context, 'CreateLink', false, 'URL');
  });
  expectEq('<p contenteditable><a><b>ab</b></a><b>^<a href="URL">URL</a>|</b><a><b>cd</b></a></p>',
           function() { return testing.getResultHtml(context); });
});

// http://jsfiddle.net/66566/
// <p contenteditable><a href="foo">^foo|</a></p>
// =>
// <p contenteditable>^<a href="URL">foo</a>|</p>
testCase('createLinkRangeAnchor', function() {
  var context = testing.createSample('<p contenteditable><a href="foo">^foo|</a></p>');
  expectTrue(function() {
    return testing.execCommand(context, 'CreateLink', false, 'URL');
  });
  expectEq('<p contenteditable>^<a href="URL">foo</a>|</p>',
           function() { return testing.getResultHtml(context); });
});

// http://jsfiddle.net/66566/1/
// <p contenteditable<a href="foo">^fo|o</a></p>
// =>
// CR: <p contenteditable<a href="FOO">^fo<a href="URL">o</a></a></p>
// FF: <p contenteditable<a href="URL">foo</a></p>
// IE: <p contenteditable<a href="URL">foo</a></p>
testCase('createLinkRangeAnchor2', function() {
  var context = testing.createSample('<p contenteditable><a href="foo">^fo|o</a></p>');
  expectTrue(function() {
    return testing.execCommand(context, 'CreateLink', false, 'URL');
  });
  expectEq('<p contenteditable>^<a href="URL">foo</a>|</p>',
           function() { return testing.getResultHtml(context); });
});


// Create link with LI
// Node: P element can't have UL as content, because P's context model is
// PHRASING,
testCase('createLinkRangeList', function() {
  var context = testing.createSample('<div contenteditable>^<ul><li>one</li><li>two</li></ul>|</div>');
  expectTrue(function() { return testing.execCommand(context, 'CreateLink', false, 'URL'); });
  expectEq('<div contenteditable><ul><li>^<a href="URL">one</a></li><li><a href="URL">two</a>|</li></ul></div>',
           function() { return testing.getResultHtml(context); });
});

// Create link with range.
testCase('createLinkRangeSimpleText', function() {
  var context = testing.createSample('<p contenteditable>^abcd|</p>');
  expectTrue(function() { return testing.execCommand(context, 'CreateLink', false, 'URL'); });
  expectEq('<p contenteditable>^<a href="URL">abcd</a>|</p>',
           function() { return testing.getResultHtml(context); });
});

testCase('createLinkRangeSimpleTree', function() {
  var context = testing.createSample('<p contenteditable>^abcd<b>efg</b>|</p>');
  expectTrue(function() { return testing.execCommand(context, 'CreateLink', false, 'URL'); });
  expectEq('<p contenteditable>^<a href="URL">abcd<b>efg</b></a>|</p>',
           function() { return testing.getResultHtml(context); });
});


// Create link with range in interactive
// <a><b>a^b|c</b> => <a><b>a</b></a><a><b>b</b></a><a><b>c</b></a>


// TODO(yosin) What do we expect from "createLink('<b>foo^</b>|')"?
