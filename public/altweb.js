class AltElement {
  constructor(option) {
    if (!option) option = {};
    //setup
    this.altData = {};
    this.altEventHandlers = {
      statechange: () => {},
      map: () => {},
    };
    this.children = [];
    this.altState = "";
    this.stateHandlers = {};
    //dom
    this.tag = option.dom ? option.dom.tagName : option.tag || "DIV";
    this.dom = option.dom ? option.dom : document.createElement(this.tag);
    this.dom.altElement = this;
    //text and html
    if (option.html) this.html(option.html);
    if (option.text) this.text(option.text);
    //attributes
    for (let key in option) if (!["tag", "text", "html", "dom"].includes(key)) this.dom.setAttribute(key, option[key]);
    //utility
    this.classList = this.dom.classList;
    //plugin initializers
    if (alt.plugins.initializers[this.tag.toLowerCase()]) for (let fn of alt.plugins.initializers[this.tag.toLowerCase()]) fn(this);
  }

  addClass(className) {
    this.classList.add(className);
    return this;
  }

  removeClass(className) {
    this.classList.remove(className);
    return this;
  }

  toggleClass(className) {
    this.classList.toggle(className);
    return this;
  }

  id(id) {
    if (!id) return this.dom.id;
    this.dom.id = id;
    return this;
  }

  class(className) {
    if (!className) return this.dom.className;
    this.dom.className = className;
    return this;
  }

  prop(key, value) {
    if (typeof key == "string") {
      if (!value) return this.dom[key];
      this.dom[key] = value;
    }
    for (let i in key) this.dom[i] = i[key];
    return this;
  }

  call(fnName) {
    this.dom[fnName](...Array.from(arguments).slice(1));
    return this;
  }

  in(altElement) {
    altElement.children.push(this);
    this.parent = altElement;
    altElement.dom.append(this.dom);
    return this;
  }

  inat(altElement, position) {}

  on(event, fn) {
    this.dom.addEventListener(event, (evt) => fn(this, evt));
    return this;
  }

  attr(name, value) {
    if (value) this.dom.setAttribute(name, value);
    else return this.dom.getAttribute(name);
    return this;
  }

  has() {
    for (let arr of arguments)
      if (arr instanceof Array) for (let com of arr) com.in(this);
      else arr.in(this);
    return this;
  }

  remove(selector) {
    if (selector) for (let i of this.select("*")) i.remove();
    else {
      if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this));
      this.dom.remove();
    }
    return this;
  }

  text(string, append) {
    if (!string) return this.dom.innerText;
    if (this.textNode) this.textNode.data = string;
    else {
      if (!append) this.html("");
      this.textNode = this.dom.appendChild(document.createTextNode(string));
    }
    return this;
  }

  log() {
    console.log(this);
    return this;
  }

  become(altElement) {
    this.option = altElement.option;
    let parent = this.parent;
    this.children = altElement.children;
    this.remove();
    this.dom = altElement.dom;
    this.in(parent);
    return this;
  }

  select(selector) {
    return Array.from(this.dom.querySelectorAll(selector === "*" ? ":not(script)" : selector))
      .map((e) => e.altElement)
      .filter((v) => v !== undefined);
  }

  tick(interval, fn) {
    if (this.altData.tickInterval) clearInterval(this.altData.tickInterval);
    if (interval !== false) {
      this.altData.tick_count = 0;
      this.altData.tickInterval = setInterval(() => {
        fn(this, this.altData.tick_count);
        this.altData.tick_count++;
      }, interval);
    }
    return this;
  }

  wait(time, fn) {
    if (time === false) {
      if (this.altData.waitTimeout) clearTimeout(this.altData.waitTimeout);
    } else this.altData.waitTimeout = setTimeout(() => fn(this), time);
    return this;
  }

  hide() {
    this.dom.style.visibility = "hidden";
    return this;
  }

  show() {
    this.dom.style.visibility = "visible";
    return this;
  }

  html(string) {
    if (!string) return this.dom.innerHTML;
    if (this.dom.children.length != 0) this.remove("*");
    this.dom.innerHTML = string;
    for (let elem of this.dom.querySelectorAll(":not(script)")) this.constructor.of(elem).in(this);
    this.textNode = null;
    return this;
  }

  value(string) {
    if (!string) return this.dom.value;
    this.dom.value = string;
    return this;
  }

  data(key, value) {
    if (!value) return this.altData[key];
    this.altData[key] = value;
    return this;
  }

  state(name, fn) {
    if (!name) return this.altState;
    if (!fn) {
      this.altState = name;
      this.altEventHandlers.statechange(this);
      if (this.stateHandlers[name]) this.stateHandlers[name](this);
    } else this.stateHandlers[name] = fn;
    return this;
  }

  map(array, fn) {
    this.remove("*");
    for (let value of array) this.has(fn(value));
    this.altEventHandlers.map(this);
    return this;
  }

  dynamap(array, fn) {
    this.constructor.altFunctions.dynamapArray(array, fn, this);
    return this.map(array, fn);
  }

  onAltEvent(name, fn) {
    this.altEventHandlers[name] = fn;
    return this;
  }

  childrenExec(fn) {
    for (let i of this.children) fn(i, this);
    return this;
  }

  parentExec(fn) {
    fn(this.parent, this);
    return this;
  }

  exec(fn) {
    fn(this);
    return this;
  }

  style(object) {
    if (!object) return this.dom.style;
    if (arguments.length == 1 && typeof object == "string") {
      if (object.includes(":")) this.dom.style = object;
      else return this.dom.style[object];
    } else {
      if (arguments[1]) this.dom.style[object] = arguments[1];
      else for (let key in object) this.dom.style[key] = object[key];
    }
    return this;
  }

  color(string) {
    this.dom.style.color = string;
    return this;
  }

  bg(string) {
    this.dom.style.background = string;
    return this;
  }

  width(n, m) {
    if (!n) return this.dom.style.width;
    this.dom.style.width = n + (m ? m : "px");
    return this;
  }

  height(n, m) {
    if (!n) return this.dom.style.height;
    this.dom.style.height = n + (m ? m : "px");
    return this;
  }

  position(x, y) {
    if (!x) return this.dom.style.position;
    if (typeof x == "string") {
      this.dom.style.position = x;
      if (!y || !arguments[2]) return this;
      this.dom.style.top = y + (!arguments[3] ? "px" : arguments[3]);
      this.dom.style.left = arguments[2] + (!arguments[3] ? "px" : arguments[3]);
    } else {
      this.dom.style.top = x + (!arguments[2] ? "px" : arguments[2]);
      this.dom.style.left = y + (!arguments[2] ? "px" : arguments[2]);
    }
    return this;
  }

  bounds() {
    return this.dom.getBoundingClientRect();
  }

  use(name) {
    if (alt.plugins.useables[name]) alt.plugins.useables[name](this);
    else console.error("Failed to use : " + name);
    return this;
  }

  static from(selector) {
    return this.of(document.querySelector(selector));
  }

  static of(dom) {
    return new this({ dom: dom, html: dom.innerHTML });
  }

  static html(string) {
    let div = new this({ tag: "DIV" });
    div.dom.innerHTML = string;
    for (let elem of div.dom.children) this.of(elem).in(div);
    return div;
  }

  static map(object, fn) {
    return new this().map(object, fn);
  }

  static altFunctions = {
    dynamapArray: (array, fn, instance) => {
      array._set = (v) => {
        array.length = 0;
        array.push(...v);
      };
      array._get = () => array.filter((v) => typeof v != "function");
      array._trigger = () => instance.map(array, fn);
      for (let method of ["pop", "push", "reverse", "shift", "sort", "splice", "unshift"]) {
        array["_" + method] = function () {
          array[method](...arguments);
          instance.map(array, fn);
        };
      }
    },
  };
}

