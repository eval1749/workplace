// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

testCase('createLinkCaretAtEnd', function() {
  var context = testing.createTree('<p contenteditable>abcd|</p>');
  editing.createLink(context, 'URL');
  expectEq('<p contenteditable>abcd<a href="URL">URL</a></p>',
           function() { return testing.getResultHtml(); });
});

testCase('createLinkCaretAtMiddle', function() {
  var context = testing.createTree('<p contenteditable>ab|cd</p>');
  editing.createLink(context, 'URL');
  expectEq('<p contenteditable>ab<a href="URL">URL</a>c</p>',
           function() { return testing.getResultHtml(); });
});

testCase('createLinkCaretAtStart', function() {
  var context = testing.createTree('<p contenteditable>|abcd</p>');
  editing.createLink(context, 'URL');
  expectEq('<p contenteditable><a href="URL">URL</a>abcd</p>',
           function() { return testing.getResultHtml(); });
});
