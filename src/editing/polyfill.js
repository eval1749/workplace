// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

if (!Math.sign) {
  Math.sign = function(x) {
    if (isNaN(x))
      return NaN;
    if (x === 0)
      return x;
    return x > 0 ? 1 : -1;
  }
}

if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(text) {
    return !this.indexOf(text);
  }
}


// IE11 incompatibilities:
// - document.implementation.createHTMLDocument(opt_title), opt_title is
//   required parameter.
// - Selection.extend(node, offset) is missing.
