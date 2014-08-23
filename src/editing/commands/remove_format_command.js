// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

// Sample: http://jsfiddle.net/9nf4fue9/1/
editing.defineCommand('removeFormat', (function() {
  // TODO(yosin) We should move |TAG_NAMES_TO_REMOVE| to "content_model.js".
  /** @const */
  var TAG_NAMES_TO_REMOVE = editing.newSet([
        'ABBR', 'ACRONYM', 'B', 'BDI', 'BDO', 'BIG', 'BLINK', 'CITE', 'CODE',
        'DFN', 'EM', 'FONT', 'I', 'INS', 'KBD', 'MARK', 'NOBR', 'Q', 'S',
        'SAMP', 'SMALL', 'SPAN', 'STRIKE', 'STRONG', 'SUB', 'SUP', 'TT', 'U',
        'VAR']);

  /**
   * @param {!editing.EditingContext} context
   * @param {!editing.ReadOnlySelection} selection
   * @return {!Array.<!Node>}
   */
  function prepareForRemoveFormat(context, selection) {
    if (selection.isEmpty)
      return [];
    var selectedNodes = selection.isCaret ?
        [selection.anchorNode] : editing.nodes.computeSelectedNodes(selection);

    var effectiveNodes = selectedNodes;

    // Adjust first node
    {
      var firstNode = selectedNodes[0];
      var styleElement = null;
      for (var runner = firstNode; runner; runner = runner.parentNode) {
        if (!editing.nodes.isPhrasing(runner) ||
            !editing.nodes.isEditable(runner)) {
          break;
        }
        if (isStyleElement(runner))
          styleElement = runner;
      }
      if (styleElement && styleElement !== firstNode) {
        if (firstNode.previousSibling) {
          var newTree = context.splitTree(styleElement, firstNode);
          styleElement = newTree
        }
        effectiveNodes = [];
        for (var runner = styleElement; runner != firstNode;
             runner = editing.nodes.nextNode(runner)) {
          effectiveNodes.push(runner);
        }
        selectedNodes.forEach(function(node) {
          effectiveNodes.push(node);
        });
      }
    }

    // Adjust last node
    var lastNode = lastOf(selectedNodes);
    var styleElement = null;
    for (var runner = firstNode; runner; runner = runner.parentNode) {
      if (!editing.nodes.isPhrasing(runner) ||
          !editing.nodes.isEditable(runner)) {
        break;
      }
      if (isStyleElement(runner))
        styleElement = runner;
    }
    if (!styleElement)
      return effectiveNodes;
    var nextNode = editing.nodes.nextNode(lastNode);
    if (!nextNode || !editing.nodes.isDescendantOf(nextNode, styleElement))
      return effectiveNodes;
    var newTree = context.splitTree(styleElement, nextNode);
    return effectiveNodes;
  }

  function lastOf(array) {
    return array.length ? array[array.length - 1] : null;
  }

  function isStyleElement(node) {
    if (!editing.nodes.isElement(node))
      return false;
    var element = /** @type {!Element} */(node);
    if (element.hasAttribute('class'))
      return false;
    if (TAG_NAMES_TO_REMOVE.has(element.nodeName))
      return true;
    if (!editing.nodes.isPhrasing(element))
      return false;
    return element.hasAttribute('style');
  }

  /**
   * @param {!EditingContext} context
   * @param {boolean} userInterface Not used.
   * @param {string} value Noe used.
   * @return {boolean}
   */
  function removeFormatCommand(context, userInterface, value) {
    if (context.startingSelection.isEmpty) {
      context.setEndingSelection(context.startingSelection);
      return true;
    }

    /** @const */ var selection = editing.nodes.normalizeSelection(
        context, context.startingSelection);
    var selectionTracker = new editing.SelectionTracker(context, selection);
    var effectiveNodes = prepareForRemoveFormat(context, selection);
    if (!effectiveNodes.length) {
      context.setEndingSelection(context.startingSelection);
      return true;
    }

    var styleElements = [];
    var pendingContents = [];
    effectiveNodes.forEach(function(currentNode) {
      var styleElement = lastOf(styleElements);
      if (styleElement && styleElement == currentNode.previousSibling) {
        selectionTracker.willUnwrapElement(styleElement, null);
        context.unwrapElement(styleElement, null);
        styleElements.pop();
      }

      if (!currentNode.hasChildNodes()) {
        if (isStyleElement(currentNode)) {
          selectionTracker.willRemoveNode(currentNode);
          context.removeChild(currentNode.parentNode, currentNode);
        }
        return;
      }

      if (isStyleElement(currentNode))
        styleElements.push(currentNode);
    });

    var lastNode = lastOf(effectiveNodes);
    while (styleElements.length) {
      var styleElement = styleElements.pop();
      var stopChild = lastNode.parent == styleElement ? lastNode.nextSibling :
                                                        null;
      selectionTracker.willUnwrapElement(styleElement, stopChild);
      context.unwrapElement(styleElement, stopChild);
    }

    selectionTracker.finish();
    return true;
  }
  /*
      context.setStyle(node, 'backgroundColor', '');
      context.setStyle(node, 'color', '');
      context.setStyle(node, 'fontFamily', '');
      context.setStyle(node, 'fontSize', '');
      context.setStyle(node, 'fontWeight', '');
      context.setStyle(node, 'textDecoration', '');
  */

  return removeFormatCommand;
})());
