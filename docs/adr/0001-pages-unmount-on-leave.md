# Pages unmount on leave, no keep-alive

A page mounts when it is navigated to and unmounts when it is left, the test page included. Previously every page was rendered at boot and hidden when not active, and the test page stayed partly alive through page-controller hooks and module-level listeners that checked the active page; we dropped that so page code never has to cope with being "hidden but alive". Leaving the test page mid-test ends the test, which is intended.

## Consequences

- Page code must survive mount and unmount: listeners, timers and element references bind on mount and release on unmount.
- Page content must only mount once it is attached to the document (page code queries `document` and measures layout on mount).
