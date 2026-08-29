// Journey state is hydrated from sessionStorage at module init, which the server cannot
// read. Rendering this surface on the server would emit an empty session and mismatch on
// hydrate, so it is client-only. Decision 2 in the feature spec puts the funnel groups
// behind the same switch.
export const ssr = false;
