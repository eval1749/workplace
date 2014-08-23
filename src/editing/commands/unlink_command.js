// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

editing.defineCommand('Unlink', (function() {
  /**
   * @param {!editing.ReadOnlySelection} selection
   * @return {!Array.<!Node>}
   */
  function computeEffectiveNodes(selection) {
    if (selection.isEmpty)
      return [];
    var selectedNodes = selection.isCaret ? [selection.anchorNode] :
        editing.nodes.computeSelectedNodes(selection);
    if (!selectedNodes.length)
      return [];

    // Add enclosing A element into effective nodes.
    var firstNode = selectedNodes[0];
    var runner = firstNode;
    while (runner && runner.nodeName != 'A') {
      runner = runner.parentNode;
    }
    if (!runner)
      return selectedNodes;
    if (!editing.nodes.isEditable(runner))
      return [];
    var effectiveNodes = [];
    while (runner != firstNode) {
      effectiveNodes.push(runner);
      runner = editing.nodes.nextNode(runner);
    }
    selectedNodes.forEach(function(node) {
      effectiveNodes.push(node);
    });
    return effectiveNodes;
  }

  function lastOf(array) {
    return array.length ? array[array.length - 1] : null;
  }

 /**
  * @param {!EditingContext} context
  * @param {!Node} parentNode
  * @param {?Node} stopNode
  */
  function unwrapElement(context, parent) {
     var child = parent.firstChild;
     var ancestor = parent.parentNode;
     while (child) {
       var nextSibling = child.nextSibling;
       context.insertBefore(ancestor, child, parent);
       child = nextSibling;
     }
     context.removeChild(ancestor, parent);
  }

  /**
   * @param {!EditingContext} context
   * @param {boolean} userInterface Not used.
   * @param {string} value Noe used.
   * @return {boolean}
   */
  function unlinkCommand(context, userInterface, value) {
    /** @const */ var selection = editing.nodes.normalizeSelection(
        context, context.startingSelection);
    var effectiveNodes = computeEffectiveNodes(selection);
    if (!effectiveNodes.length) {
      context.setEndingSelection(context.startingSelection);
      return true;
    }

    // We'll remove nested anchor elements event if nested anchor elements
    // aren't valid HTML5.
    var anchorElements = [];
    var selectionTracker = new editing.SelectionTracker(context, selection);
    effectiveNodes.forEach(function(currentNode) {
      var lastAnchorElement = lastOf(anchorElements);
      if (lastAnchorElement &&
          lastAnchorElement === currentNode.previousSibling) {
        selectionTracker.willUnwrapElement(lastAnchorElement);
        unwrapElement(context, lastAnchorElement);
        anchorElements.pop();
      }

      if (!currentNode.hasChildNodes()) {
        if (currentNode.nodeName == 'A') {
          selectionTracker.willRemoveNode(currentNode);
          context.removeChild(currentNode.parentNode, currentNode);
        }
        return;
      }

      if (currentNode.nodeName == 'A')
        anchorElements.push(currentNode);
    });

    while (anchorElements.length) {
      var anchorElement = anchorElements.pop();
      selectionTracker.willUnwrapElement(anchorElement);
      unwrapElement(context, anchorElement);
    }

    selectionTracker.finish();
    return true;
  }

  return unlinkCommand;
})());
