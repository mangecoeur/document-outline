'use babel';

function * entries(obj) {
  for (let key of Object.keys(obj)) {
    yield [key, obj[key]];
  }
}


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
    return scopeOne == scopeTwo;
  }
  let arrayOne;
  let arrayTwo;
  if (scopeOne.getScopesArray !== undefined) {
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

export {createElement, scopeEqual, scopeIn, scopeContains, scopeContainsOne, depthTreeIter, entries} ;
