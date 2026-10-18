"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const script = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function boot(saved, startHash = "#hem") {
  const values = new Map();
  if (saved) values.set("hemmakompassen-demo-v1", JSON.stringify(saved));
  const handlers = {};
  const elements = {};
  const node = () => ({
    innerHTML: "", textContent: "", value: "",
    classList: { add() {}, remove() {} },
    querySelector() { return { textContent: "" }; },
    addEventListener() {},
    scrollIntoView() {}
  });
  for (const sel of ["#app", "#desktop-nav", "#mobile-nav", "#toast", "#side-profile", "#first-name"]) elements[sel] = node();
  const loc = { hash: startHash };
  const document = {
    querySelector(sel) { return elements[sel] || null; },
    addEventListener(type, callback) { handlers[type] = callback; }
  };
  const window = {
    addEventListener(type, callback) { handlers["window:" + type] = callback; },
    scrollTo() {}
  };
  const localStorage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); }
  };
  const environment = {
    document, window, location: loc, localStorage,
    setTimeout() { return 1; }, clearTimeout() {},
    confirm() { return true; }
  };
  vm.runInNewContext(script, environment, { filename: "app.js" });
  return {
    get html() { return elements["#app"].innerHTML; },
    get state() { return JSON.parse(values.get("hemmakompassen-demo-v1") || "null"); },
    get nav() { return elements["#mobile-nav"].innerHTML; },
    elements, handlers,
    go(route) { loc.hash = "#" + route; handlers["window:hashchange"](); }
  };
}

function savedDemo() {
  return {
    version: 1, onboarded: true, role: "parent",
    profiles: { teen: { name: "Alex" }, parent: { name: "Sam" } },
    swipes: { teen: {}, parent: {} },
    personality: { teen: {}, parent: {} },
    messages: [], rules: []
  };
}

test("New visitors see introduction, not invented accounts", () => {
  const page = boot();
  assert.match(page.html, /Ett rum för/);
  assert.match(page.html, /Jag vill prova som/);
  assert.match(page.html, /demoprofil/);
  assert.doesNotMatch(page.html, /TonårsTest/);
});

test("Onboarding creates only a local demo profile and displays relevant homepage", () => {
  const page = boot();
  page.elements["#first-name"].value = "Moa";
  const form = {
    id: "onboarding-form",
    querySelector() { return { value: "parent" }; }
  };
  page.handlers.submit({ target: form, preventDefault() {} });
  assert.equal(page.state.onboarded, true);
  assert.equal(page.state.role, "parent");
  assert.equal(page.state.profiles.parent.name, "Moa");
  assert.match(page.html, /Som förälder/);
  assert.match(page.html, /Så ska ni kopplas ihop/);
});

test("Each central page renders for an existing demo without a backend", () => {
  const page = boot(savedDemo());
  for (const route of ["hem","inkorg","swipe","personlighet","kommunikation","regler","medlare","installningar","familj"]) {
    page.go(route);
    assert.ok(page.html.length > 100, route + " should not be blank");
  }
  page.go("familj");
  assert.match(page.html, /Familjekoder fungerar inte ännu/);
  assert.match(page.html, /Privat för varje konto/);
});

test("Legacy demo localStorage stays compatible with the new intro flow", () => {
  const legacy = savedDemo();
  delete legacy.onboarded;
  const page = boot(legacy);
  assert.match(page.html, /Välkommen till ert rum/);
});

test("Personality exercise remains explicitly non-validated", () => {
  const page = boot(savedDemo(), "#personlighet");
  assert.equal((page.html.match(/class="question-box"/g) || []).length, 15);
  assert.match(page.html, /inte ett validerat personlighetstest/);
});
