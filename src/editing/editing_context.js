// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

editing.define('EditingContext', (function() {
  /**
   * @param {!Document} document
   * @param {Object} domSelection Once |Selection| keeps passed node and offset,
   *    we don't need to use |selection| parameter.
   */
  function EditingContext(document, domSelection) {
    this.document_ = document;
    this.instructions_ = [];
    this.selection_ = new editing.EditingSelection(this, domSelection);
  };

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
   * @param {!EditingNode} node
   */
  function registerNode(node) {
    this.editingNodes_.push(node);
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
    this.instructions.push({name: 'setAttribute', element: element,
                            attrName: attrName, attrValue: attrValue});
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
    insertBefore: {value: insertBefore},
    instructions_: {writable: true},
    registerNode: {value: registerNode},
    removeChild: {value: removeChild},
    replaceChild: {value: replaceChild},
    selection: {get: function() { return this.selection_; }},
    selection_: {writable: true},
    setAttribute: {value: setAttribute},
    splitText: {value: splitText},
  });
  return EditingContext;
})());
