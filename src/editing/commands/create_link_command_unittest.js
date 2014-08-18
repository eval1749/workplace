// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

// When |url| parameter is empty, |createLink| does nothing and returns
// false.
testCase('CreateLink.NoUrl', function() {
  if (testing.isIE) {
    // Since IE shows modal dialog box to get URL, we don't run this test case,
    // to avoid manual closing modal dialog box.
    testRunner.skipped();
    return;
  }
  var context = testing.createSample('<p contenteditable>abcd|</p>');
  expectFalse(function() {
    return testing.execCommand(context, 'CreateLink');
  });
});

// Simple createLink
// <b>foo|bar</b> => <b>foo^<a>url</a>|bar</b>
testCaseFor('CreateLink', 'CaretAtFirst', {
  before: '<p contenteditable>|abcd</p>',
  after:'<p contenteditable>^<a href="URL">URL</a>|abcd</p>',
  value: 'URL'
});

testCaseFor('CreateLink', 'CaretAtLast', {
  before: '<p contenteditable>abcd|</p>',
  after: '<p contenteditable>abcd^<a href="URL">URL</a>|</p>',
  value: 'URL'
});

testCaseFor('CreateLink', 'CaretAtMiddle', {
  before: '<p contenteditable>ab|cd</p>',
  after:  '<p contenteditable>ab^<a href="URL">URL</a>|cd</p>',
  value: 'URL'
});

// createLink in interactive
// <a><b>foo|bar</b></a> => <a><b>foo</b></a><b><a>URL</a></b><a><b>bar</a>
testCaseFor('CreateLink', 'CaretInteractiveAtFirst', {
  before: '<p contenteditable><a><b>|abcd</b></a></p>',
  after:  '<p contenteditable><b>^<a href="URL">URL</a>|</b><a><b>abcd</b></a></p>',
  value: 'URL'
});

testCaseFor('CreateLink', 'CaretInteractiveAtLast', {
  before: '<p contenteditable><a><b>abcd|</b></a></p>',
  after:  '<p contenteditable><a><b>abcd</b></a><b>^<a href="URL">URL</a>|</b></p>',
  value: 'URL'
});

testCaseFor('CreateLink', 'CaretInteractiveAtMiddle', {
  before: '<p contenteditable><a><b>ab|cd</b></a></p>',
  after:  '<p contenteditable><a><b>ab</b></a><b>^<a href="URL">URL</a>|</b><a><b>cd</b></a></p>',
  value: 'URL'
});

// http://jsfiddle.net/66566/
// <p contenteditable><a href="foo">^foo|</a></p>
// =>
// <p contenteditable>^<a href="URL">foo</a>|</p>
testCaseFor('CreateLink', 'RangeAnchor', {
  before: '<p contenteditable><a href="foo">^foo|</a></p>',
  after:  '<p contenteditable><a href="URL">^foo|</a></p>',
  value: 'URL'
});

// http://jsfiddle.net/66566/1/
// <p contenteditable<a href="foo">^fo|o</a></p>
// =>
// CR: <p contenteditable<a href="FOO">^fo<a href="URL">o</a></a></p>
// FF: <p contenteditable<a href="URL">foo</a></p>
// IE: <p contenteditable<a href="URL">foo</a></p>
testCaseFor('CreateLink', 'RangeAnchor2', {
  before: '<p contenteditable><a href="foo">^fo|o</a></p>',
  after:  '<p contenteditable><a href="URL">^fo|o</a></p>',
  value: 'URL'
});


// Create link with LI
// Node: P element can't have UL as content, because P's context model is
// PHRASING,
testCaseFor('CreateLink', 'RangeList', {
  before: '<div contenteditable>^<ul><li>one</li><li>two</li></ul>|</div>',
  after:  '<div contenteditable>^<ul><li><a href="URL">one</a></li><li><a href="URL">two</a></li></ul>|</div>',
  value: 'URL'
});

// Create link with range.
testCaseFor('CreateLink', 'RangeSimpleText', {
  before: '<p contenteditable>^abcd|</p>',
  after:  '<p contenteditable><a href="URL">^abcd|</a></p>',
  value: 'URL'
});

testCaseFor('CreateLink', 'RangeSimpleTree', {
  before: '<p contenteditable>^abcd<b>efg</b>|</p>',
  after:  '<p contenteditable><a href="URL">^abcd<b>efg</b>|</a></p>',
  value: 'URL'
});

// Crete link for end tag.
// CR: Insert anchor because of selection normalization.
// FF: No insertion, returns true
// IE: No insertion, ending selection is empty
// See also w3c.9 "^</span><span>|"
testCaseFor('CreateLink', 'EndTag', {
  before: '<p contenteditable><b>abc^</b>|</p>',
  after:  '<p contenteditable><b>abc</b>^<a href="URL">URL</a>|</p>',
  value: 'URL'
});

// Variation of w3c.3
testCaseFor('createLink', 'Span.Style', {
  after: '<div contenteditable><a href="http://www.google.com/"><span style="font-weight: bold">^foo</span> <span>bar|</span></a></div>',
  before: '<div contenteditable><span style="font-weight: bold">^foo</span> <span>bar|</span></div>',
  sampleId: 3,
  value: 'http://www.google.com/'
});

// Variation of w3c.4
testCaseFor('createLink', 'Span.Nested.1', {
  after: '<div contenteditable><p><a href="http://www.google.com/">^foo</a></p><p> <a href="http://www.google.com/"><span><b>bar</b>quux</span></a> </p><p><a href="http://www.google.com/">baz|</a></p></div>',
  before: '<div contenteditable><p>^foo</p><p> <span><b>bar</b>quux</span> </p><p>baz|</p></div>',
  sampleId: 4,
  value: 'http://www.google.com/'
});

testCaseFor('createLink', 'Span.Nested.2', {
  after: '<div contenteditable><p><a href="http://www.google.com/">^foo</a></p><p> <a href="http://www.google.com/"><span><span>bar</span>quux</span></a> </p><p><a href="http://www.google.com/">baz|</a></p></div>',
  before: '<div contenteditable><p>^foo</p><p> <span><span>bar</span>quux</span> </p><p>baz|</p></div>',
  sampleId: 4,
  value: 'http://www.google.com/'
});


// Create link with range in interactive
// <a><b>a^b|c</b> => <a><b>a</b></a><a><b>b</b></a><a><b>c</b></a>
