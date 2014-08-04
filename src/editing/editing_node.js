// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

editing.define('EditingNode', (function() {
  /**
   * @param {!EditingNode} node
   * @param {!EditingNode} other
   * Returns true if |other| is an ancestor of |node|, otherwise false.
   */
  function isDescendantOf(node, other) {
    console.assert(node instanceof editing.EditingNode);
    console.assert(other instanceof editing.EditingNode);
    for (var runner = node.parentNode; runner; runner = runner.parentNode) {
      if (runner == other)
        return true;
    }
    return false;
  }

  /**
   * @param {!EditingContext} context
   * @param {!Node} node
   */
  function EditingNode(context, domNode) {
    console.assert(domNode instanceof Node);
    this.attributes_ = {};
    this.context_ = context;
    this.domNode_ = domNode;
    this.parentNode_ = null;
    this.firstChild_ = null;
    this.lastChild_ = null;
    this.nextSibling_ = null;
    this.previousSibling_ = null;
    this.splitOffset_ = 0;
  };

  /**
   * @this {!EditingNode}
   * @param {!EditingNode} newChild
   */
  function appendChild(newChild) {
    this.context_.appendChild(this, newChild);
    internalAppendChild(this, newChild);
  }

  /**
   * @this {!EditingNode}
   * @return {!Array.<!EditingNode?}
   */
  function childNodes() {
    var childNodes = [];
    for (var child = this.firstChild_; child; child = child.nextSibling_) {
      childNodes.push(child);
    }
    return childNodes;
  }

  /**
   * @this {!EditingNode}
   * @param {boolean} deep
   */
  function cloneNode(deep) {
    if (deep)
      throw new Error('We should not use cloneNode(true).');
    this.context_.cloneNode(false);
    var domNode = this.domNode_.cloneNode(false);
    var cloneNode = new EditingNode(this.context_, domNode);
    if (this.domNode_.nodeType === Node.ELEMENT_TYPE) {
      var attrs = this.domNode_.attributes;
      for (var index = 0; attrs.length; ++index) {
        var attr = attrs[index];
        cloneNode.attributes_[attr.name] = attr.value;
      }
    }
    return cloneNode;
  }

  /**
   * @this {!EditingNode}
   * @param {!EditingNode} newChild
   * @param {!EditingNode} refChild
   */
  function insertAfter(newChild, refChild) {
    if (refChild.nextSibling) {
      this.insertBefore(newChild, refChild.nextSibling);
      return;
    }
    this.appendChild(newChild);
  }

  /**
   * @this {!EditingNode}
   * @param {!EditingNode} newChild
   * @param {!EditingNode} refChild
   */
  function insertBefore(newChild, refChild) {
    this.context_.insertBefore(newChild, refChild);
    internalInsertBefore(newChild, refChild);
  }

  /**
   * @this {!EditingNode}
   * @param {!EditingNode} newChild
   */
  function internalAppendChild(parentNode, newChild) {
    console.assert(parentNode instanceof editing.EditingNode);
    console.assert(newChild instanceof editing.EditingNode);
    console.assert(parentNode !== newChild.parentNode);
    if (!parentNode.isElement &&
         parentNode.domNode.nodeType != Node.DOCUMENT_NODE) {
        throw 'parentNode must be an Element: ' + parentNode.domNode_;
    }
    if (newChild.parentNode_)
      internalRemoveChild(newChild.parentNode_, newChild);
    if (!parentNode.firstChild_)
      parentNode.firstChild_ = newChild;
    if (parentNode.lastChild_)
      parentNode.lastChild_.nextSibling_ = newChild;
    newChild.parentNode_ = parentNode;
    newChild.previousSibling_ = parentNode.lastChild_;
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
    if (newChild.preantNode_)
      internalRemoveChild(newChild.parentNode_, newChild);
    newChild.parentNode_ = this;
    newChild.previousSibling_ = refChild.previousSibling;
    newChild.nextSibling_ = refChild;
    refChild.previousSibling_ = newChild;
    if (newChild.previousSibling_)
      newChild.previousSibling_.nextSibling_ = newChild;
    else
      this.lastChild_ = newChild;
    this.context_.insertBefore(this, newChild, refChild);
  }

  /**
   * @param {!EditingNode} parentNode
   * @param {!EditingNode} oldChild
   */
  function internalRemoveChild(parentNode, oldChild) {
    console.assert(parentNode.isElement);
    console.assert(parentNode === oldChild.parentNode_);
    parentNode.nextSibling_ = null;
    parentNode.previousSibling_ = null;
    parentNode.parentNode_ = null;
    parentNode.context_.removeChild(parentNode, oldChild);
  }

  /**
   * @param {!EditingNode} parentNode
   * @param {!EditingNode} newChild
   * @param {!EditingNode} oldChild
   */
  function internalReplaceChild(parentNode, newChild, oldChild) {
    console.assert(parentNode.isElement);
    if (oldChild.parentNode_ !== parentNode)
      throw new Error('Bad parent');
    internalInsertBefore(parentNode, newChild, oldChild);
    internalRemoveChild(parentNode, oldChild);
  }

  /**
   * @this {!EditingNode}
   * @return {boolean}
   */
  function isEditable() {
    if (!this.isElement)
      return this.parentNode_.isEditable;
    var style = window.getComputedStyle(this.domNode_);
    return style.webkitUserModify != 'read-only';
  }

  /**
   * @this {!EditingNode}
   * @return {boolean}
   */
  function isElement() {
    return this.domNode_.nodeType === Node.ELEMENT_NODE;
  }

  /**
   * @this {!EditingNode}
   * @return {boolean}
   */
  function isPhrasing() {
    if (!this.isElement)
      return true;
    var element = /** @type{!Element} */(this.domNode_);
    return !!editing.contentModel[this.tagName][editing.category.PHRASING];
  }

  /**
   * @this {!EditingNode}
   * @return {boolean}
   */
  function isText() {
    return this.domNode_.nodeType === Node.TEXT_NODE;
  }

  /**
   * @this {!EditingNode}
   * @return {string}
   */
  function nodeName() {
    return this.domNode.nodeName;
  }

  /**
   * @this {!EditingNode}
   * @return {?string}
   */
  function nodeValue() {
    if (!(this.domNode instanceof CharacterData))
      return null;
    var nodeValue = this.domNode.nodeValue;
    var offset = this.splitOffset_;
    if (!offset)
      return nodeValue;
    return offset > 0 ? nodeValue.substr(0, offset) : nodeValue.substr(-offset);
  }

  /**
   * @this {!EditingNode}
   * @param {!EditingNode} oldChild
   */
  function removeChild(oldChild) {
    if (oldChild.parentNode_ !== this)
      throw new Error('Bad parent');
    this.context_.removeChld(oldChild.parentNode, oldChild);
    internalRemoveChild(newChild.parentNode_, oldChild);
  }

  /**
   * @this {!EditingNode}
   * @param {!EditingNode} newChild
   * @param {!EditingNode} oldChild
   */
  function replaceChild(newChild, oldChild) {
    if (oldChild.parentNode_ !== this)
      throw new Error('Bad parent');
    this.context_.replaceChild(newChild, oldChild);
    internalReplaceChild(this, newChild, oldChild);
  }

  /**
   * @this {!EditingNode}
   * @param {string} name
   * @param {string} value
   */
  function setAttribute(attrName, attrValue) {
    console.assert(this.isElement());
    this.attributes_[attrName] = attrValue;
    this.context_.setAttribute(this, attrName, attrValue);
  }

  /**
   * @this {!EditingNode}
   * @param {!EditingNode} textNode
   * @param {number} offset
   * @return {!EditingNode}
   */
  function splitText(offset) {
    if (!this.isText)
      throw new Error('Expect Text node');
    var nodeValue = this.domNode_.nodeValue;
    if (offset <= 0)
      throw new Error('offset(' + offset + ') must be greater than zero.');
    if (offset >= nodeValue.length)
      throw new Error('offset(' + offset + ') must be less than length.');
    this.splitOffset_ = offset;
    var newNode = new editing.EditingNode(this.context_, this.domNode_);
    newNode.splitOffset_ = -offset;
    this.context_.splitText(this, offset, newNode);
    return newNode;
  }

  /**
   * @this {!EditingNode}
   * @param {!EditingNode} refNode
   * @return {!EditingNode}
   */
  function splitTree(refNode) {
    var treeRoot = this;
    console.assert(treeRoot.isElement);
    console.assert(isDescendantOf(refNode, treeRoot));
    var lastNode = null;
    for (var runner = refNode; runner !== treeRoot; runner = runner.parentNode) {
console.log('splitTree', 'runner', runner);
      var newNode = runner.cloneNode(false);
      if (lastNode)
        newNode.appendChild(lastNode);
      lastNode = newNode;
    }
    console.log('splitTree', 'lastNode', lastNode);
    var newTreeRoot = treeRoot.cloneNode(false);
    newTreeRoot.appendChild(lastNode);
    treeRoot.parentNode.insertAfter(newTreeRoot, treeRoot);
    return newTreeRoot;
  }

  Object.defineProperties(EditingNode.prototype, {
    appendChild: {value: appendChild},
    attributes: {get: function() { return this.attributes_; }},
    attributes_: {writable: true},
    constructor: {value: EditingNode},
    childNodes: {get: childNodes},
    cloneNode: {value: cloneNode},
    context: {get: function() { return this.context_; }},
    context_: {writable: true},
    domNode: {get: function() { return this.domNode_; }},
    domNode_: {writable: true},
    firstChild: {get: function() { return this.firstChild_; }},
    firstChild_: {writable: true},
    insertAfter: {value: insertAfter},
    insertBefore: {value: insertBefore},
    isElement: {get: isElement},
    isEditable: {get: isEditable},
    isPhrasing: {get: isPhrasing},
    isText: {get: isText},
    lastChild: {get: function() { return this.lastChild_; }},
    lastChild_: {writable: true},
    nextSibling: {get: function() { return this.nextSibling_; }},
    nextSibling_: {writable: true},
    nodeName: {get: nodeName},
    nodeValue: {get: nodeValue},
    parentNode: {get: function() { return this.parentNode_; }},
    parentNode_: {writable: true},
    previousSibling: {get: function() { return this.previousSibling_; }},
    previousSibling_: {writable: true},
    removeChild: {get: removeChild},
    replaceChild: {get: replaceChild},
    setAttribute: {value: setAttribute},
    splitOffset: {get: function() { return this.splitOffset_; }},
    splitOffset_: {writable: true},
    splitText: {value: splitText},
    splitTree: {value: splitTree}
  });

  return EditingNode;
})());
