// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file./*
'use strict';

function Selection() {
    var domSelection = getSelection();
    this.range = domSelection.getRangeAt(0);
    this.collapsed = this.range && this.range.collapsed;
    this.isEmpty = !this.range;

    this.insertNode = function(newNode) {
        // FIXME: Push to undo stack
        this.range.insertNode(newNode);
    };

    this.surroundContents = function(newNode) {
        // FIXME: Push to undo stack
        this.range.surroundContents(newNode);
    };
}


// http://www.whatwg.org/specs/web-apps/current-work/multipage/dom.html#content-models
// Metadata content
// Flow content
// Sectioning content
// Heading content
// Phrasing content
// Embedded content
// Interactive content

// Text-level elements
DefineContentModel('a', {
    categories: makeSet([FLOW_CONTENT, PHRASING_CONTENT, INTERACTIVE_CONTENT, PALPABLE_CONTENT]),
    usableContexts: makeSet([PHRASING_CONTENT]),
    contentModel: [TRANSPARENT_WITHOUT_INTERACTIVE],
});

DefineContentModel(['em', 'strong', 'small', 's', 'cite', 'q', 'dfn', 'abbr', 'ruby', 'data', 'time', 'code', 'var', 'samp', 'kbd', 'sub', 'sup', 'i', 'b', 'u', 'mark', 'bdi', 'bdo', 'span'], {
    categories: makeSet([FLOW_CONTENT, PHRASING_CONTENT, PALPABLE_CONTENT]),
    usableContexts: makeSet([PHRASING_CONTENT]),
    contentModel: makeSet([PHRASING_CONTENT]),
});

DefineContentModel(['rt', 'rp'], {
    categories: makeSet([]),
    usableContexts: makeSet(['ruby']),
    contentModel: makeSet([PHRASING_CONTENT]),
});

DefineContentModel(['br', 'wbr'], {
    categories: makeSet([FLOW_CONTENT, PHRASING_CONTENT]),
    usableContexts: makeSet([PHRASING_CONTENT]),
    contentModel: makeSet([]),
});

// Sections
DefineContentModel(['h1', 'h2', 'h3' 'h4', 'h5', 'h6'], {
    categories: makeSet([FLOW_CONTENT, HEADING_CONTENT, PALPABLE_CONTENT]),
    usableContexts: makeSet(['hgroup', FLOW_CONTENT]),
    contentModel: makeSet([PHRASING_CONTENT]),
});

// Grouping content
DefineContentModel(['dvi', 'p'], {
    categories: makeSet([FLOW_CONTENT, PALPABLE_CONTENT]),
    usableContexts: makeSet(FLOW_CONTENT]),
    contentModel: makeSet([PHRASING_CONTENT]),
});

DefineContentModel(['blockquote', 'p'], {
    categories: makeSet([FLOW_CONTENT, PALPABLE_CONTENT]),
    usableContexts: makeSet(FLOW_CONTENT]),
    contentModel: makeSet([PHRASING_CONTENT]),
});

// Embedded content
DefineContentModel(['img'], {
    categories: makeSet([FLOW_CONTENT, PHRASING_CONTENT, EMBEDDED_CONTENT, PALPABLE_CONTENT]),
    usableContexts: makeSet(FLOW_CONTENT]),
    contentModel: makeSet([]),
});

// Tabular data
DefineContentModel(['table'], {
    categories: makeSet([FLOW_CONTENT, PALPABLE_CONTENT]),
    usableContexts: makeSet(FLOW_CONTENT]),
    contentModel: makeSet(['caption', 'colgroup', 'thead', tfoot, tbody]),
});

DefineContentModel(['caption'], {
    categories: makeSet([]),
    usableContexts: makeSet(['table']),
    contentModel: makeSet([FLOW_CONTENT]),
});

DefineContentModel(['tr'], {
    categories: makeSet([]),
    usableContexts: makeSet(['thread', 'tbody', 'tfoot', 'table']),
    contentModel: makeSet([FLOW_CONTENT]),
});

DefineContentModel(['td'], {
    categories: makeSet([SECTIONING_ROOT]),
    usableContexts: makeSet(['tr']),
    contentModel: makeSet([FLOW_CONTENT]),
});

DefineContentModel(['th'], {
    categories: makeSet([]),
    usableContexts: makeSet(['tr']),
    contentModel: makeSet([FLOW_CONTENT]),
});

class Position {
    var node : Node;
    var textOffset : int;
    public boolean isText { get }
};

class Selection {
  public boolean isText; // all ndoes between start and end are text node.
  public DomPosition focusPosition { get }
  public DomPosition anchorPosition { get }
  public DomPosition startPosition { get }
  public DomPosition endPosition { get }
  public Node startNode;
  public int startOffset;
  public Node endNode;
  public int endOffset;
};

