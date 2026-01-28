/**
 * Simple recursion depth tracker to prevent runaway loops.
 * Maintains a stack of labels and exposes status reporting.
 */

export function createRecursionTracker(maxDepth = 10) {
  const stack = [];

  function enter(label = 'frame') {
    stack.push(label);
    if (stack.length > maxDepth) {
      throw new Error(`Recursion depth exceeded (>${maxDepth})`);
    }
    return stack.length;
  }

  function exit() {
    stack.pop();
    return stack.length;
  }

  function status() {
    return {
      depth: stack.length,
      maxDepth,
      path: [...stack]
    };
  }

  return { enter, exit, status };
}

