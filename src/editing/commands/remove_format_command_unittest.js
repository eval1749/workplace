// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

testCaseFor('RemoveFormat', 'Element.All', {
  before: '<p contenteditable>^<b>abcd</b>|</p>',
  after:'<p contenteditable>^abcd|</p>'
});

testCaseFor('RemoveFormat', 'Element.Partial', {
  before: '<p contenteditable>^<b>abcd|<i>efg</i></b></p>',
  after:'<p contenteditable>^abcd|<b><i>efg</i></b></p>'
});

testCaseFor('RemoveFormat', 'Contents.All', {
  before: '<p contenteditable><b>^abcd|</b></p>',
  after:'<p contenteditable>^abcd|</p>'
});

testCaseFor('RemoveFormat', 'Contents.Partial', {
  before: '<p contenteditable><i><b>ab^cd|</b></i></p>',
  after:'<p contenteditable><i><b>ab</b></i>^cd|</p>'
});

testCaseFor('RemoveFormat', 'Contents.Partial2', {
  before: '<b contenteditable><i>ab^cd|</b></b>',
  after:'<b contenteditable><i>ab</i>^cd|</b>'
});

testCaseFor('RemoveFormat', 'Class', {
  before: '<p contenteditable><style>.bold{font-weight:bold}</style>^<span class="bold">abcd</span>|</p>',
  after:'<p contenteditable><style>.bold{font-weight:bold}</style>^<span class="bold">abcd</span>|</p>',
  notes: 'class="bold" does not affect removeFormat'
});
