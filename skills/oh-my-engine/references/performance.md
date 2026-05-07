# Performance Reference

Optimize only against a concrete bottleneck or measurable risk.

- Establish the baseline before changing behavior.
- Prefer algorithmic and data-flow fixes before adding caches.
- Keep cache invalidation and memory growth explicit.
- Verify improvement with measurements when possible.
- Do not trade correctness, security, or maintainability for unproven speed.
