// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

testing.define('TEST_EXPECTATIONS', (function() {
  var IE_BACKWARD_SELECTION = 'IE does not work well for backward seleciton.';
  var IE_IGNORES_A_ATTRS = 'IE compatibility.' +
      ' Replace A element even if it has "name" attribute';
  var W3C_SELECTION_IS_INCORRECT = 'W3C selection range is incorrect.';
  return {
    // createLink command
    'createLink.w3c.23': {expected: 'warn', reason: W3C_SELECTION_IS_INCORRECT},
    'createLink.w3c.23r': {expected: 'warn',
                          reason: W3C_SELECTION_IS_INCORRECT},
    'createLink.w3c.35': {expected: 'warn', reason: W3C_SELECTION_IS_INCORRECT},
    'createLink.w3c.35r': {expected: 'warn',
                           reason: W3C_SELECTION_IS_INCORRECT},
    'createLink.w3c.46': {expected: 'fail', reason: IE_IGNORES_A_ATTRS},
    'createLink.w3c.46r': {expected: 'fail', reason: IE_IGNORES_A_ATTRS},
    'createLink.w3c.47': {expected: 'fail', reason: IE_IGNORES_A_ATTRS},
    'createLink.w3c.47r': {expected: 'fail', reason: IE_IGNORES_A_ATTRS},

    // unlink command
    'unlink.w3c.24': {expected: 'fail', reason: IE_IGNORES_A_ATTRS},
    'unlink.w3c.24r': {expected: 'fail', reason: IE_IGNORES_A_ATTRS},
    'unlink.w3c.25': {expected: 'fail', reason: IE_IGNORES_A_ATTRS},
    'unlink.w3c.25r': {expected: 'fail', reason: IE_IGNORES_A_ATTRS},
    'unlink.w3c.26': {expected: 'fail', reason: IE_IGNORES_A_ATTRS},
    'unlink.w3c.26r': {expected: 'fail', reason: IE_IGNORES_A_ATTRS},
    'unlink.w3c.27': {expected: 'fail', reason: IE_IGNORES_A_ATTRS},
    'unlink.w3c.27r': {expected: 'fail', reason: IE_BACKWARD_SELECTION},
    'unlink.w3c.28': {expected: 'fail', reason: IE_IGNORES_A_ATTRS},
    'unlink.w3c.28r': {expected: 'fail', reason: IE_BACKWARD_SELECTION},
    'unlink.w3c.29': {expected: 'fail', reason: IE_IGNORES_A_ATTRS},
    'unlink.w3c.29r': {expected: 'fail', reason: IE_BACKWARD_SELECTION},
    'unlink.w3c.30': {expected: 'fail', reason: IE_IGNORES_A_ATTRS},
    'unlink.w3c.30r': {expected: 'fail', reason: IE_BACKWARD_SELECTION},
    'unlink.w3c.31': {expected: 'fail', reason: IE_IGNORES_A_ATTRS},
    'unlink.w3c.31r': {expected: 'fail', reason: IE_IGNORES_A_ATTRS},
    'unlink.w3c.32': {expected: 'fail', reason: IE_IGNORES_A_ATTRS},
    'unlink.w3c.32r': {expected: 'fail', reason: IE_BACKWARD_SELECTION},
    'unlink.w3c.33': {expected: 'fail', reason: IE_IGNORES_A_ATTRS},
    'unlink.w3c.33r': {expected: 'fail', reason: IE_BACKWARD_SELECTION},
    'unlink.w3c.34': {expected: 'fail', reason: IE_IGNORES_A_ATTRS},
    'unlink.w3c.34r': {expected: 'fail', reason: IE_BACKWARD_SELECTION},
    'unlink.w3c.35': {expected: 'fail', reason: IE_IGNORES_A_ATTRS},
    'unlink.w3c.35r': {expected: 'fail', reason: IE_BACKWARD_SELECTION}
  };
})());

