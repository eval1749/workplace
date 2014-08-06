// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

editing.define('createLink', (function() {
  /*
   * Insert an A element, link and content are specified URL, before selection
   * focus position.
   * @param {!editing.EditingContext} context
   * @param {string} url
   */
  function createLinkBeforeCaret(context, url) {
    console.assert(url != '');

    var anchorElement = context.createElement('a');
    anchorElement.setAttribute('href', url);
    anchorElement.appendChild(context.createTextNode(url));

    /** @const @type {!editing.EditingSelection} */
    var selection = context.selection;

    /** @const @type {!editing.EditableNode} */
    var containerNode = selection.focusNode;

    /** @const @type {?editing.EditableNode} */
    var caretNode = containerNode.childNodes[selection.focusOffset];

    if (!containerNode.isEditable)
      throw new Error('Selection should be in editable element.');

    var ancestors = [];
    var interactive = null;
    for (var runner = containerNode; runner; runner = runner.parentNode) {
      if (runner.isInteractive)
        interactive = runner;
      ancestors.push(runner);
    }

    if (!interactive) {
      // Insert anchor element before caret.
      containerNode.insertBefore(anchorElement, caretNode);
      var offset = anchorElement.nodeIndex;
      context.setEndingSelection(new editing.ReadOnlySelection(
          containerNode, offset, containerNode, offset + 1,
          editing.SelectionDirection.ANCHOR_IS_START));
      return true;
    }

    var editable = interactive.parentNode;
    if (!editable || !editable.isEditable) {
      // We can't insert anchor element before/after focus node.
      return false;
    }

    // Shrink ancestors to child of |editable|.
    while (ancestors[ancestors.length - 1] != editable) {
      ancestors.pop();
    }
    ancestors.pop();

    var anchorTree = ancestors.reverse().reduce(
        function(previousValue, currentValue) {
          if (currentValue.isInteractive)
            return previousValue;
          var newNode = currentValue.cloneNode(false);
          newNode.appendChild(previousValue);
          return newNode;
       }, anchorElement);

    if (!caretNode) {
      editable.insertAfter(anchorTree, interactive);
    } else if (selection.focusOffset) {
      var followingTree = interactive.splitTree(caretNode);
      editable.insertAfter(anchorTree, interactive);
      editable.insertAfter(followingTree, anchorTree);
    } else {
      editable.insertBefore(anchorTree, interactive);
    }

    var offset = anchorElement.nodeIndex;
    context.setEndingSelection(new editing.ReadOnlySelection(
        anchorElement.parentNode, offset,
        anchorElement.parentNode, offset + 1,
        editing.SelectionDirection.ANCHOR_IS_START));
    return true;
  }

  /**
   * @param {!editable.EditingContext} context
   * @param {string} url
   * @return {boolean}
   */
  function createLinkForRange(context, url) {
    console.assert(url != '');

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
    if (url == '')
      return false;
    if (context.selection.isEmpty)
      return false;
    if (context.selection.isCaret) {
      return createLinkBeforeCaret(context, url);
    }
    return createLinkForRange(context, url);
  }

  return createLink;
})());
