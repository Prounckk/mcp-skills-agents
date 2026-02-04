# Formatting and Code Style

## Principle
All Go code should be formatted with `gofmt` to ensure consistency across the entire Go ecosystem. Naming conventions should be clear, concise, and follow Go idioms.

## Why it Matters
- Eliminates style debates within teams
- Makes code immediately recognizable as Go
- Improves readability and maintainability
- Enables better tooling support

## Code Formatting

### Using gofmt

```bash
# Format a single file
gofmt -w myfile.go

# Format all files in current directory
gofmt -w .

# Format recursively
gofmt -w ./...
```

### Editor Integration
Most editors can run `gofmt` on save:
- VSCode: Go extension with "format on save"
- Vim/Neovim: vim-go plugin
- Emacs: go-mode
- GoLand/IntelliJ: Built-in

## Naming Conventions

### Package Names

**Good:**
```go
package http
package filepath
package user
```

**Bad:**
```go
package HTTPServer  // Don't use mixed case
package file_path   // Don't use underscores
package utils       // Too generic
```

### Variables and Functions

**Good:**
```go
// Short names for local scope
var c Customer
var i int

// Descriptive names for package level
var GlobalConfig *Config
var DefaultTimeout = 30 * time.Second

// Receiver names (short and consistent)
func (c *Customer) GetName() string { ... }
func (c *Customer) SetName(name string) { ... }
```

**Bad:**
```go
// Too verbose for local scope
var customerFromDatabase Customer

// Inconsistent receiver names
func (c *Customer) GetName() string { ... }
func (cust *Customer) SetName(name string) { ... }
```

### Exported vs Unexported

```go
// Exported (public) - starts with uppercase
type Customer struct {
    Name string        // Exported field
    email string       // Unexported field
}

func NewCustomer() *Customer { ... }  // Exported function
func validateEmail() bool { ... }     // Unexported function
```

### Interface Names

**Good:**
```go
type Reader interface { ... }
type Writer interface { ... }
type ReadWriter interface { ... }
type Closer interface { ... }

// Single-method interfaces typically end in -er
type Stringer interface {
    String() string
}
```

### Constants

```go
// Use camelCase, not ALL_CAPS
const maxSize = 100
const defaultTimeout = 30 * time.Second

// Typed constants
const (
    StatusOK    = 200
    StatusError = 500
)

// Enumerated constants using iota
type Status int

const (
    StatusPending Status = iota  // 0
    StatusActive                 // 1
    StatusInactive              // 2
)
```

## Import Organization

**Good:**
```go
import (
    // Standard library
    "context"
    "fmt"
    "time"

    // Third-party packages
    "github.com/pkg/errors"
    "github.com/stretchr/testify/assert"

    // Local packages
    "github.com/mycompany/myapp/internal/config"
    "github.com/mycompany/myapp/pkg/logger"
)
```

**Bad:**
```go
import (
    // Mixed without organization
    "github.com/mycompany/myapp/internal/config"
    "fmt"
    "github.com/pkg/errors"
    "context"
)
```

## Comments

### Package Comments

```go
// Package user provides utilities for user management
// and authentication.
//
// Example usage:
//
//     u, err := user.New("john@example.com")
//     if err != nil {
//         return err
//     }
//
package user
```

### Function Comments

```go
// NewCustomer creates a new customer with the given email.
// It returns an error if the email is invalid.
func NewCustomer(email string) (*Customer, error) {
    if !isValidEmail(email) {
        return nil, errors.New("invalid email")
    }
    return &Customer{email: email}, nil
}
```

### Struct Comments

```go
// Customer represents a user of the system with
// contact information and preferences.
type Customer struct {
    // Name is the full name of the customer
    Name string
    
    // email is the customer's email address (unexported)
    email string
}
```

## Line Length and Wrapping

```go
// Good: Reasonable line length
func processOrder(customer *Customer, items []Item, discount float64) error {
    // Implementation
}

// Acceptable: Long signatures can be wrapped
func processComplexOrder(
    customer *Customer,
    items []Item,
    discount float64,
    promoCode string,
    deliveryDate time.Time,
) error {
    // Implementation
}
```

## Struct Initialization

**Good:**
```go
// Explicit field names
c := Customer{
    Name:  "John Doe",
    Email: "john@example.com",
    Age:   30,
}

// Inline for simple structs
point := Point{X: 10, Y: 20}
```

**Bad:**
```go
// Positional initialization (fragile to field reordering)
c := Customer{"John Doe", "john@example.com", 30}
```

## Best Practices Summary

1. **Always use gofmt** - No exceptions
2. **Keep names short and meaningful** - Especially in local scope
3. **Use MixedCaps, not underscores** - For multi-word names
4. **Document exported identifiers** - Every package, type, function
5. **Group related code** - Use blank lines to separate logical sections
6. **Organize imports** - Standard, third-party, local
7. **Be consistent** - Follow patterns established in the codebase

## Tools

- `gofmt` - Format code
- `goimports` - Format and organize imports
- `golint` - Check style
- `go vet` - Examine code for suspicious constructs

## Quick Check

Run these before committing:
```bash
gofmt -w .
goimports -w .
go vet ./...
```
