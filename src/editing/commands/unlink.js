// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

editing.defineCommand('Unlink', (function() {
 /**
  * @param {!EditingNode} parentNode
  * @param {?EditingNode} stopNode
  */
 function moveChildNodesBeforeParentNode(parentNode, stopNode) {
    var child = parentNode.firstChild;
    while (child) {
      var nextSibling = child.nextSibling;
      parentNode.parentNode.insertBefore(child, parentNode);
      child = nextSibling;
    }
 }

  /**
   * @param {!EditingContext} context
   * @param {boolean} userInterface Not used.
   * @param {string} value Noe used.
   * @return {boolean}
   */
  function unlinkCommand(context, userInterface, value) {
    var selection = context.selection;

    if (!selection.isRange) {
      context.setEndingSelection(context.startingSelection);
      return true;
    }

    var anchorElement = selection.anchorNode.commonAncestor(
        selection.focusNode);
    if (anchorElement.nodeName == 'A') {
      moveChildNodesBeforeParentNode(anchorElement, null);
      anchorElement.parentNode.removeChild(anchorElement);
      if (selection.anchorNode === selection.focusNode) {
        var offset = Math.max(selection.anchorOffset, selection.focusOffset);
        context.setEndingSelection(new editing.ReadOnlySelection(
            selection.anchorNode, offset, selection.anchorNode, offset,
            editing.SelectionDirection.ANCHOR_IS_START));
      } else {
        context.setEndingSelection(context.startingSelection);
      }
      return true;
    }

console.log('unlinkCommand ====');
    var endNode = null;
    var endOffset = 0;
    var startNode = null;
    var startOffset = 0;
    var anchorElements = [];
    var anchorElement = null;
    // TODO(yosin) We should not split text nodes at boundary points.
    context.selection_.nodes.forEach(function(node) {
console.log('unlinkCommand node=' + node);
      while (anchorElement) {
        if (node.isDescendantOf(anchorElement)) {
          if (anchorElement != node.parentNode)
            return;
          anchorElement.parentNode.insertBefore(node, anchorElement);
          endNode = anchorElement.parentNode;
          endOffset = node.nodeIndex + 1;
          if (!startNode) {
            startNode = endNode;
            startOffset = endOffset - 1;
          }
          return;
        }
        anchorElement.parentNode.removeChild(anchorElement);
        anchorElements.pop();
        if (anchorElements.length)
          anchorElement = anchorElements[anchorElements.length - 1];
        else
          anchorElement = null;
      }

      anchorElement = node;
      while (anchorElement && anchorElement.nodeName != 'A') {
        anchorElement = anchorElement.parentNode;
      }
      if (!anchorElement || !anchorElement.isEditable ||
          !anchorElement.hasAttribute('href')) {
        anchorElement = null;
        return;
      }

      var parentNode = anchorElement.parentNode;

      // Firefox removes A element even if it has non-HREF attributes.
      if (editing.DO_NOT_REMOVE_A_HAVING_OTHER_THAN_HREF) {
        if (anchorElement.attributeNames.length > 1) {
          endNode = node;
          endOffset = node.childNodes.length;
          if (!startNode) {
            startNode = endNode;
            startOffset = endOffset;
          }
          node.removeAttribute('href');
          anchorElement = null;
          return;
        }
      }

      anchorElements.push(anchorElement);
      if (anchorElement != node) {
        var nextSibling = node.nextSibling;
        moveChildNodesBeforeParentNode(anchorElement, nextSibling);
        endNode = parentNode;
        endOffset = node.nodeIndex + 1;
        if (!startNode) {
          startNode = endNode;
          //startOffset = nextSibling ? endOffset -1 : endOffset;
          startOffset = endOffset - 1;
        }
      }
    });

console.log('unlinkCommand start=' + startNode + ' ' + startOffset + ', end=' +
    endNode + ' ' + endOffset);

    while (anchorElements.length) {
      var anchorElement = anchorElements.pop();
      moveChildNodesBeforeParentNode(anchorElement, null);
      anchorElement.parentNode.removeChild(anchorElement);
    }

    if (!startNode) {
      context.setEndingSelection(context.startingSelection);
    } else {
      context.setEndingSelection(new editing.ReadOnlySelection(
         startNode, startOffset, endNode, endOffset,
         editing.SelectionDirection.ANCHOR_IS_START));
    }
    return true;
  }

  return unlinkCommand;
})());
