# Grandis Legacy Project Workflow Rules

These rules apply to future Grandis Legacy bug-fix work and must be copied into any future Takeover Note.

## Bug reports do not authorize packaging

A user bug report is an instruction to investigate, reproduce, root-cause, patch in the working copy when appropriate, and verify. It is **not** permission to immediately generate a new repository ZIP/artifact.

Multiple reported bugs should be consolidated into the same candidate working tree when practical so fixes can be validated together and the Project/Library is not flooded with one ZIP per bug.

## Packaging requires explicit permission

When the accumulated fixes are substantial enough and the candidate appears ready to become a new version/repository package, stop and ask the user for permission before generating the final repository ZIP.

Only package after the user explicitly approves it (for example: "iya buat", "generate", "package", or equivalent).

## Takeover Note requirement

Every future Takeover Note must include these workflow rules explicitly so a new chat/model does not revert to one-bug-one-ZIP behavior.
