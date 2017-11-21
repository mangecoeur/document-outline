function jsonEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function * entries(obj) {
  for (let key of Object.keys(obj)) {
    yield [key, obj[key]];
  }
}

/**
 * Depth first iterator over a tree structure
 * @param {object} item array or object with 'children' attribute
 */
function * depthTreeIter(item) {
  if (Array.isArray(item)) {
    for (let child of item) {
      yield * depthTreeIter(child);
    }
  } else {
    for (let child of item.children) {
      yield * depthTreeIter(child);
    }
    yield item;
  }
}

function arrayEqual(a, b) {
  return a.length === b.length && a.every((elem, i) => {
    return elem === b[i];
  });
}

function scopeIncludesOne(scopeDescriptor, scopeList) {
  for (let scope of scopeList) {
    if (scopeDescriptor.includes(scope)) {
      return scope;
    }
  }
  return false;
}

// Does the given scope match one of a list of scopes
function scopeIn(scope, scopeList) {
  for (let matchScope of scopeList) {
    if (scopeEqual(scope, matchScope)) {
      return true;
    }
  }
  return false;
}

function scopeEqual(scopeOne, scopeTwo) {
  // # TODO: handle mixed string/array scopes
  if (typeof scopeOne === 'string' && typeof scopeTwo === 'string') {
    return scopeOne === scopeTwo;
  }
  let arrayOne;
  let arrayTwo;
  if (scopeOne.getScopesArray) {
    arrayOne = scopeOne.getScopesArray();
  } else {
    arrayOne = scopeOne; // how to copy?}
    if (scopeTwo.getScopesArray) {
      arrayTwo = scopeTwo.getScopesArray();
    } else {
      arrayTwo = scopeTwo;  // how to copy?
    }
  }
  return arrayEqual(arrayOne, arrayTwo);
}

function scopeContainsOne(scope, scopeList) {
  for (let matchScope of scopeList) {
    if (scopeContains(scope, matchScope)) {
      return matchScope;
    }
  }
  return false;
}

function scopeContains(outerScope, innerScope) {
  if (typeof outerScope === 'string' && typeof outerScope === 'string') {
    return outerScope.includes(innerScope);
  }
  let arrayOne;
  let arrayTwo;
  let oScope;
  if (outerScope.getScopesArray) {
    arrayOne = outerScope.getScopesArray();
  } else {
    arrayOne = outerScope;
  }

  if (innerScope.getScopesArray) {
    arrayTwo = innerScope.getScopesArray();
  } else {
    arrayTwo = innerScope;
  }

  if (typeof arrayTwo === 'string') {
    for (oScope in arrayOne) {
      if (oScope.includes(arrayTwo)) {
        return true;
      }
    }
    return false;
  }

  for (let oScope of arrayOne) {
    for (let iScope of arrayTwo) {
      if (oScope.includes(iScope)) {
        return true;
      }
    }
  }
  return false;
}

function createElement(tagName, attributes = {}, textContent = '') {
  let el = document.createElement(tagName);
  el.textContent = textContent;
  for (let [key, value] of entries(attributes)) {
    el.setAttribute(key, value);
  }
  return el;
}

module.exports = {createElement, scopeEqual, scopeIn, scopeContains, scopeContainsOne, scopeIncludesOne, depthTreeIter, entries, jsonEqual} ;
