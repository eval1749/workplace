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

  /**
   * @return {boolean}
   */
  function isIE() {
    return window.navigator.userAgent.indexOf('Trident/') > 0;
  }

  Object.defineProperties(testing, {
    define: {value: define},
    isIE: {get: isIE},
  });
})();

/// TODO(yosin) We should add more end tag omissible tag names.
testing.define('END_TAG_OMISSIBLE', (function() {
  var omissibleTagNames = new Set();
  ['br', 'hr', 'img'].forEach(function(tagName) {
    omissibleTagNames.add(tagName.toUpperCase());
    omissibleTagNames.add(tagName);
  });
  return omissibleTagNames;
})());

function NOTREACHED() {
  throw new Error('NOTREACHED');
}
