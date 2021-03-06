// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file./*

//////////////////////////////////////////////////////////////////////
//
// Operation
//
editing.define('Operation', (function() {
  function Operation(operationName) {
    this.operationName_ = operationName;
  }

  /**
   * @this {!Operation}
   */
  function redo() {
    throw new Error('Abstract method Operation.prototype.redo called', this);
  }

  /**
   * @this {!Operation}
   */
  function undo() {
    throw new Error('Abstract method Operation.prototype.undo called', this);
  }

  Object.defineProperties(Operation.prototype, {
    constructor: Operation,
    execute: {value: function() { this.redo(); }},
    operationName: {get: function() { return this.operationName_; }},
    operationName_: {writable: true},
    redo: {value: redo },
    undo: {value: undo }
  });

  return Operation;
})());

//////////////////////////////////////////////////////////////////////
//
// AppendChild
//
editing.define('AppendChild', (function() {
  /**
   * @constructor
   * @param {!Node} parentNode
   * @param {!Node} newChild
   */
  function AppendChild(parentNode, newChild) {
    console.assert(!newChild.parentNode);
    editing.Operation.call(this, 'appendChild');
    this.parentNode_ = parentNode;
    this.newChild_ = newChild;
    Object.seal(this);
  }

  /**
   * @this {!AppendChild}
   */
  function redo() {
    this.parentNode_.appendChild(this.newChild_);
  }

  /**
   * @this {!AppendChild}
   */
  function undo() {
    this.parentNode_.removeChild(this.newChild_);
  }

  AppendChild.prototype = Object.create(editing.Operation.prototype, {
    constructor: AppendChild,
    newChild_: {writable: true},
    parentNode_: {writable: true},
    redo: {value: redo},
    undo: {value: undo}
  });

  return AppendChild;
})());

//////////////////////////////////////////////////////////////////////
//
// InsertBefore
//
editing.define('InsertBefore', (function() {
  /**
   * @constructor
   * @param {!Node} parentNode
   * @param {!Node} newChild
   * @param {?Node} refChild
   */
  function InsertBefore(parentNode, newChild, refChild) {
    console.assert(!newChild.parentNode);
    console.assert(parentNode === refChild.parentNode);
    editing.Operation.call(this, 'insertBefore');
    this.parentNode_ = parentNode;
    this.newChild_ = newChild;
    this.refChild_ = refChild;
    Object.seal(this);
  }

  /**
   * @this {!InsertBefore}
   */
  function redo() {
    this.parentNode_.insertBefore(this.newChild_, this.refChild_);
  }

  /**
   * @this {!InsertBefore}
   */
  function undo() {
    this.parentNode_.removeChild(this.newChild_);
  }

  InsertBefore.prototype = Object.create(editing.Operation.prototype, {
    constructor: InsertBefore,
    newChild_: {writable: true},
    parentNode_: {writable: true},
    refChild_: {writable: true},
    redo: {value: redo},
    undo: {value: undo}
  });

  return InsertBefore;
})());

//////////////////////////////////////////////////////////////////////
//
// RemoveAttribute
//
editing.define('RemoveAttribute', (function() {
  /**
   * @constructor
   * @implements {Operation}
   * @final
   * @param {!Element} element
   * @param {string} attrName
   */
  function RemoveAttribute(element, attrName) {
    editing.Operation.call(this, 'removeAttribute');
    this.element_ = element;
    this.attrName_ = attrName;
    this.oldValue_ = element.getAttribute(attrName);
    if (this.oldValue_ === null)
      throw new Error('You can not remove non-existing attribute ' + attrName);
    Object.seal(this);
  }

  /**
   * @this {!RemoveAttribute}
   */
  function redo() {
    this.element_.removeAttribute(this.attrName_);
  }

  /**
   * @this {!RemoveAttribute}
   */
  function undo() {
    this.element_.setAttribute(this.attrName_, this.oldValue_);
  }

  RemoveAttribute.prototype = Object.create(editing.Operation.prototype, {
    constructor: RemoveAttribute,
    attrName_: {writable: true},
    element_: {writable: true},
    oldValue_: {writable: true},
    redo: {value: redo},
    undo: {value: undo}
  });

  return RemoveAttribute;
})());

//////////////////////////////////////////////////////////////////////
//
// RemoveChild
//
editing.define('RemoveChild', (function() {
  function RemoveChild(parentNode, oldChild) {
    editing.Operation.call(this, 'removeChild');
    this.parentNode_ = parentNode;
    this.oldChild_ = oldChild;
    this.refChild_ = oldChild.nextSibling;
    Object.seal(this);
  }

  /**
   * @this {!RemoveChild}
   */
  function redo() {
    this.parentNode_.removeChild(this.oldChild_);
  }

  /**
   * @this {!RemoveChild}
   */
  function undo() {
    this.parentNode_.insertBefore(this.oldChild_, this.refChild_);
  }

  RemoveChild.prototype = Object.create(editing.Operation.prototype, {
    constructor: RemoveChild,
    oldChild_: {writable: true},
    parentNode_: {writable: true},
    refChild_: {writable: true},
    redo: {value: redo},
    undo: {value: undo}
  });

  return RemoveChild;
})());

