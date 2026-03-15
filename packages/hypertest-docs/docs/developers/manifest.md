# Architecture Decisions

This document serves as a central repository for key architectural choices made during the development of this project. It outlines the rationale, context, and consequences of our technical path, formatted as a series of Questions and Answers (Q&A) to provide clarity for both current and future contributors.

---

## Q: Why do we need a manifest file?

**Context:** During a typical development cycle, a developer might deploy an image to the cloud but continue making changes to their local environment day-to-day. If we were to build the runtime context dynamically during the invocation phase, it would rely on the current local state rather than the deployed state. This creates a critical inconsistency between the local code and the cloud deployment, which can lead to execution errors—such as attempting to call non-existent tests or failing to trigger tests that should run.

**Decision:** We introduced a manifest file to serve as a fixed "source of truth". The manifest freezes the required context and state at the exact moment of deployment, ensuring that the cloud deployment and the execution context remain perfectly synchronized.

**Consequences:**
* **Pros:** * **Guarantees Consistency:** Completely prevents environmental drift between the local workspace and the cloud.
  * **Reliable Invocation:** Ensures the `invoke` phase always operates on predictable parameters, eliminating the risk of test execution mismatches.
* **Cons:** * Adds a slight overhead to the deployment process, as the manifest state must be generated and maintained alongside the code.
