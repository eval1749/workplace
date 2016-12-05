// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @typedef {{
 *  CONTENT_CATEGORY: string,
 *  AppendChild: !function(!Node, !Node),
 *  InsertBefore: !function(!Node, !Node, ?Node),
 *  RemoveAttribute: !function(!Node, string),
 *  RemoveChild: !function(!Node, !Node),
 *  ReplaceChild: !function(!Node, !Node, !Node),
 *  SetAttribute: !function(!Node, string),
 *  SetStyle: !function(!Node, string, string),
 *  SplitText: !function(!Text, number),
 *  contentModel: !Object.<string, !ContentModel>,
 *  define: function(string, !function()),
 *  defineCommand: function(string, !function()),
 *  getOrCreateEditor: function(!Document) : !Editor,
 *  isContentEditable: function(!Node) : boolean,
 *  lookupCommand: function(string) : ?function(),
 *  newSet: function(!Array) : !Set,
 *  nodes: {
 *    isDescendantOf: function(!Node, !Node) : boolean,
 *    isElement: function(!Node) : boolean,
 *    isText: function(!Node) : boolean,
 *    maxOffset: function(!Node) : number
 *  }
 * }}
 */
var editing;

/**
 * @typedef {function(string, boolean=, string=) : boolean}
 */
var CommandFunction;

/**
 * @typedef {{
 *  categories: string,
 *  contextModel: (!Array.<string>|!Set.<string>),
 *  usableContexts: (!Array.<string>|!Set.<string>)
 * }}
 */
var ContentModel;

/** @enum {string} */
var CONTENT_CATEGORY = {
  EMBEDDED: 'EMBEDDED',
  FLOW: 'FLOW',
  HEADING: 'HEADING',
  INTERACTIVE: 'INTERACTIVE',
  PALPABLE: 'PALPABLE',
  PHRASING: 'PHRASING',
  SECTIONING_ROOT: 'SECTIONING_ROOT',
  TRANSPARENT: 'TRANSPARENT',
};

/** @enum {string} */
var SelectionDirection = {
  ANCHOR_IS_START: 'ANCHOR_IS_START',
  FOCUS_IS_START: 'FOCUS_IS_START'
};
