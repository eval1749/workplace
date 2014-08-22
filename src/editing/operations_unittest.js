// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file./*

function createHtmlGetter(element) {
  return function() {
    return element.outerHTML.toLowerCase();
  }
}

//
// AppendChild
//
testCaseWithSample('operations.appendChild.1',
    '|<p>foo</p>',
    function(context, selection) {
      var parentNode = context.document.body.firstChild;
      var newChild = context.createElement('bar');
      var operation = new editing.AppendChild(parentNode, newChild);

      operation.redo();
      expectEq('<p>foo<bar></bar></p>', createHtmlGetter(parentNode));

      operation.undo();
      expectEq('<p>foo</p>', createHtmlGetter(parentNode));
    });

//
// InsertBefore
//
testCaseWithSample('operations.insertBefore.1',
    '|<p>foo</p>',
    function(context, selection) {
      var parentNode = context.document.body.firstChild;
      var newChild = context.createElement('bar');
      var operation = new editing.InsertBefore(parentNode, newChild,
                                               parentNode.firstChild);
      operation.redo();
      expectEq('<p><bar></bar>foo</p>', createHtmlGetter(parentNode));

      operation.undo();
      expectEq('<p>foo</p>', createHtmlGetter(parentNode));
    });

//
// RemoveChild
//
testCaseWithSample('operations.removeChild.1',
    '|<p>foo</p>',
    function(context, selection) {
      var parentNode = context.document.body.firstChild;
      var oldChild = parentNode.firstChild;
      var operation = new editing.RemoveChild(parentNode, oldChild);
      operation.redo();
      expectEq('<p></p>', createHtmlGetter(parentNode));

      operation.undo();
      expectEq('<p>foo</p>', createHtmlGetter(parentNode));
    });

//
// ReplaceChild
//
testCaseWithSample('operations.replceChild.1',
    '|<p>foo</p>',
    function(context, selection) {
      var parentNode = context.document.body.firstChild;
      var newChild = context.createTextNode('bar');
      var oldChild = parentNode.firstChild;
      var operation = new editing.ReplaceChild(parentNode, newChild, oldChild);
      operation.redo();
      expectEq('<p>bar</p>', createHtmlGetter(parentNode));

      operation.undo();
      expectEq('<p>foo</p>', createHtmlGetter(parentNode));
    });
