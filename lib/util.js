'use babel'

function* entries(obj) {
  for (let key of Object.keys(obj)) {
    yield [key, obj[key]];
  }
}

export default function createElement(tagName, attributes = {}, textContent = '') {
  let el = document.createElement(tagName);
  el.textContent = textContent;
  for (let [key, value] of entries(attributes)) {
    el.setAttribute(key, value);
  }
  return el;
}
