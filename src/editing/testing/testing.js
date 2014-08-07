// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';


var testing = {};
(function() {
  // TODO(yosin) Once ES6 Map is ready, we should use it for |commandTable|.
  var commandTable = {};

  /**
   * @param {string} name
   * @param {*} value
   */
  function define(name, value) {
    Object.defineProperty(testing, name, {value: value});
  }

  Object.defineProperties(testing, {
    define: {value: define},
  });
})();

/// TODO(yosin) We should add more end tag omissible tag names.
testing.define('END_TAG_OMISSIBLE', (function() {
  var set = {};
  ['br', 'hr', 'img'].forEach(function(tagName) {
    set[tagName.toUpperCase()] = true;
  });
  return set;
})());

function NOTREACHED() {
  throw new Error('NOTREACHED');
}