//////////////////////////////////////////////////////////////////////
//
// ReplaceChild
//
editing.define('ReplaceChild', (function() {
  function ReplaceChild(parentNode, newChild, oldChild) {
    console.assert(!newChild.parentNode);
    console.assert(parentNode === oldChild.parentNode);
    editing.Operation.call(this, 'replaceChild');
    this.parentNode_ = parentNode;
    this.newChild_ = newChild;
    this.oldChild_ = oldChild;
    Object.seal(this);
  }

  /**
   * @this {!ReplaceChild}
   */
  function redo() {
    this.parentNode_.replaceChild(this.newChild_, this.oldChild_);
  }

  /**
   * @this {!ReplaceChild}
   */
  function undo() {
    this.parentNode_.replaceChild(this.oldChild_, this.newChild_);
  }

  ReplaceChild.prototype = Object.create(editing.Operation.prototype, {
    constructor: ReplaceChild,
    newChild_: {writable: true},
    oldChild_: {writable: true},
    parentNode_: {writable: true},
    redo: {value: redo},
    undo: {value: undo}
  });

  return ReplaceChild;
})());

//////////////////////////////////////////////////////////////////////
//
// SetAttribute
//
editing.define('SetAttribute', (function() {
  function SetAttribute(element, attrName, newValue) {
    if (newValue === null)
      throw new Error('You can not use null for attribute ' + attrName);
    editing.Operation.call(this, 'setAttribute');
    this.element_ = element;
    this.attrName_ = attrName;
    this.newValue_ = newValue;
    this.oldValue_ = element.getAttribute(attrName);
    Object.seal(this);
  }

  /**
   * @this {!SetAttribute}
   */
  function redo() {
    this.element_.setAttribute(this.attrName_, this.newValue_);
  }

  /**
   * @this {!SetAttribute}
   */
  function undo() {
    if (this.oldValue_ === null)
      this.element_.removeAttribute(this.attrName_);
    else
      this.element_.setAttribute(this.attrName_, this.oldValue_);
  }

  SetAttribute.prototype = Object.create(editing.Operation.prototype, {
    constructor: SetAttribute,
    attrName_: {writable: true},
    element_: {writable: true},
    newValue_: {writable: true},
    oldValue_: {writable: true},
    redo: {value: redo},
    undo: {value: undo}
  });

  return SetAttribute;
})());

//////////////////////////////////////////////////////////////////////
//
// SetStyle
//
editing.define('SetStyle', (function() {
  function SetStyle(element, propertyName, newValue) {
    editing.Operation.call(this, 'setAttribute');
    this.element_ = element;
    this.propertyName_ = propertyName;
    this.newValue_ = newValue;
    this.oldValue_ = element.style[propertyName];
    Object.seal(this);
  }

  /**
   * @this {!SetStyle}
   */
  function redo() {
    this.element_.style[this.propertyName_] = this.newValue_;
  }

  /**
   * @this {!SetStyle}
   */
  function undo() {
    this.element_.style[this.propertyName_] = this.oldValue_;
  }

  SetStyle.prototype = Object.create(editing.Operation.prototype, {
    constructor: SetStyle,
    element_: {writable: true},
    newValue_: {writable: true},
    oldValue_: {writable: true},
    propertyName_: {writable: true},
    redo: {value: redo},
    undo: {value: undo}
  });

  return SetStyle;
})());

//////////////////////////////////////////////////////////////////////
//
// SplitText
//
editing.define('SplitText', (function() {
  function SplitText(textNode, newNode) {
    editing.Operation.call(this, 'splitText');
    this.newNode_ = newNode;
    this.textNode_ = textNode;
    Object.seal(this);
  }

  /**
   * @this {!SplitText}
   */
  function redo() {
    var text = this.textNode_.nodeValue;
    this.textNode_.nodeValue = text.substr(
        0, text.length - this.newNode_.nodeValue.length);
    this.textNode_.parentNode.insertBefore(this.newNode_,
                                           this.textNode_.nextSibling);
  }

  /**
   * @this {!SplitText}
   */
  function undo() {
    this.textNode_.nodeValue += this.newNode_.nodeValue;
    this.newNode_.parentNode.removeChild(this.newNode_);
  }

  SplitText.prototype = Object.create(editing.Operation.prototype, {
    constructor: SplitText,
    newNode_: {writable: true},
    redo: {value: redo},
    textNode_: {writable: true},
    undo: {value: undo}
  });

  return SplitText;
})());
