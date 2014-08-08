// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

testCaseFor('Unlink', 'Nothing', {
  before: '<p contenteditable>|abcd</p>',
  after:'<p contenteditable>|abcd</p>'
});

// Remove A element if it has "href" attribute only.
// FF: <p contenteditable>^bar|</p>
// IE: <p contenteditable>|<a href="foo">bar</a></p> Doesn't remove A
testCaseFor('Unlink', 'SelectAnchorElementHrefOnly', {
  before: '<p contenteditable>^<a href="foo">bar</a>|</p>',
  after:'<p contenteditable>^bar|</p>'
});

testCaseFor('Unlink', 'SelectAnchorElementNoHref', {
  before: '<p contenteditable>^<a>bar</a>|</p>',
  after:'<p contenteditable>^<a>bar</a>|</p>'
});

// Event if A has "ID" attribute we remove A element as Firefox.
testCaseFor('Unlink', 'SelectAnchorElementHrefAndId', {
  before: '<p contenteditable>|<a  href="url1" id="id1">bar</a>^</p>',
  after:'<p contenteditable>^bar|</p>'
});

// Event if A has "NAME" attribute we remove A element as Firefox.
testCaseFor('Unlink', 'SelectAnchorElementHrefAndName', {
  before: '<p contenteditable>|<a  href="url1" name="id1">bar</a>^</p>',
  after:'<p contenteditable>^bar|</p>'
});

testCaseFor('Unlink', 'SelectAnchorText', {
  before: '<p contenteditable><a href="foo">^bar|</a></p>',
  after:'<p contenteditable>bar|</p>'
});

testCaseFor('Unlink', 'SelectPartialAnchorText', {
  before: '<p contenteditable><a href="foo">b^a|r</a></p>',
  after:'<p contenteditable>b^a|r</p>'
});

testCaseFor('Unlink', 'SelectDescendant', {
  before: '<p contenteditable><a href="foo"><b>^ba|r</b></a></p>',
  after:'<p contenteditable><b>^ba|r</b></p>'
});

testCaseFor('Unlink', 'SelectDescendant2', {
  before: '<p contenteditable><a href="foo"><b>ab^c</b>d|e</a></p>',
  after:'<p contenteditable><b>^ba|r</b></p>'
});

testCaseFor('Unlink', 'SelectMultipleAnchorElements', {
  before: '<p contenteditable>^<a href="foo">bar</a><a href="foo2">bar2</a>|</p>',
  after:'<p contenteditable>^barbar2|</p>',
});
