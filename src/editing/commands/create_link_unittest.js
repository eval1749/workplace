// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';


// When |url| parameter is empty, |createLink| does nothing and returns
// false.
testCase('createLinkNoUrl', function() {
  var context = testing.createTree('<p contenteditable>abcd|</p>');
  expectFalse(function() { return editing.createLink(context, ''); });
});

// Simple createLink
// <b>foo|bar</b> => <b>foo^<a>url</a>|bar</b>
testCase('createLinkCaretAtFirst', function() {
  var context = testing.createTree('<p contenteditable>|abcd</p>');
  expectTrue(function() { return editing.createLink(context, 'URL'); });
  expectEq('<p contenteditable>^<a href="URL">URL</a>|abcd</p>',
           function() { return testing.getResultHtml(context); });
});

testCase('createLinkCaretAtLast', function() {
  var context = testing.createTree('<p contenteditable>abcd|</p>');
  expectTrue(function() { return editing.createLink(context, 'URL'); });
  expectEq('<p contenteditable>abcd^<a href="URL">URL</a>|</p>',
           function() { return testing.getResultHtml(context); });
});

testCase('createLinkCaretAtMiddle', function() {
  var context = testing.createTree('<p contenteditable>ab|cd</p>');
  expectTrue(function() { return editing.createLink(context, 'URL'); });
  expectEq('<p contenteditable>ab^<a href="URL">URL</a>|cd</p>',
           function() { return testing.getResultHtml(context); });
});

// createLink in interactive
// <a><b>foo|bar</b></a> => <a><b>foo</b></a><b><a>URL</a></b><a><b>bar</a>
testCase('createLinkCaretInteractiveAtFirst', function() {
  var context = testing.createTree('<p contenteditable><a><b>|abcd</b></a></p>');
  expectTrue(function() { return editing.createLink(context, 'URL'); });
  expectEq('<p contenteditable><b>^<a href="URL">URL</a>|</b><a><b>abcd</b></a></p>',
           function() { return testing.getResultHtml(context); });
});

testCase('createLinkCaretInteractiveAtLast', function() {
  var context = testing.createTree('<p contenteditable><a><b>abcd|</b></a></p>');
  expectTrue(function() { return editing.createLink(context, 'URL'); });
  expectEq('<p contenteditable><a><b>abcd</b></a><b>^<a href="URL">URL</a>|</b></p>',
           function() { return testing.getResultHtml(context); });
});

testCase('createLinkCaretInteractiveAtMiddle', function() {
  var context = testing.createTree('<p contenteditable><a><b>ab|cd</b></a></p>');
  expectTrue(function() { return editing.createLink(context, 'URL'); });
  expectEq('<p contenteditable><a><b>ab</b></a><b>^<a href="URL">URL</a>|</b><a><b>cd</b></a></p>',
           function() { return testing.getResultHtml(context); });
});

// Create link with range.
// <a><b>a^b|c</b> => <a><b>a</b></a><a><b>b</b></a><a><b>c</b></a>

