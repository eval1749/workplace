// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

// IE11 doesn't work well if focus before anchor.

testCaseFor('Unlink', 'Nothing', {
  before: '<p contenteditable>|abcd</p>',
  after:'<p contenteditable>|abcd</p>'
});

//
// Caret
//
testCaseFor('Unlink', 'Caret.Child', {
  before: '<p contenteditable><a href="foo">b|ar</a></p>',
  after:'<p contenteditable>b|ar</p>'
});

testCaseFor('Unlink', 'Caret.LastChild', {
  before: '<p contenteditable><a href="foo">bar|</a></p>',
  after:'<p contenteditable>bar|</p>'
});

testCaseFor('Unlink', 'Caret.Descendant', {
  before: '<p contenteditable><a href="foo"><b>b|ar</b></a></p>',
  after:'<p contenteditable><b>b|ar</b></p>'
});

// Remove A element if it has "href" attribute only.
// FF: <p contenteditable>^bar|</p>
// IE: <p contenteditable>|<a href="foo">bar</a></p> Doesn't remove A
testCaseFor('Unlink', 'AnchorElement.HrefOnly', {
  before: '<p contenteditable>^<a href="foo">bar</a>|</p>',
  after:'<p contenteditable>^bar|</p>'
});

// IE removes A element even if it doesn't have "HREF".
testCaseFor('Unlink', 'AnchorElement.NoHref', {
  before: '<p contenteditable>^<a>bar</a>|</p>',
  after:'<p contenteditable>^bar|</p>'
});

testCaseFor('Unlink', 'AnchorElement.NoHref.Other', {
  before: '<p contenteditable>^<a class="red">bar</a>|</p>',
  after:'<p contenteditable>^bar|</p>'
});

//
// Unlink with href
//
testCaseFor('Unlink', 'AnchorElement.Href.Class', {
  before: '<p contenteditable>^<a class="class1" href="url1">bar</a>|</p>',
  after:'<p contenteditable>^bar|</p>',
  firefox: '<p contenteditable><span class="class1">bar</span>^</p>',
  ie: '<p contenteditable>^<a class="class1" href="url1">bar</a></p>'
});

testCaseFor('Unlink', 'AnchorElement.Href.Id', {
  before: '<p contenteditable>^<a href="url1" id="id1">bar</a>|</p>',
  after:'<p contenteditable>^bar|</p>',
  ie: '<p contenteditable>^<a href="url1" id="id1">bar</a></p>'
});

testCaseFor('Unlink', 'AnchorElement.Href.Name', {
  before: '<p contenteditable>^<a href="url1" name="id1">bar</a>|</p>',
  after:'<p contenteditable>^bar|</p>',
});

testCaseFor('Unlink', 'AnchorElement.Href.Style', {
  before: '<p contenteditable>^<a  href="url1" style="font-weight: bold">bar</a>|</p>',
  after:'<p contenteditable>^bar|</p>',
  firefox: '<p contenteditable><a href="url1" style="font-weight: bold;">bar</a></p>',
});

//
// Unlink from whole anchor text
//
testCaseFor('Unlink', 'AnchorText.Whole.Anchor.Focus', {
  before: '<p contenteditable><a href="foo">^bar|</a></p>',
  after:'<p contenteditable>^bar|</p>'
});

testCaseFor('Unlink', 'AnchorText.Whole.Focus.Anchor', {
  before: '<p contenteditable><a href="foo">|bar^</a></p>',
  after:'<p contenteditable>|bar^</p>'
});

//
// Unlink from partial anchor text
//
testCaseFor('Unlink', 'AnchorText.Partial.Anchor.Focus', {
  before: '<p contenteditable><a href="foo">ab^cd|ef</a></p>',
  after:'<p contenteditable>ab^cd|ef</p>'
});

testCaseFor('Unlink', 'AnchorText.Partial.Focus.Anchor', {
  before: '<p contenteditable><a href="foo">ab|cd^ef</a></p>',
  after:'<p contenteditable>ab|cd^ef</p>'
});

//
// Unlink from partial anchor content
//
testCaseFor('Unlink', 'AnchorContent.Partial.Anchor.Focus', {
  before: '<p contenteditable><a href="foo"><b>ab^cd|ef</b></a></p>',
  after:'<p contenteditable><b>ab^cd|ef</b></p>'
});

testCaseFor('Unlink', 'AnchorCross.Partial.Anchor.Focus', {
  before: '<p contenteditable><a href="foo"><b>ab^c</b>d|e</a></p>',
  after:'<p contenteditable><b>ab^c</b>d|e</p>'
});

testCaseFor('Unlink', 'AnchorCross.Partial.Focus.Anchor', {
  before: '<p contenteditable><a href="foo"><b>ab|c</b>d^e</a></p>',
  after:'<p contenteditable><b>ab|c</b>d^e</p>'
});

//
// Unlink multiple anchor elements
//
testCaseFor('Unlink', 'Multiple.Whole.Anchor.Focus', {
  before: '<p contenteditable>^<a href="foo">bar</a><a href="foo2">bar2</a>|</p>',
  after:'<p contenteditable>^barbar2|</p>',
});

testCaseFor('Unlink', 'Multiple.Whole.Focus.Anchor', {
  before: '<p contenteditable>|<a href="foo">bar</a><a href="foo2">bar2</a>^</p>',
  after:'<p contenteditable>|barbar2^</p>',
});

testCaseFor('Unlink', 'Multiple.Partial.Anchor.Focus', {
  before: '<p contenteditable><a href="foo">a^bc</a>d<a href="foo2">e|f</a></p>',
  after:'<p contenteditable>a^bcde|f</p>',
});

testCaseFor('Unlink', 'Multiple.Partial.Focus.Anchor', {
  before: '<p contenteditable><a href="foo">a|bc</a>d<a href="foo2">e^f</a></p>',
  after:'<p contenteditable>a|bcde^f</p>',
  firefox: '<p contenteditable>abcd<a href="foo2">ef</a></p>'
});

//
// Nested anchor elements
//
testCaseFor('Unlink', 'Multiple.Nested', {
  // TODO(yosi) Since the parser automatically insert "</a>" to avoid nested
  // A elements, we should make nested A elements by script.
  x_before: '<p contenteditable>^<a href="foo">abc<a>def</a></a>|</p>',
  before: '<p contenteditable>^<a href="foo">abc</a><a>def</a>|</p>',
  after:'<p contenteditable>^abcdef|</p>',
});


