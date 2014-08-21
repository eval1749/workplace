// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

editing.define('Editor', (function() {
  /**
   * @constructor
   * @param {!Document} document
   */
  function Editor(document) {
    this.context_ = null;
    this.currentContext_ = null;
    this.document_ = document;
    this.redoStack_ = [];
    this.selection_ = null;
    this.undoStack_ = [];
    Object.seal(this);
  }

  /**
   * @this {!Editor}
   * @param {string} name
   * @param {!ReadOnlySelection}
   *    offset, we don't need to use |selection| parameter.
   * @return {!EditingContext}
   */
  function createContext(name, selection) {
    console.assert(selection instanceof editing.ReadOnlySelection,
                   selection + ' must be ReadOnlySelection');
    return new editing.EditingContext(this, name, selection);
  }

  /**
   * @this {!Editor}
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
    if (this.currentContext_) {
      throw new Error("We don't execute document.execCommand(" + name +
        ") this time, because it is called recursively in" +
        " document.execCommand('" + this.currentContext_.name + ')');
    }
    var context = this.createContext(name, this.selection_);
    this.currentContext_ = context;
    var succeeded = false;
    var returnValue;
    try {
      returnValue = commandFunction(context, userInterface, value);
      succeeded = true;
    } catch (exception) {
      console.log('execCommand', exception);
    } finally {
      this.currentContext_ = null;
      if (!succeeded)
        return 'FAILED';
      console.assert(context.endingSelection instanceof
                     editing.ReadOnlySelection);
      console.assert(context.startingSelection instanceof
                     editing.ReadOnlySelection);
      this.setSelection(context.endingSelection);
      this.undoStack_.push({commandName: name,
                            endingSelection: context.endingSelection,
                            instructions: context.instructions,
                            startingSelection: context.startingSelection});
      return returnValue;
    }
  }

  /**
   * @this {!Editor}
   * @param {!editing.ReadOnlySelection}
   */
  function setSelection(selection) {
    console.assert(selection instanceof editing.ReadOnlySelection, selection);
    this.selection_ = selection;
    selection.setDomSelection(this.document_.getSelection());
  }

  Object.defineProperties(Editor.prototype, {
    createContext: {value: createContext},
    currentContext: {value: function() { return this.currentContext_; }},
    currentContext_: {writable: true},
    document: {get: function() { return this.document_; }},
    document_: {writable: true},
    execCommand: {value: execCommand},
    selection: {get: function() { return this.selection_; }},
    selection_: {writable: true},
    setSelection: {value: setSelection },
    redoStack_: {writable: true},
    undoStack_: {writable: true}
  });
  return Editor;
})());
