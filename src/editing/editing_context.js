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
   * @this {!EditingNode}
   * @param {!EditingNode} newChild
   */
  function internalAppendChild(parentNode, newChild) {
    console.assert(parentNode instanceof editing.EditingNode);
    console.assert(newChild instanceof editing.EditingNode);
    if (!parentNode.isElement &&
         parentNode.domNode.nodeType != Node.DOCUMENT_NODE) {
        throw 'parentNode must be an Element: ' + parentNode.domNode_;
    }
    if (newChild.parentNode_)
      internalRemoveChild(newChild);
    if (!parentNode.firstChild_)
      parentNode.firstChild_ = newChild;
    var lastChild = parentNode.lastChild_;
    if (lastChild)
      lastChild.nextSibling_ = newChild;
    newChild.parentNode_ = parentNode;
    newChild.nextSibling_ = null;
    newChild.previousSibling_ = lastChild;
    parentNode.lastChild_ = newChild;
  }

  /**
   * @param {!EditingNode} parentNode
   * @param {!EditingNode} newChild
   * @param {!EditingNode} refChild
   */
  function internalInsertBefore(parentNode, newChild, refChild) {
    console.assert(parentNode.isElement);
    if (!refChild) {
      internalAppendChild(parentNode, newChild);
      return;
    }
    if (refChild.parentNode_ !== parentNode)
      throw new Error('Bad parent');
    if (newChild.parentNode_)
      internalRemoveChild(newChild);
    console.assert(!newChild.parentNode);
    console.assert(!newChild.nextSibling);
    console.assert(!newChild.previousSibling);
    var previousSibling = refChild.previousSibling;
    newChild.parentNode_ = parentNode;
    newChild.nextSibling_ = refChild;
    newChild.previousSibling_ = previousSibling;
    refChild.previousSibling_ = newChild;
    if (previousSibling)
      previousSibling.nextSibling_ = newChild;
    else
      parentNode.firstChild_ = newChild;
  }

  /**
   * @param {!EditingNode} parentNode
   * @param {!EditingNode} oldChild
   */
  function internalRemoveChild(oldChild) {
    var parentNode = oldChild.parentNode_;
    console.assert(parentNode.isElement);
    console.assert(parentNode === oldChild.parentNode_);
    var nextSibling = oldChild.nextSibling_;
    var previousSibling = oldChild.previousSibling_;
    if (nextSibling)
      nextSibling.previousSibling_ = previousSibling;
    else
      parentNode.lastChild_ = previousSibling;
    if (previousSibling)
      previousSibling.nextSibling_ = nextSibling;
    else
      parentNode.firstChild_ = nextSibling;
    oldChild.nextSibling_ = null;
    oldChild.previousSibling_ = null;
    oldChild.parentNode_ = null;
  }

  /**
   * @param {!EditingNode} parentNode
   * @param {!EditingNode} newChild
   * @param {!EditingNode} oldChild
   */
  function internalReplaceChild(parentNode, newChild, oldChild) {
    if (oldChild.parentNode_ !== parentNode)
      throw new Error('Bad parent');
    if (newChild.parentNode_)
      internalRemoveChild(newChild);

    var nextSibling = oldChild.nextSibling;
    var previousSibling = oldChild.previousSibling;

    if (nextSibling)
      nextSibling.previousSibling_ = newChild;
    else
      parentNode.lastChild_ = newChild;

    if (previousSibling)
      previousSibling.nextSibling_ = newChild;
    else
      parentNode.firstChild_ = newChild;

    oldChild.nextSibling_ = null;
    oldChild.parentNode_ = null;
    oldChild.previousSibling_ = null;

    newChild.nextSibling_ = nextSibling;
    newChild.parentNode_ = parentNode;
    newChild.previousSibling_ = previousSibling;
  }


  /**
   * @this {!EditingNode}
   * @param {!EditingNode} textNode
   * @param {number} offset
   * @return {!EditingNode}
   */
  function internalSplitText(textNode, offset) {
    if (!textNode.isText)
      throw new Error('Expect Text node');
    var nodeValue = textNode.domNode_.nodeValue;
    if (offset <= 0)
      throw new Error('offset(' + offset + ') must be greater than zero.');
    if (offset >= nodeValue.length)
      throw new Error('offset(' + offset + ') must be less than length.');
    var newNode = new editing.EditingNode(textNode.context_, textNode.domNode_);
    newNode.textStartOffset_ = textNode.textStartOffset_ + offset;
    newNode.textEndOffset_ = textNode.textEndOffset_;
    textNode.textEndOffset_ = newNode.textStartOffset_;
    textNode.context_.splitText(textNode, offset, newNode);
    return newNode;
  }

  /**
   * @param {!EditingContext}
   * @param {!EditingNode} parentNode
   * @param {!EditingNode} newChild
   */
  function recordAppendChild(context, parentNode, newChild) {
    ASSERT_DOM_TREE_IS_MUTABLE(context);
    context.instructions_.push({operation: 'appendChild', parentNode: parentNode,
                                newChild: newChild});
  }


  /**
   * @param {!EditingContext}
   * @param {!EditingNode} parentNode
   * @param {!EditingNode} newChild
   * @param {!EditingNode} refChild
   */
  function recordInsertBefore(context, parentNode, newChild, refChild) {
    ASSERT_DOM_TREE_IS_MUTABLE(context);
    context.instructions_.push({operation: 'insertBefore',
                                parentNode: parentNode, newChild: newChild,
                                refChild: refChild});
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
    this.sampleContext_ = '';
    this.sampleHtmlText_ = '';
    // We don't make ending selection as starting selection here. Because,
    // |ReadOnlySelection| doesn't track DOM modification during command
    // execution.
    this.startingSelection_ = this.selection_.value;
    Object.seal(this);
  }

  /**
   * @this {!EditingContext}
   * @param {!EditingNode} parentNode
   * @param {!EditingNode} newChild
   */
  function appendChild(parentNode, newChild) {
    ASSERT_DOM_TREE_IS_MUTABLE(this);
    recordAppendChild(this, parentNode, newChild);
    internalAppendChild(parentNode, newChild);
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
   * @return {!EditingNode}
   */
  function cloneNode(node) {
    return node.cloneNode(false);
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
   * @param {!EditingNode} parent
   * @param {!EditingNode} newChild
   * @param {!EditingNode} refChild
   */
  function insertAfter(parent, newChild, refChild) {
    ASSERT_DOM_TREE_IS_MUTABLE(this);
    if (!refChild)
      throw new Error('refChild can not be null for insertAfter.');
    if (parent !== refChild.parentNode)
      throw new Error('Parent of refChild ' + refChild + ' must be ' + parent);
    this.insertBefore(parent, newChild, refChild.nextSibling);
  }

  /**
   * @this {!EditingContext}
   * @param {!EditingNode} parent
   * @param {!EditingNode} newChild
   * @param {!EditingNode} refChild
   */
  function insertBefore(parent, newChild, refChild) {
    ASSERT_DOM_TREE_IS_MUTABLE(this);
    if (!refChild) {
      this.appendChild(parent, newChild);
      return;
    }
    if (parent !== refChild.parentNode)
      throw new Error('Parent of refChild ' + refChild + ' must be ' + parent);
    if (!refChild) {
      this.appendChild(parent, newChild);
      return;
    }
    recordInsertBefore(this, newChild, refChild);
    internalInsertBefore(parent, newChild, refChild);
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
   * @param {!EditingNode} node
   */
  function recordCloneNode(node) {
    this.instructions_.push({operation: 'cloneNode', node: node});
  }

  /**
   * @this {!EditingContext}
   * @param {string} name
   */
  function removeAttribute(node, name) {
    ASSERT_DOM_TREE_IS_MUTABLE(this);
    this.instructions_.push({operation: 'removeAttribute', name: name, node: node});
  }

  /**
   * @this {!EditingContext}
   * @param {!EditingNode} parentNode
   * @param {!EditingNode} oldChild
   */
  function removeChild(parentNode, oldChild) {
    ASSERT_DOM_TREE_IS_MUTABLE(this);
    this.instructions_.push({operation: 'removeChild', parentNode: parentNode,
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
    this.instructions_.push({operation: 'replaceChild', parentNode: parentNode,
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
    this.instructions_.push({operation: 'setAttribute', element: element,
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
    if (!editing.nodes.inDocument(anchorNode)) {
      throw new Error('Can not set anchor node not in document ' +
                      anchorNode + ' parent=' + anchorNode.parentNode);
    }
    if (anchorOffset < 0 || anchorOffset > anchorNode.maxOffset) {
      throw new Error('Invalid anchor offset ' + anchorOffset +
                      ' on ' + anchorNode + ' max=' + anchorNode.maxOffset);
    }
    if (!editing.nodes.inDocument(focusNode)) {
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
    this.instructions_.push({operation: 'setStyle', node: node,
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
      this.appendChild(newParent, sibling);
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
    internalSplitText(textNode, offset);
    this.instructions_.push({operation: 'splitText', node: textNode,
                             offset: offset, newNode: newNode});
  }

  /**
   * @this {!EditingContext}
   * @param {!EditingNode} refNode
   * @return {!EditingNode}
   */
  function splitTree(treeNode, refNode) {
    console.assert(refNode.isDescendantOf(treeNode), 'refNode', refNode,
                  'must be descendant of treeNdoe', treeNode);
    var lastNode = refNode;
    for (var runner = refNode.parentNode; runner !== treeNode;
         runner = runner.parentNode) {
      var newNode = this.splitNode(runner, lastNode);
      this.insertAfter(runner.parentNode, newNode, runner);
      lastNode = newNode;
    }
    var newNode = this.splitNode(treeNode, lastNode);
    return newNode;
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
    recordAppendChild: {value: recordAppendChild},
    recordCloneNode: {value: recordCloneNode},
    recordInsertBefore: {value: recordInsertBefore},
    removeAttribute: {value: removeAttribute},
    removeChild: {value: removeChild},
    replaceChild: {value: replaceChild},
    sampleContext_: {writable: true}, // for debugging
    sampleHtmlText_: {writable: true}, // for debugging
    selection: {get: function() { return this.selection_; }},
    selection_: {writable: true},
    setAttribute: {value: setAttribute},
    setEndingSelection: {value: setEndingSelection },
    setStyle: {value: setStyle},
    splitNode: {value: splitNode},
    splitText: {value: splitText},
    splitTree: {value: splitTree},
    // Selection before executing editing command. This |ReadOnlySelection| is
    // put into undo stack for undo operation. See also |endingSelection|
    startingSelection: {get: function() { return this.startingSelection_; }},
    startingSelection_: {writable: true}
  });
  return EditingContext;
})());
