import "server-only";

/**
 * Identifier factory.
 *
 * Ids are prefixed by entity (`prj-`, `tsk-`…) which makes the data readable
 * when you are staring at a database console, and are random enough to not
 * collide when two people create a project in the same millisecond.
 */
let sequence = 0;

export function nextId(prefix: string): string {
  sequence += 1;
  const stamp = Date.now().toString(36);
  const noise = Math.floor(Math.random() * 46_656).toString(36); // 3 base36 chars
  return `${prefix}-${stamp}${noise}${sequence.toString(36)}`;
}
