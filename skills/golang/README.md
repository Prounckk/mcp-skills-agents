# Effective Go Skills

A curated collection of Go programming skills and best practices based on the official "Effective Go" documentation.

## Overview

This directory contains practical skills and examples for writing idiomatic Go code. Each skill focuses on a specific aspect of Go programming with clear explanations and working examples.

## Skills Catalog

### 1. Formatting and Code Style
- **File**: `formatting.md`
- **Topics**: gofmt, code layout, naming conventions

### 2. Error Handling
- **File**: `error_handling.md`
- **Topics**: explicit error checks, error wrapping, error types

### 3. Concurrency Patterns
- **File**: `concurrency.md`
- **Topics**: goroutines, channels, select statements, sync primitives

### 4. Interface Design
- **File**: `interfaces.md`
- **Topics**: interface definitions, small interfaces, type assertions

### 5. Testing Strategies
- **File**: `testing.md`
- **Topics**: unit tests, table-driven tests, benchmarks

### 6. Context Usage
- **File**: `context.md`
- **Topics**: context propagation, cancellation, deadlines

## How to Use

Each skill file contains:
- **Principle**: The core concept or best practice
- **Why it Matters**: Explanation of the importance
- **Good Example**: Idiomatic Go code demonstrating the principle
- **Bad Example**: Common anti-patterns to avoid
- **Additional Tips**: Extra guidance and edge cases

## Quick Reference

### Essential Go Proverbs
- Don't communicate by sharing memory, share memory by communicating
- Concurrency is not parallelism
- Channels orchestrate; mutexes serialize
- The bigger the interface, the weaker the abstraction
- Make the zero value useful
- interface{} says nothing
- Gofmt's style is no one's favorite, yet gofmt is everyone's favorite
- A little copying is better than a little dependency
- Clear is better than clever
- Errors are values
- Don't just check errors, handle them gracefully

## Contributing

When adding new skills:
1. Follow the existing structure and format
2. Include working code examples
3. Test all code snippets
4. Reference official Go documentation
5. Keep examples simple and focused

## Resources

- [Official Effective Go](https://go.dev/doc/effective_go)
- [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)
- [Go Proverbs](https://go-proverbs.github.io/)
- [Uber Go Style Guide](https://github.com/uber-go/guide)

## License

MIT License - Educational purposes
