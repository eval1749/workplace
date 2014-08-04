// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

var editing = {}

Object.defineProperty(editing, 'define', {
  value:
  /**
   * @param {string} name
   * @param {*} value
   */
  function(name, value) {
    Object.defineProperty(editing, name, {value: value});
  }
});
