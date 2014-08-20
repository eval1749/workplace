// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

editing.defineCommand('CreateLink', (function() {
  // Note: Firefox and IE don't insert anchor element for caret.
  // IE returns true event if it doesnt' insert anchor element.
  /** @const */ var INSERT_LINK_FOR_CARET = false;

  /*
   * Insert an A element, link and content are specified URL, before selection
   * focus position.
   * @param {!editing.EditingContext} context
   * @param {string} url
   */
  function createLinkBeforeCaret(context, url) {
    console.assert(url != '', 'url must be non-empty string');
    var editor = context.editor;

    var anchorElement = context.createElement('a');
    anchorElement.setAttribute('href', url);
    anchorElement.appendChild(context.createTextNode(url));

    /** @const @type {!editing.EditingSelection} */
    var selection = context.selection;

    /** @const @type {!editing.EditableNode} */
    var containerNode = selection.focusNode;

    /** @const @type {?editing.EditableNode} */
    var caretNode = containerNode.childNodes[selection.focusOffset];

    if (!containerNode.isContentEditable)
      throw new Error('Caret should be in editable element.' +
                      String(containerNode));

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
    if (!editable || !editable.isContentEditable) {
      // We can't insert anchor element before/after focus node.
      context.setEndingSelection(context.startingSelection);
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
      var followingTree = editor.splitTree(interactive, caretNode);
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
    var editor = context.editor;

    function canMerge(node){
      return node && node.nodeName == 'A' &&
             node.getAttribute('href') == url &&
             node.attributes.length == 1;
    }

    function removeTrailingWhitespaces(anchorElement) {
      // Remove trailing invisible nodes.
      var lastChild;
      while (lastChild = anchorElement.lastChild) {
        if (editing.nodes.isVisibleNode(lastChild))
          break;
        anchorElement.parentNode.insertAfter(lastChild, anchorElement);
      }
    }

    // TODO(yosin) Once we have ES6 |Map|, we should use it.
    var isInteractiveCache = {};
    /**
     * @param {!EditingNode} node
     * @return {boolean}
     */
    function isInteractive(node) {
      var value = isInteractiveCache[node.hashCode];
      if (value !== undefined)
        return value;
      var value = node.isInteractive ||
          (node.parentNode && isInteractive(node.parentNode))
      isInteractiveCache[node.hasCode] = value;
      return value;
    }

    function insertNewAnchorElement(anchorPhraseNode) {
      if (editing.nodes.isWhitespaceNode(anchorPhraseNode))
        return null;
      var anchorElement = context.createElement('a');
      anchorElement.setAttribute('href', url);
      anchorPhraseNode.parentNode.replaceChild(anchorElement, anchorPhraseNode);
      anchorElement.appendChild(anchorPhraseNode);
      return anchorElement;
    }

    function lastOf(array) {
      return array.length ? array[array.length - 1] : null;
    }

    var anchorElement = null;
    function wrapByAnchor(node) {
      if (!anchorElement) {
        if (!editing.nodes.isVisibleNode(node)) {
          // We don't have leading whitespaces in anchor element.
          return;
        }
        var nextSibling = node.nextSibling;
        if (canMerge(nextSibling)) {
          // See w3c.26, w3c.30
          anchorElement = nextSibling;
          return;
        }
        var previousSibling = node.previousSibling;
        if (canMerge(previousSibling)) {
          // See w3c.27
          anchorElement = previousSibling;
          anchorElement.appendChild(node);
          return;
        }
        anchorElement = insertNewAnchorElement(node);
        return;
      }
      if (editing.nodes.isDescendantOf(node, anchorElement)) {
        // See w3c.44
        return;
      }
      if (node.parentNode == anchorElement.parentNode) {
        anchorElement.appendChild(node);
        return;
      }
      endAnchorElement();
      wrapByAnchor(node);
    }

    function endAnchorElement() {
      if (!anchorElement)
        return;
      removeTrailingWhitespaces(anchorElement);
      anchorElement = null;
    }

    var selection = context.selection;
    var effectiveNodes = getEffectiveNodes(context);
    if (!effectiveNodes.length) {
      if (INSERT_LINK_FOR_CARET)
        return createLinkBeforeCaret(context, url);
      context.setEndingSelection(context.startingSelection);
      return true;
    }

    var pendingContainers = [];
    var pendingContents = [];

    function moveLastContainerToContents() {
      // All descendant of |lastPendingContainer| can be contents of anchor.
      var lastContainer = pendingContainers.pop();
      while (pendingContents.length &&
             lastOf(pendingContents).parentNode == lastContainer) {
        pendingContents.pop();
      }
      if (pendingContainers.length) {
        pendingContents.push(lastContainer);
        return;
      }
      wrapByAnchor(lastContainer);
    }

    // Wrap pending contents which are sibling of |stopNode|
    function processPendingContents() {
      pendingContents.forEach(wrapByAnchor);
      endAnchorElement();
      pendingContainers = [];
      pendingContents = [];
    }

    var selectionTracker = new editing.SelectionTracker(context);

    // Special handling of start node, see w3c.30, w3c.40.
    var startNode = effectiveNodes[0];
    var outerAnchorElement = startNode.parentNode;
    while (outerAnchorElement) {
      if (outerAnchorElement.nodeName == 'A')
        break;
      outerAnchorElement = outerAnchorElement.parentNode;
    }
    if (outerAnchorElement) {
      // Note: Even if A element has "name" or other attributes, we
      // override "href" as IE11. See w3c.46, w3c.47.
      var allNodesInAnchor = effectiveNodes.every(function(node) {
        return editing.nodes.isDescendantOf(node, outerAnchorElement);
      });
      if (allNodesInAnchor) {
        // Special case for compatibility with Firefox and IE.
        // See w3c.32, w3c.33
        outerAnchorElement.setAttribute('href', url);
        selectionTracker.setEndingSelection();
        return true;
      }

      if (outerAnchorElement.getAttribute('href') == url) {
        anchorElement = outerAnchorElement;
      } else {
        // Move |startNode| out of anchor element.
        if (startNode.nextSibling) {
          var newAnchorElement = context.splitNode(outerAnchorElement,
                                                   startNode.nextSibling);
          context.insertAfter(newAnchorElement, outerAnchorElement);
        }
        context.insertAfter(startNode, outerAnchorElement);
      }
    }

    effectiveNodes.forEach(function(currentNode) {
      if (currentNode == anchorElement)
        return;

      var lastPendingContainer = lastOf(pendingContainers);
      if (lastPendingContainer &&
          lastPendingContainer === currentNode.previousSibling) {
        moveLastContainerToContents();
      }

      if (!currentNode.isEditable || !currentNode.isPhrasing) {
        processPendingContents();
        return;
      }

      if (currentNode.nodeName == 'A') {
        if (!anchorElement) {
          processPendingContents();
          anchorElement = currentNode;
          anchorElement.setAttribute('href', url);
          return;
        }
        console.assert(anchorElement.getAttribute('href') == url);
        currentNode.setAttribute('href', url);
        if (canMerge(currentNode)) {
          var child = currentNode.firstChild;
          while (child) {
            var next = child.nextSibling;
            currentNode.parentNode.insertBefore(child, currentNode);
            child = next;
          }
          selectionTracker.willRemoveNode(currentNode);
          currentNode.parentNode.removeChild(currentNode);
          return;
        }
        processPendingContents();
        anchorElement = currentNode;
      }

      if (currentNode.isInteractive) {
        processPendingContents();
        return;
      }

      if (currentNode.hasChildNodes()) {
        pendingContainers.push(currentNode);
        return;
      }

      if (pendingContainers.length) {
        pendingContents.push(currentNode);
        if (!currentNode.nextSibling)
          moveLastContainerToContents();
        return;
      }
      wrapByAnchor(currentNode);
    });

    if (pendingContents.length) {
      // The last effective node is descendant of pending container.
      // Example: foo<b>^bar<i>baz quux</i></b>|mox
      // where the last effective node is "baz quux".
      processPendingContents();
    }

    selectionTracker.setEndingSelection();
    return true;
  }

  /**
   * @param {!EditingContext} context
   * @param {boolean} userInterface
   * @param {string} url
   * @return {boolean}
   */
  function createLinkCommand(context, userInterface, url) {
    if (url == '' || context.selection.isEmpty) {
      context.setEndingSelection(context.startingSelection);
      return false;
    }
    if (context.selection.isCaret) {
      if (INSERT_LINK_FOR_CARET)
        return createLinkBeforeCaret(context, url);
      context.setEndingSelection(context.startingSelection);
      return true;
    }
    return createLinkForRange(context, url);
  }

  /**
   * @param {!EditingContext} context
   * @return {!Array.<EditingNode>}
   */
  function getEffectiveNodes(context) {
    var nodesInRange = context.selection.nodes;
    if (!nodesInRange.length)
      return nodesInRange;
    var firstNode = nodesInRange[0];
    for (var ancestor = firstNode.parentNode; ancestor;
         ancestor = ancestor.parentNode) {
      if (!ancestor.isEditable)
        break;
      if (ancestor.firstChild !== firstNode)
        break;
      // TODO(yosin) We should use more efficient way to check |ancestor| is
      // in selection.
      var lastNode = editing.nodes.lastWithIn(ancestor);
      if (nodesInRange.findIndex(function(x) { return x == lastNode; }) < 0)
        break;
      nodesInRange.unshift(ancestor);
      firstNode = ancestor;
    }
    return nodesInRange;
  }

  function isModifiableAnchorElement(element) {
    switch (element.attributes.length) {
      case 0:
        return true;
      case 1:
        return element.hasAttribute('href');
      default:
        return false;
    }
  }

  return createLinkCommand;
})());
