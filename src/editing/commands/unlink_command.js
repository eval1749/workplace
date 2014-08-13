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
   * @return {boolean}
   */
  function unlinkForCaret(context) {
    var selection = context.selection;
    var anchorElement = selection.focusNode;
    while (anchorElement && anchorElement.nodeName != 'A') {
      anchorElement = anchorElement.parentNode;
    }
    if (!anchorElement || !anchorElement.isEditable) {
      context.setEndingSelection(context.startingSelection);
      return true;
    }
    var nodeAtCaret = selection.focusNode.childNodes[selection.focusOffset];
    moveChildNodesBeforeParentNode(anchorElement, null);
    var containerNode = nodeAtCaret ? nodeAtCaret.parentNode :
                                      selection.focusNode.parentNode;
    var offset = nodeAtCaret ? nodeAtCaret.nodeIndex : selection.focusOffset;
    anchorElement.parentNode.removeChild(anchorElement);
    context.setEndingSelection(new editing.ReadOnlySelection(
        containerNode, offset, containerNode, offset,
        editing.SelectionDirection.ANCHOR_IS_START));
    return true;
  }

  /**
   * @param {!EditingContext} context
   * @param {boolean} userInterface Not used.
   * @param {string} value Noe used.
   * @return {boolean}
   */
  function unlinkCommand(context, userInterface, value) {
    var selection = context.selection;
    if (selection.isEmpty) {
      context.setEndingSelection(context.startingSelection);
      return true;
    }

    if (selection.isCaret)
      return unlinkForCaret(context);

    // We'll remove nested anchor elements event if nested anchor elements
    // aren't valid HTML5.
    var anchorElements = [];
    var anchorElement = null;
    var anchorNode = selection.anchorNode;
    var anchorOffset = selection.anchorOffset;
    var focusNode = selection.focusNode;
    var focusOffset = selection.focusOffset;

    // TODO(yosin) We should not split text nodes at boundary points if
    // they aren't inside A element.
    selection.nodes.forEach(function(node) {
      while (anchorElement) {
        if (node.isDescendantOf(anchorElement)) {
          if (anchorElement != node.parentNode)
            return;
          anchorElement.parentNode.insertBefore(node, anchorElement);
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
      if (!anchorElement || !anchorElement.isEditable) {
        anchorElement = null;
        return;
      }

      // Relocate anchor/focus points
      if (anchorNode === anchorElement) {
        anchorNode = anchorNode.parentNode;
        anchorOffset += anchorElement.nodeIndex;
      }

      if (focusNode === anchorElement) {
        focusNode = focusNode.parentNode;
        focusOffset += anchorElement.nodeIndex;
      }

      anchorElements.push(anchorElement);
      if (anchorElement == node)
        return;

      moveChildNodesBeforeParentNode(anchorElement, node.nextSibling);
    });

    while (anchorElements.length) {
      var anchorElement = anchorElements.pop();
      moveChildNodesBeforeParentNode(anchorElement, null);
      anchorElement.parentNode.removeChild(anchorElement);
    }

    context.setEndingSelection(new editing.ReadOnlySelection(
       anchorNode, anchorOffset, focusNode, focusOffset,
       selection.direction));
    return true;
  }

  return unlinkCommand;
})());