Object.defineProperty(EditingSelection.prototype, 'isEndWithPartialText', {
    get:
    /**
     * @this {!EditingSelection}
     */
    function() {
        return this.endNode && this.endNode.nodeType == Node.TEXT_NODE &&
                this.endNode.nodeValue.length = this.endOffset;
    }
});

class Context {
  public Context();
  public Selection selection { get }

  public void appendChild(parentNode, newChild);
  public Register createElement(tagName);
  public void insertBefore(newChild, refNode);
  public void insertBeforePosition(newChild, refNode);
  public void setAttribute(element, newText);
  public void setSelectionEnd(node);
  public void setSelectionStart(node);
  public void setTextContent(element, newText);
  public Register splitTree(treeRoot, positionInTree);
  public Register splitTextNode(textNode, textOffset);
};

Context.prototype.insertBeforePosition = function(newChild, position) {
    if (position.isText) {
        if (!position.textOffset) {
            // <b>|foo</b> => <b><a>url</a>foo</b>
            this.insertBefore(newChild, position.node);
            return;
        }
        if (position.isTextEnd) {
            // <b>foo|</b> => <b>foo<a>url</a></b>
            if (position.node.nextSibling)
                this.insertBefore(newChild, position.node.nextSibling);
            else
                this.appendChild(position.node.parentNode, newChild);
            return;
        }
        // <b>fo|o</b> => <b>fo<a>url</a>o</b>
        this.splitTextNode(position.node, position.textOffset);
        this.insertBefore(newChild, position.node);
        return;
    }
    // |<b>foo</b> => <a>url</a><b>foo</b>
    this.insertBefore(newChild, position.node);
};


/**
 * @param {!Node} node
 * @return {?Node}
 */
function following(node) {
    if (node.firstChild)
        return node.firstChild;
    var nextSibling = node.nextSibling;
    if (nextSibling)
        return nextSibling;
    var parentNode = node.parentNode;
    return parentNode ? parentNode.nextSibling : null;
}

//////////////////////////////////////////////////////////////////////
//
// Commands
//

// <p uneditable><span editable>foo<a>bar</a></span></p>
// =>
// <p uneditable><span editable><a>foo</a></span><span editable><a>bar</a></span></p>

// Split tree of |this| before |refNode|.
Node.prototype.splitTreeBefore = function(refNode) {
  var rootNode = this;
  assert(rootNode.parentNode.isEditable);
  var ancestorsOfRefNode = [];
  var ancestor = refNode.parentNode;
  while (ancestor != root) {
    ancestorsOfRefNode.push(ancestor);
    ancestor = ancestor.parentNode;
  }
  var copyRootNode = root.cloneNode(false);
  var copyParentNode = copyRootNode;
  ancestorsOfRefNode.forEach(function(originalNode) {
    var copyNode = originalNode.cloneNode(false);
    copyParentNode.appendChild(copyNode);
    copyParentNode = copyNode;
  });
  copyParentNode.appendChild(refNode);
  rootNode.parentNode.insertAfter(copyRootNode, rootNode);
  return copyRootNode;
}

function DescendantsOrSelf(startNode) {
  this.currentNode = startNode;
  this.rootNode = startNode;
}

DescendantsOrSelf.prototype.next = {
  if (!currentNode)
    return {done: true};
  var result = {done: false, value: this.currentNode};
  if (this.currentNode.firstChild) {
    this.currentNode = this.currentNode.firstChild;
    return result;
  }

  while (this.currentNode != this.rootNode) {
    if (this.currentNode.nextSibling) {
      this.currentNode = this.currentNode.nextSibling;
      return result;
    }
    this.currentNode = this.currentNode.parentNode;
  }
  this.currentNode = null;
  return result;
};

// Split tree rooted by |rootNode| before |refNode|.
NodeIterator.prototype.splitTreeBefore = function(rootNode, refNode) {
  rootNode.splitTreeBefore(rootNode);
  var iterator = new DescendantsOrSelf(rootNode.nextSibling);
  var iteratorResult;
  while (!(iteratorResult = iterator.next()).done) {
    this.nodes.unshift(iteratorResult.value);
  }
};

var commandMap = {
    createLink: createLink,
};

function executeCommand(commandName, commandValue) {
    var commandFunction = commandMap[commandName];
    if (!commandFunction)
        return false;
    selection = new Selection();
    var returnValue = commandFunction(commandValue);
    context.runProgram(commandName);
    return returnValue;
}

installClass('Editor', {executeCommand: executeCommand});
