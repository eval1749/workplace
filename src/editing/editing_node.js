// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

editing.define('EditingNode', (function() {
  /* @const */ var INTERACTIVE = editing.CONTENT_CATEGORY.INTERACTIVE;
  /* @const */ var PHRASING = editing.CONTENT_CATEGORY.PHRASING;

  /**
   * @param {!EditingContext} context
   * @param {!Node} node
   */
  function EditingNode(context, domNode) {
    console.assert(domNode instanceof Node);
    this.attributes_ = [];
    this.context_ = context;
    this.domNode_ = domNode;
    this.hashCode_ = context.nextHashCode();
    this.parentNode_ = null;
    this.firstChild_ = null;
    this.lastChild_ = null;
    this.nextSibling_ = null;
    this.previousSibling_ = null;
    this.styleMap_ = {};
    this.textEndOffset_ = this.isText ? domNode.length : 0;
    this.textStartOffset_ = 0;
    Object.seal(this);

    var attributes = domNode.attributes;
    if (!attributes)
      return;
    var node = this;
    [].forEach.call(attributes, function(attrNode) {
      var newAttrNode = domNode.ownerDocument.createAttribute(
          attrNode.name.toLowerCase());
      if (newAttrNode.name == 'style') {
        // IE11 put ";" for "style" but others don't.
        newAttrNode.value = attrNode.value.replace(/;$/, '');
      } else {
        newAttrNode.value = attrNode.value;
      }
      node.attributes_.push(newAttrNode);
    });
  };

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
    this.context_.recordCloneNode(false);
    var domNode = this.domNode_.cloneNode(false);
    var cloneNode = new EditingNode(this.context_, domNode);
    if (this.domNode_.nodeType === Node.ELEMENT_NODE) {
      var attrs = this.attributes_;
      for (var attrName in attrs) {
        cloneNode.attributes_[attrName] = attrs[attrName];
      }
    }
    return cloneNode;
  }

  /**
   * @param {!EditingNode} node
   * @param {string} attrName;
   * @return {*}
   */
  function findAttributeNode(node, attrName) {
    attrName = attrName.toLowerCase();
    return node.attributes_.find(function(attributeNode) {
      return attributeNode.name == attrName;
    });
  }

  /**
   * @this {!EditingNode}
   * @param {string} attrName
   * @return {?string}
   */
  function getAttribute(attrName) {
    var attributeNode = findAttributeNode(this, attrName);
    if (!attributeNode)
      return null;
    return attributeNode.value;
  }

  /**
   * @this {!EditingNode}
   * @param {string} attrName
   * @return {boolean}
   */
  function hasAttribute(attrName) {
    console.assert('EditingNode.Node expect string as attribute name ' +
                    'rather than ' + attrName);
    return findAttributeNode(this, attrName) != null;
  }

  /**
   * @this {!EditingNode}
   * @return {boolean}
   */
  function hasChildNodes() {
    return this.firstChild !== null;
  }

  /**
   * @this {!EditingNode}
   * @param {!EditingNode} newChild
   */
  function internalAppendChild(parentNode, newChild) {
    console.assert(parentNode instanceof editing.EditingNode);
    console.assert(newChild instanceof editing.EditingNode);
    if (!editing.nodes.isElement(parentNode) &&
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
    console.assert(editing.nodes.isElement(parentNode));
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
    console.assert(editing.nodes.isElement(parentNode));
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
   * @return {boolean}
   */
  function isContentEditable() {
    for (var runner = this; runner; runner = runner.parentNode) {
      var contentEditable = runner.getAttribute('contenteditable');
      if (typeof(contentEditable) == 'string')
        return contentEditable.toLowerCase() != 'false';
      if (editing.isContentEditable(runner.domNode_))
        return true;
    }
    return false;
  }

  /**
   * @this {!EditingNode}
   * @return {boolean}
   */
  function isInteractive() {
    var model = editing.contentModel[this.domNode_.nodeName];
    return model !== undefined && Boolean(model.categories[INTERACTIVE]);
  }

  /**
   * @this {!EditingNode}
   * @return {boolean}
   */
  function isPhrasing() {
    if (!editing.nodes.isElement(this))
      return true;
    var model = editing.contentModel[this.domNode_.nodeName];
    return model !== undefined && Boolean(model.categories[PHRASING]);
  }

  /**
   * @this {!EditingNode}
   * @return {boolean}
   */
  function isText() {
    return this.domNode_ instanceof CharacterData;
  }

  /**
   * @this {!EditingNode}
   * @return {number}
   */
  function maxOffset() {
    return this.isText ? this.nodeValue.length : this.childNodes.length;
  }

  /**
   * @this {!EditingNode}
   * @return {number}
   */
  function nodeIndex(){
    var index = 0;
    var parentNode = this.parentNode;
    for (var child = parentNode.firstChild; child; child = child.nextSibling) {
      if (child === this)
        return index;
      ++index;
    }
    throw 'NOTREACEHD';
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
    if (!this.textStartOffset_ && nodeValue.length == this.textEndOffset_) {
      // Avoid string copy.
      return nodeValue;
    }
    return nodeValue.substring(this.textStartOffset_, this.textEndOffset_);
  }


  /**
   * @this {!EditingNode}
   * @param {string} name
   */
  function removeAttribute(name) {
    console.assert(typeof(name) == 'string',
        'Attribute name must be string rather than ' + name);
    delete this.attributes_[name];
    this.context_.removeAttribute(this, name);
  }

  /**
   * @this {!EditingNode}
   * @param {!EditingNode} oldChild
   */
  function removeChild(oldChild) {
    console.assert(oldChild instanceof editing.EditingNode);
    if (oldChild.parentNode_ !== this)
      throw new Error('Bad parent');
    this.context_.removeChild(this, oldChild);
    internalRemoveChild(oldChild);
  }

  /**
   * @this {!EditingNode}
   * @param {!EditingNode} newChild
   * @param {!EditingNode} oldChild
   */
  function replaceChild(newChild, oldChild) {
    console.assert(newChild instanceof editing.EditingNode);
    console.assert(oldChild instanceof editing.EditingNode);
    if (newChild === oldChild)
      throw new Error('newChild and oldChild must be different');
    if (oldChild.parentNode !== this)
      throw new Error('oldChild ' + oldChild + ' must be a child of ' + this);

    this.context_.replaceChild(newChild, oldChild);
    internalReplaceChild(this, newChild, oldChild);
  }

  /**
   * @this {!EditingNode}
   * @param {string} name
   * @param {string} value
   */
  function setAttribute(attrName, attrValue) {
    console.assert(editing.nodes.isElement(this));
    attrName = attrName.toLowerCase();
    this.context_.setAttribute(this, attrName, attrValue);
    var attributeNode = findAttributeNode(this, attrName);
    if (attributeNode) {
      attributeNode.value = attrValue;
      return;
    }
    var newAttributeNode = this.context_.document.createAttribute(attrName);
    newAttributeNode.value = attrValue;
    this.attributes_.push(newAttributeNode);
  }

  /**
   * @this {!EditingNode}
   * @return {string}
   */
  function toString() {
    var value = this.nodeValue || this.nodeName;
    var position = this.parentNode_ ? '@' + this.nodeIndex : '';
    return '[EditingNode ' + value + position + ' #' + this.hashCode + ']';
  }

  Object.defineProperties(EditingNode.prototype, {
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
    getAttribute: {value: getAttribute},
    hasAttribute: {value: hasAttribute },
    hasChildNodes: {value: hasChildNodes },
    hashCode: {get: function() { return this.hashCode_; }},
    hashCode_: {writable: true},
    isContentEditable: {get: isContentEditable},
    isInteractive: {get: isInteractive},
    isPhrasing: {get: isPhrasing},
    isText: {get: isText},
    lastChild: {get: function() { return this.lastChild_; }},
    lastChild_: {writable: true},
    maxOffset: {get: maxOffset},
    nextSibling: {get: function() { return this.nextSibling_; }},
    nextSibling_: {writable: true},
    nodeIndex: {get: nodeIndex }, // for debugging
    nodeName: {get: nodeName},
    nodeType: {get: function() { return this.domNode_.nodeType; }},
    nodeValue: {get: nodeValue},
    parentNode: {get: function() { return this.parentNode_; }},
    parentNode_: {writable: true},
    previousSibling: {get: function() { return this.previousSibling_; }},
    previousSibling_: {writable: true},
    removeAttribute: {value: removeAttribute},
    removeChild: {value: removeChild},
    replaceChild: {value: replaceChild},
    setAttribute: {value: setAttribute},
    styleMap: {get: function() { return this.styleMap_; }},
    styleMap_: {writable: true},
    textEndOffset: {get: function() { return this.textEndOffset_; }},
    textEndOffset_: {writable: true},
    textStartOffset: {get: function() { return this.textStartOffset_; }},
    textStartOffset_: {writable: true},
    toString: {value: toString}
  });

  return EditingNode;
})());
