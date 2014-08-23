// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

editing.define('EditingContext', (function() {
  function ASSERT_EDITING_IN_PROGRESS(context) {
    if (!context.endingSelection_)
      return;
    throw new Error("You can't mutate DOM tree once you set ending selection.");
  }

  /**
   * @param {!Editor} editor
   * @param {string} name A name for this context for error message.
   * @param {!editing.ReadOnlySelection} selection
   */
  function EditingContext(editor, name, selection) {
    console.assert(editor instanceof editing.Editor);
    console.assert(selection instanceof editing.ReadOnlySelection);
    var document = editor.document;
    this.document_ = document;
    this.editor_ = editor;
    this.endingSelection_ = null;
    this.name_ = name;
    this.operations_ = [];
    // We don't make ending selection as starting selection here. Because,
    // |ReadOnlySelection| doesn't track DOM modification during command
    // execution.
    this.startingSelection_ = selection
    Object.seal(this);
  }

  /**
   * @this {!EditingContext}
   * @param {!Node} parentNode
   * @param {!Node} newChild
   */
  function appendChild(parentNode, newChild) {
    ASSERT_EDITING_IN_PROGRESS(this);
    if (newChild.parentNode)
      this.removeChild(newChild.parentNode, newChild);
    var operation = new editing.AppendChild(parentNode, newChild);
    this.operations_.push(operation);
    operation.execute();
  }

  /**
   * @this {!EditingContext}
   * @param {string} tagName
   * @return {!Node}
   */
  function createElement(tagName) {
    return this.document_.createElement(tagName);
  }

  /**
   * @this {!EditingContext}
   * @param {string} text
   * @return {!Node}
   */
  function createTextNode(text) {
    return this.document_.createTextNode(text);
  }

  /**
   * @this {!EditingContext}
   * @param {!Node} node
   * @return {!Node}
   */
  function cloneNode(node) {
    return node.cloneNode(false);
  }

  /**
   * @this {!EditingContext}
   * @return {!editing.ReadOnlySelection}
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
    ASSERT_EDITING_IN_PROGRESS(this);
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
   * @param {!Node} node
   * @return {boolean}
   */
  function inDocument(node) {
    for (var runner = node; runner; runner = runner.parentNode) {
      if (runner === this.document_)
        return true;
    }
    return false;
  }

  /**
   * @this {!EditingContext}
   * @param {!Node} parent
   * @param {!Node} newChild
   * @param {!Node} refChild
   */
  function insertAfter(parent, newChild, refChild) {
    ASSERT_EDITING_IN_PROGRESS(this);
    if (!refChild)
      throw new Error('refChild can not be null for insertAfter.');
    if (parent !== refChild.parentNode)
      throw new Error('Parent of refChild ' + refChild + ' must be ' + parent);
    if (newChild.parentNode)
      this.removeChild(newChild.parentNode, newChild);
    this.insertBefore(parent, newChild, refChild.nextSibling);
  }

  /**
   * @this {!EditingContext}
   * @param {!Node} parentNode
   * @param {!Node} newChild
   * @param {!Node} refChild
   */
  function insertBefore(parentNode, newChild, refChild) {
    ASSERT_EDITING_IN_PROGRESS(this);
    if (!refChild) {
      this.appendChild(parentNode, newChild);
      return;
    }
    if (parentNode !== refChild.parentNode)
      throw new Error('Parent of refChild ' + refChild + ' must be ' +
                      parentNode);
    if (newChild.parentNode)
      this.removeChild(newChild.parentNode, newChild);
    var operation = new editing.InsertBefore(parentNode, newChild, refChild);
    this.operations_.push(operation);
    operation.execute();
  }

  /**
   * @this {!EditingContext}
   * @param {!Node} oldParent
   * @param {!Node} refNode
   */
  function insertChildrenBefore(oldParent, refNode) {
    var newParent = refNode.parentNode;
    var child = oldParent.firstChild;
    while (child) {
      var nextSibling = child.nextSibling;
      this.insertBefore(newParent, child, refNode);
      child = nextSibling;
    }
  }

  /**
   * @this {!EditingContext}
   * @param {!Element} element
   * @param {string} name
   */
  function removeAttribute(element, name) {
    ASSERT_EDITING_IN_PROGRESS(this);
    console.assert(typeof(name) == 'string',
        'Attribute name must be string rather than ' + name);
    var attrNode = element.getAttriubteNode(element);
    var operation = new editing.RemoveAttribute(element, name);
    this.operations_.push(operation);
    operation.execute();
  }

  /**
   * @this {!EditingContext}
   * @param {!Node} parentNode
   * @param {!Node} oldChild
   */
  function removeChild(parentNode, oldChild) {
    ASSERT_EDITING_IN_PROGRESS(this);
    if (oldChild.parentNode !== parentNode)
      throw new Error('A parent of oldChild ' + oldChild + ' must be ' +
                      oldChild.parentNode.outerHTML +
                      ' instead of ' + parentNode.outerHTML);
    var operation = new editing.RemoveChild(parentNode, oldChild);
    this.operations_.push(operation);
    operation.execute();
  }

  /**
   * @this {!EditingContext}
   * @param {!Node} parentNode
   * @param {!Node} newChild
   * @param {!Node} oldChild
   */
  function replaceChild(parentNode, newChild, oldChild) {
    ASSERT_EDITING_IN_PROGRESS(this);
    if (oldChild.parentNode !== parentNode)
      throw new Error('A parent of oldChild ' + oldChild + ' must be ' +
                      oldChild.parentNode.outerHTML +
                      ' instead of ' + parentNode.outerHTML);
    if (newChild.parentNode)
      this.removeChild(newChild.parentNode, newChild);
    var operation = new editing.ReplaceChild(parentNode, newChild, oldChild);
    this.operations_.push(operation);
    operation.execute();
  }

  /**
   * @this {!EditingContext}
   * @param {!Node} element
   * @param {string} name
   * @param {string} newValue
   */
  function setAttribute(element, name, newValue) {
    console.assert(editing.nodes.isElement(element),
                   'Node ' + element + ' must be an Element.');
    ASSERT_EDITING_IN_PROGRESS(this);
    var operation = new editing.SetAttribute(element, name, newValue);
    this.operations_.push(operation);
    operation.execute();
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
    if (!this.inDocument(anchorNode)) {
      throw new Error('Can not set anchor node not in document ' +
                      anchorNode + ' parent=' + anchorNode.parentNode);
    }
    if (anchorOffset < 0 ||
        anchorOffset > editing.nodes.maxOffset(anchorNode)) {
      throw new Error('Invalid anchor offset ' + anchorOffset +
                      ' on ' + anchorNode +
                      ' max=' + editing.nodes.maxOffset(anchorNode));
    }
    if (!this.inDocument(focusNode)) {
      throw new Error('Can not set focus node not in document ' +
                      focusNode);
    }
    if (focusOffset < 0 || focusOffset > editing.nodes.maxOffset(focusNode)) {
      throw new Error('Invalid focus offset ' + focusOffset +
                      ' on ' + focusNode +
                      ' max=' + editing.nodes.maxOffset(focusNode));
    }
    this.endingSelection_ = selection;
  }

  /**
   * @this {!Editor}
   * @param {!Element} element
   * @param {string} propertyName
   * @param {string} newValue
   */
  function setStyle(element, propertyName, newValue) {
    console.assert(editing.nodes.isElement(element));
    var operation = new editing.SetStyle(element, propertyName, newValue);
    this.operations_.push(operation);
    operation.execute();
  }

  /**
   * @this {!EditingContext}
   * @param {!Node} parent
   * @param {!Node} child
   * @return {!Node}
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
   * @param {!Text} node
   * @param {number} offset
   * @return {!Node}
   */
  function splitText(node, offset) {
    ASSERT_EDITING_IN_PROGRESS(this);
    var newNode = node.splitText(offset);
    this.operations_.push(new editing.SplitText(node, newNode));
    return newNode;
  }

  /**
   * @this {!EditingContext}
   * @param {!Node} refNode
   * @return {!Node}
   */
  function splitTree(treeNode, refNode) {
    console.assert(editing.nodes.isDescendantOf(refNode, treeNode),
                  'refNode', refNode,
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
    inDocument: {value: inDocument},
    insertAfter: {value: insertAfter},
    insertBefore: {value: insertBefore},
    insertChildrenBefore: {value: insertChildrenBefore},
    operations: {get: function() { return this.operations_; }},
    operations_: {writable: true},
    name: {get: function() { return this.name_; }},
    name_: {writable: true},
    removeAttribute: {value: removeAttribute},
    removeChild: {value: removeChild},
    replaceChild: {value: replaceChild},
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
