// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';


// IE11 incompatibilities:
// - document.implementation.createHTMLDocument(opt_title), opt_title is
//   required parameter.
// - Selection.extend(node, offset) is missing.

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

if (!('Set' in this)) {
  this.Set = (function() {
    // Support string only
    function Set(iterable) {
      this.members_ = {};
      if (Array.isArray(iterable)) {
        iterable.forEach(function(member) {
          this.members_[member] = true;
        }, this);
      }
    }

    function setAdd(newMember) {
      this.members_[newMember] = true;
    }

    function setHas(member) {
      return Boolean(this.members_[member]);
    }

    function setSize() {
      return Object.keys(this.members_).length;
    }
    Object.defineProperties(Set.prototype, {
      add: {value: setAdd},
      has: {value: setHas},
      size: {get: setSize}
    });
    return Set;
  })();
}
