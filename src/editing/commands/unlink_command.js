// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

editing.defineCommand('Unlink', (function() {
  /**
   * @constructor
   * @final
   * @param {!editing.ReadOnlySelection} selection
   */
  function SelectionTrackerForUnlink(context, selection) {
    this.anchorNode_ = selection.anchorNode_;
    this.anchorOffset_ = selection.anchorOffset_;
    this.context_ = context;
    this.focusNode_ = selection.focusNode_;
    this.focusOffset_ = selection.focusOffset_;
    this.selection_ = selection;
    Object.seal(this);
  }

  Object.defineProperties(SelectionTrackerForUnlink.prototype, (function() {
    /**
     * @this {!SelectionTrackerForUnlink}
     */
    function finish() {
      this.context_.setEndingSelection(new editing.ReadOnlySelection(
         this.anchorNode_, this.anchorOffset_,
         this.focusNode_, this.focusOffset_,
         this.selection_.direction));
    }

    /**
     * @this {!SelectionTrackerForUnlink}
     * @param {!editing.ReadOnlySelection} anchorElement
     */
    function relocateIfNeeded(anchorElement) {
      if (this.anchorNode_ === anchorElement) {
        this.anchorNode_ = this.anchorNode_.parentNode;
        this.anchorOffset_ += editing.nodes.nodeIndex(anchorElement);
      }

      if (this.focusNode_ === anchorElement) {
        this.focusNode_ = this.focusNode_.parentNode;
        this.focusOffset_ += editing.nodes.nodeIndex(anchorElement);
      }
    };

    return {
      anchorNode_: {writable: true},
      finish: {value: finish},
      relocateIfNeeded: {value: relocateIfNeeded},
    };
  })());

 /**
  * @param {!EditingContext} context
  * @param {!Node} parentNode
  * @param {?Node} stopNode
  */
  function moveChildNodesBeforeParentNode(context, parentNode, stopNode) {
     var child = parentNode.firstChild;
     while (child) {
       var nextSibling = child.nextSibling;
       context.insertBefore(parentNode.parentNode, child, parentNode);
       child = nextSibling;
     }
  }

  /**
   * @param {!EditingContext} context
   * @return {boolean}
   */
  function unlinkForCaret(context) {
    /** @const */ var selection = editing.nodes.normalizeSelection(
        context, context.startingSelection);
    var anchorElement = selection.focusNode;
    while (anchorElement && anchorElement.nodeName != 'A') {
      anchorElement = anchorElement.parentNode;
    }
    if (!anchorElement || !editing.nodes.isEditable(anchorElement)) {
      context.setEndingSelection(selection);
      return true;
    }
    var nodeAtCaret = selection.focusNode.childNodes[selection.focusOffset];
    moveChildNodesBeforeParentNode(context, anchorElement, null);
    var containerNode = nodeAtCaret ? nodeAtCaret.parentNode :
                                      selection.focusNode.parentNode;
    var offset = nodeAtCaret ? editing.nodes.nodeIndex(nodeAtCaret) :
                               selection.focusOffset;
    context.removeChild(anchorElement.parentNode, anchorElement);
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
    if (context.startingSelection.isEmpty) {
      context.setEndingSelection(context.startingSelection);
      return true;
    }

    /** @const */ var selection = editing.nodes.normalizeSelection(
        context, context.startingSelection);
    var nodes = editing.nodes.computeSelectedNodes(selection);
    if (selection.isCaret || !nodes.length)
      return unlinkForCaret(context);

    // We'll remove nested anchor elements event if nested anchor elements
    // aren't valid HTML5.
    var anchorElements = [];
    var anchorElement = null;
    var selectionTracker = new SelectionTrackerForUnlink(context, selection);
    nodes.forEach(function(node) {
      while (anchorElement) {
        if (editing.nodes.isDescendantOf(node, anchorElement)) {
          if (anchorElement != node.parentNode)
            return;
          context.insertBefore(anchorElement.parentNode, node, anchorElement);
          return;
        }
        context.removeChild(anchorElement.parentNode, anchorElement);
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
      if (!anchorElement || !editing.nodes.isEditable(anchorElement)) {
        anchorElement = null;
        return;
      }

      selectionTracker.relocateIfNeeded(anchorElement);

      anchorElements.push(anchorElement);
      if (anchorElement == node)
        return;

      moveChildNodesBeforeParentNode(context, anchorElement, node.nextSibling);
    });

    while (anchorElements.length) {
      var anchorElement = anchorElements.pop();
      moveChildNodesBeforeParentNode(context, anchorElement, null);
      context.removeChild(anchorElement.parentNode, anchorElement);
    }

    selectionTracker.finish();
    return true;
  }

  return unlinkCommand;
})());
