// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file./*

//////////////////////////////////////////////////////////////////////
//
// Operation
//
editing.define('Operation', (function() {
  function Operation(name) {
    this.name_ = name;
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
    name: {get: function() { return this.name_; }},
    name_: {writable: true},
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
  function AppendChild(parentNode, newChild) {
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
  function InsertBefore(parentNode, newChild, refChild) {
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
