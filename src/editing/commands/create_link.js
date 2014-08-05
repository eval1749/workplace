// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

editing.define('createLink', (function() {
  // Insert an A element, link and content are specified URL, before selection
  // focus position.
  function createLinkAtCaret(context, url) {
    var anchorElement = context.createElement('a');
    anchorElement.setAttribue(anchorElement, 'href', url);
    anchorElement.appendChild(context.createTextNode(url));

    var selection = context.selection;
    var containerNode = selection.focusNode;
    var caretNode = containerNode;
    if (containerNode.isText) {
      containerNode = caretNode.parentNode;
      if (selection.focusOffset)
        caretNode = null;
    } else {
      caretNode = containerNode[selection.focusOffset];
    }
    if (containerNode.isInteractive) {
      if (!containerNode.parentNode.isEditable) {
        // We can't insert anchor element before/after focus node.
        return false;
      }
      if (caretNode) {
        // <a>foo|bar</a> => <a>foo</a><a>url</a><a>bar</a>
        var followingTree = containerNode.splitTree(caretNode);
        containerNode.parentNode.insertBefore(anchorElement, followingTree);
      } else {
        // <a>foobar|</a> => <a>foobar</a><a>url</a>
        containerNode.parentNode.insertAfter(anchorElement, containerNode);
      }
    } else {
      // <b>foo|bar</b> => <b>foo[<a>url</a>]bar</b>
      containerNode.insertBefore(anchorElement, focusNode);
    }
    context.selection.enclose(anchorElement);
    return false;
  }

  function createLinkForRange(context) {
    var firstAnchorElement = null;
    var lastAnchorElement = null;
    function createAnchorElement() {
        anchorElement = context.createElement('a');
        anchorElement.setAttribute('href', url);
        if (!firstAnchorElement)
          firstAnchorElement = anchorElement;
        lastAnchorElement = anchorElement;
    }

    var nodeIterator = context.selection.createNodeIterator();
    var anchorElement = null;
    var pendingNodes = [];
    var iteratorResult;
    while (!(iteratorResult = nodeIterator.next()).done) {
      var currentNode = iteratorResult.value;
      if (currentNode.isInteractive()) {
        anchorElement = null;
        continue;
      }

      if (currentNode.isEditable && currentNode.isPhrasing) {
        if (currentNode.hasChildren()) {
          pendingNodes.push(currentNode);
        } else if (pendingNodes.length) {
          if (currentNode.nextSibling ||
              currentNode.parentNode === pendingNodes[0]) {
            pendingNodes.push(currentNode);
          } if (anchorElement) {
            anchorElement.appendChild(pendingNodes[0]);
            pendingNodes = [];
          } else {
            anchorElement = createAnchorElement();
            pendingNodes[0].parentNode.replaceChild(anchorElement,
                                                    pendingNodes[0]);
            pendingNodes = [];
          }
        } else if (anchorElement) {
          anchorElement.appendChild(currentNode);
        } else {
          anchorElement = createAnchorElement();
          currentNode.parentNode.replaceChild(anchorElement, curretNode);
        }
        continue;
      }

      anchorElement = null;
      if (!pendingNodes.length)
        continue;
      nodeIterator.splitTreeBefore(pendingNodes[0], curretNode);
    }

    if (pendingNodes.length) {
      var firstPendingNode = pendingNodes[0];
      var lastPendingNode = pendingNodes[pendingNodes.length - 1];
      if (lastPendingNode.nextSibling) {
          firstPendingNode.splitTreeBefore(lastPendingNode);
      } else if (anchorElement) {
        anchorElement.appendChild(firstPendingNode);
      } else {
        anchorElement = createAnchorElement();
        firstPendingNode.parentNode.replaceChild(anchorElement,
                                                 firstPendingNode);
      }
    }

    if (firstAnchorElement && lastAnchorElement) {
      context.setSelection(positionAtNode(firstAnchorElement),
                           positionAfterNode(lastAnchorElement));
    }
    return false;
  }

  /**
   * @param {!EditingContext} context
   * @param {string} url
   * @return {boolean}
   */
  function createLink(context, url) {
    if (context.selection.isEmpty)
      return false;
    if (context.selection.isCaret) {
      createLinkAtCaret(context, url);
      return false;
    }
    createLinkForRange(context, url);
    return false;
  }

  return createLink;
})());
