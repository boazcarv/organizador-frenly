/**
 * Starting value for the tracker clock: a session already in progress, so the
 * card never greets the user with a zeroed stopwatch. Kept out of the seed data
 * module so the client bundle stays free of server-only imports.
 */
export const TRACKER_SEED_SECONDS = 5048;
