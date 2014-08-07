// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

editing.define('EditingContext', (function() {
  function isAnchorBeforeFocus(domSelection) {
    var range = domSelection.getRangeAt(0);
    return range.startOffset == domSelection.anchorOffset &&
           range.startContainer === domSelection.anchorNode;
  }

  /**
   * @param {!Document} document
   * @param {Object} domSelection Once |Selection| keeps passed node and offset,
   *    we don't need to use |selection| parameter.
   */
  function EditingContext(document, domSelection) {
    console.assert(arguments.length == 1 || document === domSelection.document);
    this.document_ = document;
    this.endingSelection_ = null;
    this.hashCode_ = 0;
    this.instructions_ = [];
    this.selection_ = new editing.EditingSelection(this, domSelection);

    if (!domSelection || !domSelection.rangeCount)
      return;

    this.startingSelection_ = new editing.ReadOnlySelection(
        domSelection.anchorNode, domSelection.anchorOffset,
        domSelection.focusNode, domSelection.focusOffset,
        isAnchorBeforeFocus(domSelection) ?
            editing.SelectionDirection.ANCHOR_IS_START :
            editing.SelectionDirection.FOCUS_IS_START);
  }

  /**
   * @this {!EditingContext}
   * @param {!EditingNode} parentNode
   * @param {!EditingNode} newChild
   */
  function appendChild(parentNode, newChild) {
    this.instructions_.push({name: 'appendChild', parentNode: parentNode,
                             newChild: newChild});
  }

  /**
   * @this {!EditingContext}
   * @param {string} tagName
   * @return {!EditingNode}
   */
  function createElement(tagName) {
    var domNode = this.document_.createElement(tagName);
    var node = new editing.EditingNode(this, domNode);
    return node;
  }

  /**
   * @this {!EditingContext}
   * @param {string} text
   * @return {!EditingNode}
   */
  function createTextNode(text) {
    var domNode = this.document_.createTextNode(text);
    var node = new editing.EditingNode(this, domNode);
    return node;
  }

  /**
   * @this {!EditingContext}
   * @param {!EditingNode} node
   */
  function cloneNode(node) {
    this.instructions_.push({name: 'cloneNode', node: node});
  }

  /**
   * @this {!EditingContext}
   * @return {!ReadOnlySelection}
   */
  function endingSelection() {
    if (!this.endingSelection_)
      throw new Error('You should set ending selection at end of command.');
    return this.endingSelection_;
  }

  /**
   * @this {!EditingContext}
   * @param {string} name
   * @param {boolean=} opt_userInterface
   * @param {string=} opt_value
   *
   * Emulation of |Document.execCommand|.
   */
  function execCommand(name, opt_userInterface, opt_value) {
    if (typeof(name) != 'string') {
      console.log('execCommand name', name);
      throw new Error('execCommand takes string: ' + name);
    }
    var userInterface = arguments.length >= 2 ? Boolean(opt_userInterface)
                                              : false;
    var value = arguments.length >= 3 ? String(opt_value) : '';
    var commandFunction = editing.lookupCommand(name);
    if (!commandFunction)
      throw new Error('No such command ' + name);
    return commandFunction(this, userInterface, value);
  }

  /**
   * @this {!EditingContext}
   * @param {!EditingNode} parentNode
   * @param {!EditingNode} newChild
   * @param {!EditingNode} refChild
   */
  function insertBefore(parentNode, newChild, refChild) {
    this.instructions_.push({name: 'insertBefore', parentNode: parentNode,
                             newChild: newChild, refChild: refChild});
  }

  /**
   * @this {!EditingContext}
   * @return {number}
   */
  function nextHashCode() {
    return ++this.hashCode_;
  }

  /**
   * @this {!EditingContext}
   * @param {!EditingNode} parentNode
   * @param {!EditingNode} oldChild
   */
  function removeChild(parentNode, oldChild) {
    this.instructions_.push({name: 'removeChild', parentNode: parentNode,
                             oldChild: oldChild});
  }

  /**
   * @this {!EditingContext}
   * @param {!EditingNode} parentNode
   * @param {!EditingNode} newChild
   * @param {!EditingNode} oldChild
   */
  function replaceChild(parentNode, newChild, oldChild) {
    this.instructions_.push({name: 'replaceChild', parentNode: parentNode,
                             newChild: newChild, oldChild: oldChild});
  }

  /**
   * @this {!EditingContext}
   * @param {!EditingNode} element
   * @param {string} attrName
   * @param {string} attrValue
   */
  function setAttribute(element, attrName, attrValue) {
    this.instructions_.push({name: 'setAttribute', element: element,
                            attrName: attrName, attrValue: attrValue});
  }

  /**
   * @this {!EditingContext}
   * @param {!editing.ReadOnlySelection} selection
   */
  function setEndingSelection(selection) {
    this.endingSelection_ = selection;
  }

  /**
   * @this {!EditingContext}
   * @param {!EditingNode} textNode
   * @param {number} offset
   * @param {!EditingNode} newNode
   * @return {!EditingNode}
   */
  function splitText(textNode, offset, newNode) {
    console.assert(textNode instanceof editing.EditingNode);
    console.assert(textNode.isText);
    console.assert(newNode instanceof editing.EditingNode);
    console.assert(newNode.isText);
    this.instructions_.push({name: 'splitText', node: textNode,
                             offset: offset, newNode: newNode});
  }

  Object.defineProperties(EditingContext.prototype, {
    appendChild: {value: appendChild},
    constructor: {value: EditingContext},
    cloneNode: {value: cloneNode },
    document: {get: function() { return this.document_; }},
    document_: {writable: true},
    createElement: {value: createElement},
    createTextNode: {value: createTextNode},
    // Selection after executing editing command. This |ReadOnlySelection| is
    // put into undo stack for redo operation. See also |startingSelection|
    endingSelection: {get: endingSelection},
    endingSelection_: {writable: true},
    execCommand: {value: execCommand},
    hashCode_: {writable: true},
    insertBefore: {value: insertBefore},
    instructions_: {writable: true},
    nextHashCode: {value: nextHashCode },
    removeChild: {value: removeChild},
    replaceChild: {value: replaceChild},
    selection: {get: function() { return this.selection_; }},
    selection_: {writable: true},
    setAttribute: {value: setAttribute},
    setEndingSelection: {value: setEndingSelection },
    splitText: {value: splitText},
    // Selection before executing editing command. This |ReadOnlySelection| is
    // put into undo stack for undo operation. See also |endingSelection|
    startingSelection_: {writable: true}
  });
  return EditingContext;
})());
