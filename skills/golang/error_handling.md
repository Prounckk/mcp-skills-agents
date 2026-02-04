# Error Handling

## Principle
Errors should be handled explicitly, never ignored. Use error wrapping to add context, and return early to reduce nesting.

## Why it Matters
- Makes error paths visible and explicit
- Preserves error context for debugging
- Prevents silent failures
- Improves code readability

## Explicit Error Checking

### Good Example

```go
func ReadUserData(filename string) (*User, error) {
    data, err := os.ReadFile(filename)
    if err != nil {
        return nil, fmt.Errorf("failed to read user data: %w", err)
    }

    var user User
    if err := json.Unmarshal(data, &user); err != nil {
        return nil, fmt.Errorf("failed to parse user data: %w", err)
    }

    return &user, nil
}
```

### Bad Example

```go
func ReadUserData(filename string) *User {
    data, _ := os.ReadFile(filename)  // NEVER ignore errors!
    
    var user User
    json.Unmarshal(data, &user)  // Error ignored
    
    return &user
}
```

## Error Wrapping

### Using %w for Error Chains

```go
package main

import (
    "errors"
    "fmt"
    "os"
)

func processFile(path string) error {
    f, err := os.Open(path)
    if err != nil {
        // Wrap the error with context
        return fmt.Errorf("process file %s: %w", path, err)
    }
    defer f.Close()
    
    // Process file...
    return nil
}

func main() {
    err := processFile("/tmp/data.txt")
    if err != nil {
        // Can check for specific errors even when wrapped
        if errors.Is(err, os.ErrNotExist) {
            fmt.Println("File does not exist")
        }
        fmt.Printf("Error: %v\n", err)
    }
}
```

### Error Unwrapping

```go
func handleError(err error) {
    // errors.Is checks the error chain
    if errors.Is(err, os.ErrNotExist) {
        fmt.Println("File not found")
        return
    }

    // errors.As extracts specific error types
    var pathError *os.PathError
    if errors.As(err, &pathError) {
        fmt.Printf("Path operation failed: %s\n", pathError.Path)
        return
    }
}
```

## Custom Error Types

### Defining Custom Errors

```go
// Sentinel errors (global variables)
var (
    ErrNotFound     = errors.New("not found")
    ErrUnauthorized = errors.New("unauthorized")
    ErrInvalidInput = errors.New("invalid input")
)

// Custom error type with additional context
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation failed for %s: %s", e.Field, e.Message)
}

// Usage
func ValidateEmail(email string) error {
    if !strings.Contains(email, "@") {
        return &ValidationError{
            Field:   "email",
            Message: "must contain @ symbol",
        }
    }
    return nil
}
```

### Using Custom Errors

```go
func processUser(email string) error {
    if err := ValidateEmail(email); err != nil {
        var valErr *ValidationError
        if errors.As(err, &valErr) {
            fmt.Printf("Invalid field: %s\n", valErr.Field)
        }
        return fmt.Errorf("user processing failed: %w", err)
    }
    return nil
}
```

## Early Returns

### Good: Guard Clauses

```go
func ProcessOrder(order *Order) error {
    if order == nil {
        return errors.New("order is nil")
    }

    if order.Total <= 0 {
        return errors.New("order total must be positive")
    }

    if len(order.Items) == 0 {
        return errors.New("order must have items")
    }

    // Happy path with minimal nesting
    if err := validateItems(order.Items); err != nil {
        return fmt.Errorf("invalid items: %w", err)
    }

    if err := processPayment(order); err != nil {
        return fmt.Errorf("payment failed: %w", err)
    }

    return nil
}
```

### Bad: Deep Nesting

```go
func ProcessOrder(order *Order) error {
    if order != nil {
        if order.Total > 0 {
            if len(order.Items) > 0 {
                err := validateItems(order.Items)
                if err == nil {
                    err = processPayment(order)
                    if err == nil {
                        return nil
                    } else {
                        return err
                    }
                } else {
                    return err
                }
            }
        }
    }
    return errors.New("invalid order")
}
```

## Error Handling Patterns

### Multiple Error Returns

