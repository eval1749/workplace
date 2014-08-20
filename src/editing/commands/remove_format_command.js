// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

// Sample: http://jsfiddle.net/9nf4fue9/1/
editing.defineCommand('removeFormat', (function() {
  /** @const */
  var TAG_NAMES_TO_REMOVE = editing.newSet([
        'ABBR', 'ACRONYM', 'B', 'BDI', 'BDO', 'BIG', 'BLINK', 'CITE', 'CODE',
        'DFN', 'EM', 'FONT', 'I', 'INS', 'KBD', 'MARK', 'NOBR', 'Q', 'S',
        'SAMP', 'SMALL', 'STRIKE', 'STRONG', 'SUB', 'SUP', 'TT', 'U',
        'VAR']);

  function shouldRemove(node) {
    return node && editing.nodes.isElement(node) && node.parentNode &&
           editing.nodes.isContentEditable(node.parentNode) &&
           TAG_NAMES_TO_REMOVE.has(node.nodeName);
  }

  /**
   * @param {!EditingContext} context
   * @param {boolean} userInterface Not used.
   * @param {string} value Noe used.
   * @return {boolean}
   */
  function removeFormatCommand(context, userInterface, value) {
    var selection = context.selection;
    if (!selection.isRange) {
      context.setEndingSelection(context.startingSelection);
      return true;
    }
    var editor = context.editor;
    var anchorNode = selection.anchorNode;
    var anchorOffset = selection.anchorOffset;
    var focusNode = selection.focusNode;
    var focusOffset = selection.focusOffset;
    var nodes = selection.nodes;
    var firstNode = nodes.length >= 1 ? nodes[0] : null;
    var lastNode = nodes.length >= 1 ? nodes[nodes.length - 1] : null;

/*
console.log('\n\nremoveFormatCommand first=' + firstNode + ' last=' + lastNode +
            ' anchor=' + anchorNode + ' ' + anchorOffset +
            ' focus=' + focusNode + ' ' + focusOffset);
*/

    if (firstNode && editing.nodes.isText(firstNode)) {
      // Collect removal ancestors.
      var ancestors = [];
      for (var runner = firstNode.parentNode; shouldRemove(runner);
           runner = runner.parentNode) {
        ancestors.push(runner);
      }
      if (firstNode.previousSibling && ancestors.length) {
        // relocate anchor and focus
        var shouldUpdateAnchor = false;
        if (anchorNode === firstNode.parentNode) {
          shouldUpdateAnchor = true;
          anchorOffset -= editing.nodes.nodeIndex(firstNode);
        }
        var shouldUpdateFocus = false;
        if (focusNode === firstNode.parentNode) {
          shouldUpdateFocus = true;
          focusOffset -= editing.nodes.nodeIndex(firstNode);
        }
        var root = ancestors[ancestors.length - 1];
        var newRoot = context.splitTree(root, firstNode);
        if (shouldUpdateAnchor)
          anchorNode = firstNode.parentNode;
        if (shouldUpdateFocus)
          focusNode = firstNode.parentNode;
        for (var runner = firstNode.parentNode; runner;
             runner = runner.parentNode) {
          nodes.unshift(runner);
        }
/*
console.log('removeFormatCommand',
            'anchor=' + anchorNode + ' ' + anchorOffset,
            'focus=' + focusNode + ' ' + focusOffset);
*/
//console.log('removeFormatCommand first newRoot=' + newRoot);
        context.insertAfter(root.parentNode, newRoot, root);
      } else {
        while (ancestors.length) {
          nodes.unshift(ancestors[0]);
          ancestors.shift();
        }
      }
    }

    if (lastNode && lastNode != firstNode && lastNode.nextSibling) {
      var root = null;
      for (var runner = lastNode.parentNode; shouldRemove(runner);
           runner = runner.parentNode) {
        root = runner;
      }
//console.log('removeFormatCommand last root=' + root);
      if (root) {
        var newRoot = context.splitTree(root, lastNode.nextSibling);
//console.log('removeFormatCommand splitLast new=' + newRoot);
        context.insertAfter(root.parentNode, newRoot, root);
      }
    }

    nodes.forEach(function(node) {
      if (!editing.nodes.isElement(node) || !editing.nodes.isEditable(node)) {
        // TODO(yosin) Insert SPAN with "style" attribute to remove styles
        // if needed, e.g. <span class="bold">foo</span> =>
        // <span class="bold" style="font-weight:normal">foo</span>
        //console.log('removeFormatCommand', 'skip ' + node);
        return;
      }
      if (TAG_NAMES_TO_REMOVE.has(node.nodeName)) {
//console.log('removeFormatCommand', 'removeTag ' + node, editing.nodes.isContentEditable(node.parentNode));
        var parent = node.parentNode;
        if (!editing.nodes.isContentEditable(parent))
          return;
        if (node === anchorNode) {
          anchorNode = parent;
          anchorOffset += editing.nodes.nodeIndex(node);
        }
        if (node === focusNode) {
          focusNode = parent;
          focusOffset += editing.nodes.nodeIndex(node);
        }
        context.insertChildrenBefore(node, node);
        context.removeChild(parent, node);
        return;
      }

//console.log('removeFormatCommand', 'removeStyle' + node);
      context.setStyle(node, 'backgroundColor', '');
      context.setStyle(node, 'color', '');
      context.setStyle(node, 'fontFamily', '');
      context.setStyle(node, 'fontSize', '');
      context.setStyle(node, 'fontWeight', '');
      context.setStyle(node, 'textDecoration', '');
    });

//console.log('removeFormatCommand anchor=' + anchorNode + ' ' + anchorOffset + ' focusNode=' + focusNode + ' ' + focusOffset);
    context.setEndingSelection(new editing.ReadOnlySelection(
       anchorNode, anchorOffset, focusNode, focusOffset,
       selection.direction));
    return true;
  }

  return removeFormatCommand;
})());
