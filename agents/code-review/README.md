# Code Reviewer Agent

This agent is designed to perform automated, high-quality code reviews by leveraging domain-specific **Skills**.

## 🧠 Capabilities

*   **Style Enforcement**: Checks against language-specific idioms (e.g., Effective Go).
*   **Security Scanning**: Identifies common vulnerabilities (XSS, Injection).
*   **Performance Optimization**: Suggests improvements for complexity and resource usage.
*   **Documentation Check**: Ensures public APIs are documented.

## 📂 Structure

*   `reviewer.py`: The CLI entry point for running reviews.
*   `prompts/`: System prompts and skill-specific instructions.
*   `config.yaml`: Configuration for linter rules and LLM settings.

## 🚀 Usage

```bash
# Review a specific file
python reviewer.py --file path/to/main.go --skill golang

# Review a text diff
python reviewer.py --diff "$(git diff)"
```

## 🛠 Integration with MCP

This agent can be configured to use the **YouTrack MCP** to automatically file issues for critical bugs found during review.

```bash
python reviewer.py --file main.go --report-to-youtrack
```
