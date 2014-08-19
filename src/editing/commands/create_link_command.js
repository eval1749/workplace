// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

editing.defineCommand('CreateLink', (function() {
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

    function removeTrailingWhitespaces(anchorElement) {
      // Remove trailing invisible nodes.
      var lastChild;
      while (lastChild = anchorElement.lastChild) {
        if (editing.library.isVisibleNode(lastChild))
          break;
        console.log('wrapByAnchor remove trailing whitespaces');
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
console.log('insertNewAnchorElement phrase=' + anchorPhraseNode);
      if (editing.library.isWhitespaceNode(anchorPhraseNode))
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
      console.log('wrapByAnchor anchor=' + anchorElement, 'node=' + node,
                  anchorElement && (anchorElement.parentNode == node.parentNode));
      if (!anchorElement) {
        if (!editing.library.isVisibleNode(node)) {
          // We don't have leading whitespaces in anchor element.
          return;
        }
        anchorElement = insertNewAnchorElement(node);
        return;
      }
      if (anchorElement.parentNode != node.parentNode) {
        endAnchorElement();
        wrapByAnchor(node);
        return;
      }
      anchorElement.appendChild(node);
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
      console.log('createLinkForRange no nodes.');
      return createLinkBeforeCaret(context, url);
    }

    var pendingContainers = [];
    var pendingContents = [];

    function moveLastContainerToContents() {
console.log('moveLastContainerToContents');
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
console.log('processPendingContents');
      pendingContents.forEach(wrapByAnchor);
      endAnchorElement();
      pendingContainers = [];
      pendingContents = [];
    }

    var selectionTracker = new editing.SelectionTracker(context);

    // Handling of start node
    var startNode = effectiveNodes[0];
    // TODO(yosin) We should split at |startNode| if |startNode| is in
    // interactive element.
    // For compatibility with Firefox and IE, we don't split A element
    // which is parent of |startNode|.
    // Example:
    //  <a href="foo">^fo|o</a> => ^<a href="URL">foo</a>|
    if (startNode.parentNode.nodeName == 'A')
      anchorElement = startNode.parentNode;

    effectiveNodes.forEach(function(currentNode) {
console.log('createLinkForRange node=' + currentNode,
            'isPhrasing', currentNode.isPhrasing,
            'anchorElement=' + anchorElement,
            'interactive', isInteractive(currentNode),
            'pendingContainer.last=' + lastOf(pendingContainers),
            'current.prev=' + currentNode.previousSibling);

      var lastPendingContainer = lastOf(pendingContainers);
      if (lastPendingContainer &&
          lastPendingContainer === currentNode.previousSibling) {
        moveLastContainerToContents();
      }

      if (!currentNode.isEditable || !currentNode.isPhrasing) {
        processPendingContents();
        endAnchorElement();
        return;
      }

      if (isInteractive(currentNode)) {
        processPendingContents();
        if (anchorElement)
          anchorElement.setAttribute('href', url);
        anchorElement = null;
        if (currentNode.nodeName != 'A')
          return;
        currentNode.setAttribute('href', url);
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
      // Note: Firefox and IE don't insert anchor element for caret.
      // IE returns true event if it doesnt' insert anchor element.
      return createLinkBeforeCaret(context, url);
    }
    return createLinkForRange(context, url);
  }

  /**
   * @param {!EditingContext} context
   * @return {!Array.<EditingNode>}
   */
  function getEffectiveNodes(context) {
    var nodes = context.selection.nodes;
    if (!nodes.length)
      return nodes;
    var firstNode = nodes[0];
    for (var ancestor = firstNode.parentNode; ancestor;
         ancestor = ancestor.parentNode) {
      if (!ancestor.isEditable)
        break;
      if (ancestor.firstChild !== firstNode)
        break;
      // TODO(yosin) We should use more efficient way to check |ancestor| is
      // in selection.
      var lastNode = editing.library.lastWithIn(ancestor);
      if (nodes.findIndex(function(x) { return x == lastNode; }) < 0)
        break;
      nodes.unshift(ancestor);
      firstNode = ancestor;
    }
    return nodes;
  }
  return createLinkCommand;
})());
