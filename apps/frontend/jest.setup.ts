import "@testing-library/jest-dom";

// jsdom lacks the pointer-capture and scrolling APIs Radix Select calls when it
// opens. No-op stand-ins are enough for the tests.
if (typeof Element !== "undefined") {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
}