```go
// Good: Clear error handling
func FetchUser(id int) (*User, error) {
    user, err := db.Query(id)
    if err != nil {
        return nil, fmt.Errorf("database query failed: %w", err)
    }
    return user, nil
}

// Usage
user, err := FetchUser(123)
if err != nil {
    log.Printf("Failed to fetch user: %v", err)
    return err
}
// Use user safely
```

### Defer for Cleanup

```go
func ProcessFile(path string) error {
    f, err := os.Open(path)
    if err != nil {
        return fmt.Errorf("open file: %w", err)
    }
    defer f.Close()  // Ensures cleanup even if error occurs

    // Process file
    data := make([]byte, 1024)
    n, err := f.Read(data)
    if err != nil && err != io.EOF {
        return fmt.Errorf("read file: %w", err)
    }

    // Process data...
    _ = n
    return nil
}
```

### Error Aggregation

```go
type MultiError struct {
    Errors []error
}

func (m *MultiError) Error() string {
    var msgs []string
    for _, err := range m.Errors {
        msgs = append(msgs, err.Error())
    }
    return strings.Join(msgs, "; ")
}

func (m *MultiError) Add(err error) {
    if err != nil {
        m.Errors = append(m.Errors, err)
    }
}

func (m *MultiError) ErrorOrNil() error {
    if len(m.Errors) == 0 {
        return nil
    }
    return m
}

// Usage
func ValidateOrder(order *Order) error {
    var errs MultiError
    
    if order.Total <= 0 {
        errs.Add(errors.New("invalid total"))
    }
    
    if len(order.Items) == 0 {
        errs.Add(errors.New("no items"))
    }
    
    return errs.ErrorOrNil()
}
```

## Panic vs Error

### When to Use Panic

```go
// Panic for truly unrecoverable conditions
func MustLoadConfig() *Config {
    cfg, err := LoadConfig()
    if err != nil {
        // Panic during initialization if config is essential
        panic(fmt.Sprintf("failed to load config: %v", err))
    }
    return cfg
}

// Better: Return error and let caller decide
func LoadConfig() (*Config, error) {
    // Implementation
    return nil, errors.New("not implemented")
}
```

### Recovering from Panic

```go
func SafeHandler(w http.ResponseWriter, r *http.Request) {
    defer func() {
        if err := recover(); err != nil {
            log.Printf("Handler panic: %v", err)
            http.Error(w, "Internal Server Error", 500)
        }
    }()
    
    // Handler code that might panic
    riskyOperation()
}
```

## Best Practices

1. **Never ignore errors** - Always check `err != nil`
2. **Add context when wrapping** - Use `%w` with descriptive message
3. **Return early** - Handle errors immediately, reduce nesting
4. **Use custom error types** - For errors that need additional data
5. **Use sentinel errors sparingly** - For well-known error conditions
6. **Don't panic** - Use errors for expected failure modes
7. **Check error types** - Use `errors.Is` and `errors.As`
8. **Log at boundaries** - Log errors where they're handled, not everywhere

## Common Anti-Patterns to Avoid

```go
// DON'T: Ignore errors
_ = file.Close()

// DO: At least log the error
if err := file.Close(); err != nil {
    log.Printf("Failed to close file: %v", err)
}

// DON'T: Generic error messages
return errors.New("error")

// DO: Descriptive error messages
return fmt.Errorf("failed to parse config file %s: invalid JSON", filename)

// DON'T: Panic for regular errors
if err != nil {
    panic(err)
}

// DO: Return the error
if err != nil {
    return fmt.Errorf("operation failed: %w", err)
}
```

## Testing Error Handling

```go
func TestReadUserData(t *testing.T) {
    tests := []struct {
        name    string
        file    string
        wantErr bool
        errType error
    }{
        {
            name:    "file not found",
            file:    "nonexistent.json",
            wantErr: true,
            errType: os.ErrNotExist,
        },
        {
            name:    "valid file",
            file:    "testdata/user.json",
            wantErr: false,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            _, err := ReadUserData(tt.file)
            if tt.wantErr {
                if err == nil {
                    t.Error("expected error, got nil")
                }
                if tt.errType != nil && !errors.Is(err, tt.errType) {
                    t.Errorf("wrong error type: got %v, want %v", err, tt.errType)
                }
            } else if err != nil {
                t.Errorf("unexpected error: %v", err)
            }
        })
    }
}
```
