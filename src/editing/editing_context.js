// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

editing.define('EditingContext', (function() {
  function ASSERT_DOM_TREE_IS_MUTABLE(context) {
    if (!context.endingSelection_)
      return;
    throw new Error("You can't mutate DOM tree once you set ending selection.");
  }

  /**
   * @param {!Editor} editor
   * @param {?Object} domSelection Once |Selection| keeps passed node and
   *    offset, *    we don't need to use |selection| parameter.
   */
  function EditingContext(editor, domSelection) {
    var document = editor.document;
    this.document_ = document;
    this.editor_ = editor;
    this.endingSelection_ = null;
    this.hashCode_ = 0;
    this.instructions_ = [];
    this.selection_ = new editing.EditingSelection(this, domSelection);

    if (!domSelection || !domSelection.rangeCount)
      return;

    // We don't make ending selection as starting selection here. Because,
    // |ReadOnlySelection| doesn't track DOM modification during command
    // execution.
    this.startingSelection_ = new editing.ReadOnlySelection(
        this.selection_.anchorNode, this.selection_.anchorOffset,
        this.selection_.focusNode, this.selection_.focusOffset,
        this.selection_.anchorIsStart ?
            editing.SelectionDirection.ANCHOR_IS_START :
            editing.SelectionDirection.FOCUS_IS_START);
  }

  /**
   * @this {!EditingContext}
   * @param {!EditingNode} parentNode
   * @param {!EditingNode} newChild
   */
  function appendChild(parentNode, newChild) {
    ASSERT_DOM_TREE_IS_MUTABLE(this);
    this.instructions_.push({opcode: 'appendChild', parentNode: parentNode,
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
    this.instructions_.push({opcode: 'cloneNode', node: node});
  }

  /**
   * @this {!EditingContext}
   * @return {!ReadOnlySelection}
   */
  function endingSelection() {
    console.assert(this.endingSelection_,
                   'You should set ending selection at end of command.');
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
    ASSERT_DOM_TREE_IS_MUTABLE(this);
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
   * @param {!EditingNode} newChild
   * @param {!EditingNode} refChild
   */
  function insertAfter(newChild, refChild) {
    ASSERT_DOM_TREE_IS_MUTABLE(this);
    if (refChild.nextSibling) {
      refChild.parentNode.insertBefore(newChild, refChild.nextSibling);
      return;
    }
    refChild.parentNode.appendChild(newChild, refChild);
  }

  /**
   * @this {!EditingContext}
   * @param {!EditingNode} newChild
   * @param {!EditingNode} refChild
   */
  function insertBefore(newChild, refChild) {
    ASSERT_DOM_TREE_IS_MUTABLE(this);
    refChild.parentNode.appendChild(newChild, refChild);
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
   * @param {!EditingNode} newChild
   * @param {!EditingNode} refChild
   */
  function recordInsertBefore(parentNode, newChild, refChild) {
    ASSERT_DOM_TREE_IS_MUTABLE(this);
    this.instructions_.push({opcode: 'insertBefore', parentNode: parentNode,
                             newChild: newChild, refChild: refChild});
  }

  /**
   * @this {!EditingContext}
   * @param {string} name
   */
  function removeAttribute(node, name) {
    ASSERT_DOM_TREE_IS_MUTABLE(this);
    this.instructions_.push({opcode: 'removeAttribute', name: name, node: node});
  }

  /**
   * @this {!EditingContext}
   * @param {!EditingNode} parentNode
   * @param {!EditingNode} oldChild
   */
  function removeChild(parentNode, oldChild) {
    ASSERT_DOM_TREE_IS_MUTABLE(this);
    this.instructions_.push({opcode: 'removeChild', parentNode: parentNode,
                             oldChild: oldChild});
  }

  /**
   * @this {!EditingContext}
   * @param {!EditingNode} parentNode
   * @param {!EditingNode} newChild
   * @param {!EditingNode} oldChild
   */
  function replaceChild(parentNode, newChild, oldChild) {
    ASSERT_DOM_TREE_IS_MUTABLE(this);
    this.instructions_.push({opcode: 'replaceChild', parentNode: parentNode,
                             newChild: newChild, oldChild: oldChild});
  }

  /**
   * @this {!EditingContext}
   * @param {!EditingNode} element
   * @param {string} attrName
   * @param {string} attrValue
   */
  function setAttribute(element, attrName, attrValue) {
    ASSERT_DOM_TREE_IS_MUTABLE(this);
    this.instructions_.push({opcode: 'setAttribute', element: element,
                            attrName: attrName, attrValue: attrValue});
  }

  /**
   * @this {!EditingContext}
   * @param {!editing.ReadOnlySelection} selection
   */
  function setEndingSelection(selection) {
    if (this.endingSelection_)
      throw new Error('ending selection is already set.');
    var anchorNode = selection.anchorNode;
    var anchorOffset = selection.anchorOffset;
    var focusNode = selection.focusNode;
    var focusOffset = selection.focusOffset;
    if (!anchorNode)
      throw new Error('Can not set null anchor node to ending ');
    if (!focusNode)
      throw new Error('Can not set null focus node to ending ');
    if (!anchorNode.inDocument) {
      throw new Error('Can not set anchor node not in document ' +
                      anchorNode);
    }
    if (anchorOffset < 0 || anchorOffset > anchorNode.maxOffset) {
      throw new Error('Invalid anchor offset ' + anchorOffset +
                      ' on ' + anchorNode + ' max=' + anchorNode.maxOffset);
    }
    if (!focusNode.inDocument) {
      throw new Error('Can not set focus node not in document ' +
                      focusNode);
    }
    if (focusOffset < 0 || focusOffset > focusNode.maxOffset) {
      throw new Error('Invalid focus offset ' + focusOffset +
                      ' on ' + focusNode + ' max=' + focusNode.maxOffset);
    }
    this.endingSelection_ = selection;
  }

  /**
   * @this {!Editor}
   * @param {!EditingNode} node
   * @param {string} propertyName
   * @param {string} newValue
   */
  function setStyle(node, propertyName, newValue) {
    this.instructions_.push({opcode: 'setStyle', node: node,
                             propertyName: propertyName, newValue: newValue});
  }

  /**
   * @this {!EditingContext}
   * @param {!EditingNode} parent
   * @param {!EditingNode} child
   * @return {!EditingNode}
   *
   * Split |parent| at |child|, and returns new node which contains |child|
   * to its sibling nodes.
   */
  function splitNode(parent, child) {
    var newParent = parent.cloneNode(false);
    var sibling = child;
    while (sibling) {
      console.assert(sibling.parentNode === parent);
      var nextSibling = sibling.nextSibling;
      newParent.appendChild(sibling);
      sibling = nextSibling;
    }
    return newParent;
  }

  /**
   * @this {!EditingContext}
   * @param {!EditingNode} textNode
   * @param {number} offset
   * @param {!EditingNode} newNode
   * @return {!EditingNode}
   */
  function splitText(textNode, offset, newNode) {
    ASSERT_DOM_TREE_IS_MUTABLE(this);
    console.assert(textNode instanceof editing.EditingNode);
    console.assert(textNode.isText);
    console.assert(newNode instanceof editing.EditingNode);
    console.assert(newNode.isText);
    this.instructions_.push({opcode: 'splitText', node: textNode,
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
    editor: {get: function() { return this.editor_; }},
    editor_: {writable: true},
    // Selection after executing editing command. This |ReadOnlySelection| is
    // put into undo stack for redo operation. See also |startingSelection|
    endingSelection: {get: endingSelection},
    endingSelection_: {writable: true},
    execCommand: {value: execCommand},
    hashCode_: {writable: true},
    insertAfter: {value: insertAfter},
    insertBefore: {value: insertBefore},
    instructions_: {writable: true},
    nextHashCode: {value: nextHashCode },
    recordInsertBefore: {value: recordInsertBefore},
    removeAttribute: {value: removeAttribute},
    removeChild: {value: removeChild},
    replaceChild: {value: replaceChild},
    selection: {get: function() { return this.selection_; }},
    selection_: {writable: true},
    setAttribute: {value: setAttribute},
    setEndingSelection: {value: setEndingSelection },
    setStyle: {value: setStyle},
    splitNode: {value: splitNode},
    splitText: {value: splitText},
    // Selection before executing editing command. This |ReadOnlySelection| is
    // put into undo stack for undo operation. See also |endingSelection|
    startingSelection: {get: function() { return this.startingSelection_; }},
    startingSelection_: {writable: true}
  });
  return EditingContext;
})());
