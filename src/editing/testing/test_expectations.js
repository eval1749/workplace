// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

testing.define('TEST_EXPECTATIONS', (function() {
  var IE_IGNORES_A_NAME = 'IE compatibility.' +
      ' Replace A element even if it has "name" attribute';
  return {
    'createLink.w3c.46': {expected: 'fail', reason: IE_IGNORES_A_NAME},
    'createLink.w3c.46r': {expected: 'fail', reason: IE_IGNORES_A_NAME},
    'createLink.w3c.47': {expected: 'fail', reason: IE_IGNORES_A_NAME},
    'createLink.w3c.47r': {expected: 'fail', reason: IE_IGNORES_A_NAME}
  };
})());

