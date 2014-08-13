// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

// Sample: http://jsfiddle.net/9nf4fue9/1/
editing.defineCommand('removeFormat', (function() {
  /** @const */
  var TAG_NAMES_TO_REMOVE = new Set([
        'ABBR', 'ACRONYM', 'B', 'BDI', 'BDO', 'BIG', 'BLINK', 'CITE', 'CODE',
        'DFN', 'EM', 'FONT', 'I', 'INS', 'KBD', 'MARK', 'NOBR', 'Q', 'S',
        'SAMP', 'SMALL', 'SPAN', 'STRIKE', 'STRONG', 'SUB', 'SUP', 'TT', 'U',
        'VAR']);

  function shouldRemove(node) {
    return node && node.isElement && node.parentNode &&
           node.parentNode.isContentEditable &&
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
      context.setEndingSelection(context.setStartingSelection);
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

console.log('\n\nremoveFormatCommand first=' + firstNode + ' last=' + lastNode);

    if (firstNode && firstNode.isText) {
      // Collect removal ancestors.
      var ancestors = [];
      for (var runner = firstNode.parentNode; shouldRemove(runner);
           runner = runner.parentNode) {
        ancestors.push(runner);
      }
      if (firstNode.previousSibling && ancestors.length) {
        var root = ancestors[ancestors.length - 1];
        var newRoot = root.splitTree(firstNode);
        for (var runner = firstNode.parentNode; runner != newRoot;
             runner = runner.parentNode) {
          nodes.unshift(runner);
        }
console.log('removeFormatCommand first newRoot=' + newRoot);
        root.parentNode.insertAfter(newRoot, root);
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
console.log('removeFormatCommand last root=' + root);
      if (root) {
        var newRoot = root.splitTree(lastNode.nextSibling);
console.log('removeFormatCommand splitLast new=' + newRoot);
        root.parentNode.insertAfter(newRoot, root);
      }
    }

    nodes.forEach(function(node) {
      if (!node.isElement || !node.isEditable) {
        console.log('removeFormatCommand', 'skip ' + node);
        return;
      }
      if (TAG_NAMES_TO_REMOVE.has(node.nodeName)) {
console.log('removeFormatCommand', 'removeTag ' + node, node.parentNode.isContentEditable);
        var parent = node.parentNode;
        if (!parent.isContentEditable)
          return;
        if (node === anchorNode) {
          anchorNode = parent;
          anchorOffset += node.nodeIndex;
        }
        if (node === focusNode) {
          focusNode = parent;
          focusOffset += node.nodeIndex;
        }
        editor.insertChildrenBefore(node, node);
        parent.removeChild(node);
        return;
      }

      editor.setStyle(node, 'backgroundColor', '');
      editor.setStyle(node, 'color', '');
      editor.setStyle(node, 'fontFamily', '');
      editor.setStyle(node, 'fontSize', '');
      editor.setStyle(node, 'fontWeight', '');
      editor.setStyle(node, 'textDecoration', '');
    });

console.log('removeFormatCommand anchor=' + anchorNode + ' ' + anchorOffset + ' focusNode=' + focusNode + ' ' + focusOffset);
    context.setEndingSelection(new editing.ReadOnlySelection(
       anchorNode, anchorOffset, focusNode, focusOffset,
       selection.direction));
    return true;
  }

  return removeFormatCommand;
})());
