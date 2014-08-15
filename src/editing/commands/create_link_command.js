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

    var selection = context.selection;
    if (!selection.nodes.length) {
console.log('createLinkForRange no nodes.');
      context.setEndingSelection(context.startingSelection);
      return false;
    }

console.log('createLinkForRange anchor=' + selection.anchorNode + ' ' + selection.anchorOffset +' focus=' + selection.focusNode + ' ' + selection.focusOffset);
    var anchorBoundaryPoint = {};
    if (!selection.anchorNode.hasChildNodes()) {
      anchorBoundaryPoint.type = 'beforeAllChildren';
      anchorBoundaryPoint.node = selection.anchorNode;
    } else if (selection.anchorNode.maxOffset == selection.anchorOffset) {
      anchorBoundaryPoint.type = 'afterAllChildren';
      anchorBoundaryPoint.node = selection.anchorNode.lastChild;
    } else {
      anchorBoundaryPoint.type = 'itself';
      anchorBoundaryPoint.node = selection.anchorNode.childNodes[selection.anchorOffset];
    }

    var focusBoundaryPoint = {};
    if (!selection.focusNode.hasChildNodes()) {
      focusBoundaryPoint.type = 'beforeAllChildren';
      focusBoundaryPoint.node = selection.focusNode;
    } else if (selection.focusNode.maxOffset == selection.focusOffset) {
      focusBoundaryPoint.type = 'afterAllChildren';
      focusBoundaryPoint.node = selection.focusNode.lastChild;
    } else {
      focusBoundaryPoint.type = 'itself';
      focusBoundaryPoint.node = selection.focusNode.childNodes[selection.focusOffset];
    }

    var anchorElement = null;
    var pendingNodes = [];

    // Handling of start node
    var startNode = selection.nodes[0];
    // TODO(yosin) We should split at |startNode| if |startNode| is in
    // interactive element.
    // For compatibility with Firefox and IE, we don't split A element
    // which is parent of |startNode|.
    // Example:
    //  <a href="foo">^fo|o</a> => ^<a href="URL">foo</a>|
    if (startNode.parentNode.nodeName == 'A') {
      anchorElement = startNode.parentNode;
    }

    getEffectiveNodes(context).forEach(function(currentNode) {
console.log('createLinkForRange node=' + currentNode, 'isPhrasing', currentNode.isPhrasing, 'anchorElement=' + anchorElement, 'pendingNodes', pendingNodes.length, 'interactive', isInteractive(currentNode));
      if (isInteractive(currentNode)) {
        if (anchorElement)
          anchorElement.setAttribute('href', url);
        anchorElement = null;
        if (currentNode.nodeName != 'A')
          return;
        currentNode.setAttribute('href', url);
        return;
      }

      if (currentNode.isEditable && currentNode.isPhrasing) {
        if (currentNode.hasChildNodes()) {
          pendingNodes.push(currentNode);
        } else if (pendingNodes.length) {
          if (currentNode.nextSibling ||
              currentNode.parentNode === pendingNodes[0]) {
            pendingNodes.push(currentNode);
          } if (anchorElement) {
            anchorElement.appendChild(pendingNodes[0]);
            pendingNodes = [];
          } else {
            anchorElement = insertNewAnchorElement(pendingNodes[0]);
            pendingNodes = [];
          }
        } else if (anchorElement) {
          // TODO(yosin) Should we skip all whitespace nodes at end of
          // tag?
          if (anchorElement.parentNode == currentNode.parentNode) {
            if (!editing.library.isWhitespaceNode(currentNode) ||
                currentNode.nextSibling) {
              anchorElement.appendChild(currentNode);
            } else {
              console.log('createLinkForRange skip ' + currentNode);
            }
          } else {
            anchorElement = insertNewAnchorElement(currentNode);
          }
        } else {
          anchorElement = insertNewAnchorElement(currentNode);
        }
        return;
      }

      anchorElement = null;
      if (!pendingNodes.length)
        return;

      // TODO(yosin) Handle peindingNode[0].parentNode isn't editable.
      var tree = pendingNodes[0];
      var newTree = editor.splitTree(tree, currentNode);
      tree.parentNode.insertAfter(newTree, tree);
    });

    if (pendingNodes.length) {
      var firstPendingNode = pendingNodes[0];
      var lastPendingNode = pendingNodes[pendingNodes.length - 1];
      if (lastPendingNode.nextSibling) {
          editor.splitTreeBefore(firstPendingNode, lastPendingNode);
      } else if (anchorElement) {
        anchorElement.appendChild(firstPendingNode);
      } else {
        anchorElement = insertNewAnchorElement(firstPendingNode);
      }
    }

    var anchorNode, anchorOffset;
    switch (anchorBoundaryPoint.type) {
      case 'afterAllChildren':
        anchorNode = anchorBoundaryPoint.node.parentNode;
        anchorOffset = anchorNode.maxOffset;
        break;
      case 'beforeAllChildren':
        anchorNode = anchorBoundaryPoint.node;
        anchorOffset = 0;
        break;
      case 'itself':
        anchorNode = anchorBoundaryPoint.node.parentNode;
        anchorOffset = anchorBoundaryPoint.node.nodeIndex;
        break;
      default:
        throw new Error('Bad BoundaryPoint.type ' + anchorBoundaryPoint.type);
    }

console.log('createLinkForRange anchorBoundaryPoint=' + anchorBoundaryPoint.type + ' ' + anchorBoundaryPoint.node,
    'anchorNode=' + anchorNode + ' ' + anchorOffset);

    var focusNode, focusOffset;
    switch (focusBoundaryPoint.type) {
      case 'afterAllChildren':
        focusNode = focusBoundaryPoint.node.parentNode;
        focusOffset = focusNode.maxOffset;
        break;
      case 'beforeAllChildren':
        focusNode = focusBoundaryPoint.node;
        focusOffset = 0;
        break;
      case 'itself':
        focusNode = focusBoundaryPoint.node.parentNode;
        focusOffset = focusBoundaryPoint.node.nodeIndex;
        break;
      default:
        throw new Error('Bad BoundaryPoint.type ' + focusBoundaryPoint.type);
    }

console.log('createLinkForRange focusBoundaryPoint=' + focusBoundaryPoint.type + ' ' + focusBoundaryPoint.node,
    'focusNode=' + focusNode + ' ' + focusOffset);

    context.setEndingSelection(new editing.ReadOnlySelection(
        anchorNode, anchorOffset, focusNode, focusOffset, selection.direction));
    return true;
  }

  /**
   * @param {!EditingContext} context
   * @return {!Array.<EditingNode>}
   */
  function getEffectiveNodes(context) {
    var nodes = context.selection.nodes;
console.log('getEffectiveNodes ', nodes.length, 'firstNode=' + nodes[0]);
    if (!nodes.length)
      return nodes;
    var firstNode = nodes[0];
    var lastNode = nodes[nodes.length - 1];
    var commonAncestor = firstNode.commonAncestor(lastNode);
    for (var ancestor = firstNode.parentNode; ancestor;
         ancestor = ancestor.parentNode) {
      if (!ancestor.isEditable)
        break;
      if (ancestor.firstChld !== ancestor.lastNode &&
          !lastNode.isDescendantOf(ancestor)) {
        break;
      }
console.log('getEffectiveNodes ancestor=' + ancestor);
      nodes.unshift(ancestor);
    }
    return nodes;
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

  return createLinkCommand;
})());