const alt = (param) => {
  if (typeof param == "object")
    if (param instanceof HTMLElement) return AltElement.of(param);
    else return new AltElement(param);
  if (typeof param == "string")
    if (param.includes("<")) return AltElement.html(param);
    else return AltElement.from(param);
};
alt.plugins = {
  generators: {},
  initializers: {},
  useables: {},
  packages: [],
  addGenerators: (generators) => {
    for (let name in generators) alt.plugins.generators[name] = generators[name];
  },
  addInitializers: (initializers) => {
    for (let tag in initializers) {
      if (!alt.plugins.initializers[tag]) alt.plugins.initializers[tag] = [];
      alt.plugins.initializers[tag].push(initializers[tag]);
    }
  },
  addUseables: (useables) => {
    for (let name in useables) alt.plugins.useables[name] = useables[name];
  },
  addPackage: (package) => {
    alt.plugins.packages.push({ name: package.name || "untitled", author: package.author || "unknow", version: package.version || "unknow", description: package.description || "no description" });
    if (package.generators) alt.plugins.addGenerators(package.generators);
    if (package.initializers) alt.plugins.addInitializers(package.initializers);
    if (package.useables) alt.plugins.addUseables(package.useables);
  },
};

alt.gen = (name, data) => {
  if (!alt.plugins.generators[name]) return console.error("Could not find plugin of name : " + name);
  return alt.plugins.generators[name](data);
};

alt.GET = (url, fn) => {
  let response = fetch(url).then((data) => data.json());
  if (!fn) return response;
  response.then((data) => fn(data));
};

alt.POST = (url, data, fn) => {
  let response = fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
  }).then((data) => data.json);
  if (!fn) return response;
  response.then((data) => fn(data));
};
