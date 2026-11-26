import test from "node:test";
import assert from "node:assert/strict";
import { classify, isYuri, safeNext } from "./policy";

test("minor-sexualising terms are blocked, whole-word, in title, description or tags", () => {
  assert.equal(classify({ title: "Lolicon paradise" }).action, "block");
  assert.equal(classify({ title: "x", tags: ["Shota"] }).action, "block");
  assert.equal(classify({ title: "x", description: "two kids in a bath" }).action, "block");
  assert.equal(classify({ title: "Underage?!" }).action, "block");
});
test("whole-word only: ordinary words that contain a blocked string are not blocked", () => {
  assert.equal(classify({ title: "Babylon nights" }).action, "ok");   // contains 'baby'
  assert.equal(classify({ title: "Minority Report", tags: ["thriller"] }).action, "ok"); // contains 'minor'
  assert.equal(classify({ title: "Kidnapped queen" }).action, "ok");  // contains 'kid'
});
test("school-setting words hold a work for review instead of rejecting it", () => {
  assert.equal(classify({ title: "x", tags: ["school uniform"] }).action, "review");
  assert.equal(classify({ title: "After class", tags: ["Classroom"] }).action, "review");
});
test("an ordinary adult listing passes", () => {
  assert.equal(classify({ title: "Office Lovers", tags: ["yuri", "office", "adult"] }).action, "ok");
});
test("yuri detection promotes yuri / girls love / sapphic tags", () => {
  assert.equal(isYuri(["Girls' Love", "romance"]), true);
  assert.equal(isYuri(["sapphic"]), true);
  assert.equal(isYuri(["action"]), false);
  assert.equal(isYuri(["action"], "A Yuri Story"), true);
});
test("safeNext only ever returns a same-site path", () => {
  assert.equal(safeNext("/works/3"), "/works/3");
  assert.equal(safeNext("//evil.com"), "/");
  assert.equal(safeNext("https://evil.com"), "/");
  assert.equal(safeNext("/\\evil.com"), "/");
  assert.equal(safeNext(null), "/");
});
