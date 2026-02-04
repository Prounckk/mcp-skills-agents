# Context Usage

## Principle
Use context.Context as the first parameter in functions that perform I/O, have cancellation needs, or set deadlines. Pass context explicitly through the call stack.

## Why it Matters
- Enables request cancellation across API boundaries
- Prevents resource leaks from abandoned operations
- Propagates deadlines and timeouts
- Carries request-scoped values safely

## Context Basics

### Creating Contexts

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func main() {
    // Background context - top level, never cancelled
    ctx := context.Background()
    
    // TODO context - placeholder when context is unclear
    todoCtx := context.TODO()
    
    _, _ = ctx, todoCtx
}
```

### Context with Cancellation

```go
func main() {
    // Create cancellable context
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()  // Always call cancel to prevent leaks
    
    go doWork(ctx)
    
    // Cancel after some time
    time.Sleep(2 * time.Second)
    cancel()  // This signals doWork to stop
    
    time.Sleep(100 * time.Millisecond)
}

func doWork(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():
            fmt.Println("Work cancelled:", ctx.Err())
            return
        default:
            fmt.Println("Working...")
            time.Sleep(500 * time.Millisecond)
        }
    }
}
```

### Context with Timeout

```go
func fetchData(ctx context.Context, url string) (string, error) {
    // Operation will be cancelled after timeout
    ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
    defer cancel()
    
    // Simulate slow operation
    result := make(chan string, 1)
    go func() {
        time.Sleep(3 * time.Second)
        result <- "data from " + url
    }()
    
    select {
    case data := <-result:
        return data, nil
    case <-ctx.Done():
        return "", ctx.Err()  // context.DeadlineExceeded
    }
}

func main() {
    ctx := context.Background()
    data, err := fetchData(ctx, "https://api.example.com")
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Println("Data:", data)
}
```

### Context with Deadline

```go
func processWithDeadline() error {
    // Set absolute deadline
    deadline := time.Now().Add(5 * time.Second)
    ctx, cancel := context.WithDeadline(context.Background(), deadline)
    defer cancel()
    
    return performOperation(ctx)
}

func performOperation(ctx context.Context) error {
    // Check deadline
    if deadline, ok := ctx.Deadline(); ok {
        fmt.Printf("Deadline: %v\n", deadline)
        fmt.Printf("Time until deadline: %v\n", time.Until(deadline))
    }
    
    // Perform work with deadline awareness
    select {
    case <-time.After(2 * time.Second):
        return nil
    case <-ctx.Done():
        return ctx.Err()
    }
}
```

## Context Values

### Storing and Retrieving Values

```go
type contextKey string

const (
    requestIDKey contextKey = "requestID"
    userIDKey    contextKey = "userID"
)

// Store value in context
func withRequestID(ctx context.Context, id string) context.Context {
    return context.WithValue(ctx, requestIDKey, id)
}

// Retrieve value from context
func getRequestID(ctx context.Context) string {
    if id, ok := ctx.Value(requestIDKey).(string); ok {
        return id
    }
    return ""
}

// Usage
func handleRequest(ctx context.Context) {
    // Add request ID
    ctx = withRequestID(ctx, "req-123")
    
    // Pass through call chain
    processRequest(ctx)
}

func processRequest(ctx context.Context) {
    // Retrieve request ID
    reqID := getRequestID(ctx)
    fmt.Printf("Processing request: %s\n", reqID)
}
```

### Best Practices for Context Values

```go
// Good: Use private type for keys
type contextKey int

const (
    userKey contextKey = iota
    orgKey
)

// Good: Provide typed accessors
func WithUser(ctx context.Context, user *User) context.Context {
    return context.WithValue(ctx, userKey, user)
}

func GetUser(ctx context.Context) (*User, bool) {
    user, ok := ctx.Value(userKey).(*User)
    return user, ok
}

// Bad: Use string keys (can collide)
func badWithUser(ctx context.Context, user *User) context.Context {
    return context.WithValue(ctx, "user", user)
}
```

## HTTP Server Example

```go
package main

import (
    "context"
    "fmt"
    "log"
    "net/http"
    "time"
)

type contextKey string

const requestIDKey contextKey = "requestID"

// Middleware to add request ID
func requestIDMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        requestID := generateRequestID()
        ctx := context.WithValue(r.Context(), requestIDKey, requestID)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// Handler using context
func handler(w http.ResponseWriter, r *http.Request) {
    // Get request ID from context
    requestID, _ := r.Context().Value(requestIDKey).(string)
    
    // Pass context to downstream operations
    data, err := fetchFromDatabase(r.Context(), "users")
    if err != nil {
        log.Printf("[%s] Error: %v", requestID, err)
        http.Error(w, "Internal Server Error", 500)
        return
    }
    
    fmt.Fprintf(w, "Request ID: %s\nData: %s", requestID, data)
}

func fetchFromDatabase(ctx context.Context, table string) (string, error) {
    // Respect context cancellation
    select {
    case <-time.After(100 * time.Millisecond):
        return "database result", nil
    case <-ctx.Done():
        return "", ctx.Err()
    }
}

func generateRequestID() string {
    return fmt.Sprintf("req-%d", time.Now().UnixNano())
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/", handler)
    
    // Wrap with middleware
    http.ListenAndServe(":8080", requestIDMiddleware(mux))
}
```

## Database Operations

```go
package main

import (
    "context"
    "database/sql"
    "fmt"
    "time"
)

type User struct {
    ID   int
    Name string
}

type UserStore struct {
    db *sql.DB
}

// Context-aware database query
func (s *UserStore) GetUser(ctx context.Context, id int) (*User, error) {
    // Use context in query - cancellation will abort the query
    row := s.db.QueryRowContext(ctx, "SELECT id, name FROM users WHERE id = ?", id)
    
    var user User
    err := row.Scan(&user.ID, &user.Name)
    if err != nil {
        return nil, fmt.Errorf("scan user: %w", err)
    }
    
    return &user, nil
}

// Transaction with context
func (s *UserStore) CreateUser(ctx context.Context, name string) error {
    tx, err := s.db.BeginTx(ctx, nil)
    if err != nil {
        return err
    }
    defer tx.Rollback()
    
    _, err = tx.ExecContext(ctx, "INSERT INTO users (name) VALUES (?)", name)
    if err != nil {
        return err
    }
    
    return tx.Commit()
}

// Usage with timeout
func main() {
    store := &UserStore{db: nil} // assume db is initialized
    
    // Set timeout for operation
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    user, err := store.GetUser(ctx, 1)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Printf("User: %+v\n", user)
}
```

## Worker Pool with Context

```go
func worker(ctx context.Context, id int, jobs <-chan int, results chan<- int) {
    for {
        select {
        case <-ctx.Done():
            fmt.Printf("Worker %d stopping: %v\n", id, ctx.Err())
            return
        case job, ok := <-jobs:
            if !ok {
                return
            }
            fmt.Printf("Worker %d processing job %d\n", id, job)
            select {
            case results <- job * 2:
            case <-ctx.Done():
                return
            }
        }
    }
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
    defer cancel()
    
    jobs := make(chan int, 10)
    results := make(chan int, 10)
    
    // Start workers
    for w := 1; w <= 3; w++ {
        go worker(ctx, w, jobs, results)
    }
    
    // Send jobs
    go func() {
        for j := 1; j <= 9; j++ {
            jobs <- j
        }
        close(jobs)
    }()
    
    // Collect results
    for i := 1; i <= 9; i++ {
        select {
        case result := <-results:
            fmt.Println("Result:", result)
        case <-ctx.Done():
            fmt.Println("Timeout reached")
            return
        }
    }
}
```

## Graceful Shutdown

```go
func main() {
    server := &http.Server{Addr: ":8080"}
    
    // Handle shutdown signal
    go func() {
        sigint := make(chan os.Signal, 1)
        signal.Notify(sigint, os.Interrupt, syscall.SIGTERM)
        <-sigint
        
        // Graceful shutdown with timeout
        ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
        defer cancel()
        
        fmt.Println("Shutting down server...")
        if err := server.Shutdown(ctx); err != nil {
            log.Printf("Server shutdown error: %v", err)
        }
    }()
    
    fmt.Println("Server starting on :8080")
    if err := server.ListenAndServe(); err != http.ErrServerClosed {
        log.Fatal(err)
    }
}
```

## Best Practices

1. **Pass context as first parameter** - Standard convention
   ```go
   func DoWork(ctx context.Context, arg string) error
   ```

2. **Don't store context in structs** - Pass explicitly
   ```go
   // Bad
   type Worker struct {
       ctx context.Context
   }
   
   // Good
   type Worker struct {}
   func (w *Worker) Process(ctx context.Context, data string) error
   ```

3. **Always call cancel** - Prevent resource leaks
   ```go
   ctx, cancel := context.WithTimeout(parent, timeout)
   defer cancel()
   ```

4. **Check context cancellation** - Respond to cancellation
   ```go
   select {
   case <-ctx.Done():
       return ctx.Err()
   default:
       // Continue processing
   }
   ```

5. **Use context values sparingly** - Only for request-scoped data
   - Request IDs
   - Auth tokens
   - User information
   - NOT for optional parameters

6. **Create context hierarchy** - Contexts form a tree
   ```go
   parent := context.Background()
   child, cancel := context.WithTimeout(parent, 1*time.Second)
   defer cancel()
   ```

## Common Patterns

### Retry with Context

```go
func retryWithContext(ctx context.Context, attempts int, fn func() error) error {
    for i := 0; i < attempts; i++ {
        select {
        case <-ctx.Done():
            return ctx.Err()
        default:
        }
        
        if err := fn(); err == nil {
            return nil
        }
        
        // Exponential backoff
        backoff := time.Duration(1<<uint(i)) * time.Second
        select {
        case <-time.After(backoff):
        case <-ctx.Done():
            return ctx.Err()
        }
    }
    return fmt.Errorf("failed after %d attempts", attempts)
}
```

### Fan-out with Context

```go
func fanOut(ctx context.Context, input <-chan int) []<-chan int {
    outputs := make([]<-chan int, 3)
    
    for i := range outputs {
        out := make(chan int)
        outputs[i] = out
        
        go func(ch chan int) {
            defer close(ch)
            for {
                select {
                case <-ctx.Done():
                    return
                case val, ok := <-input:
                    if !ok {
                        return
                    }
                    select {
                    case ch <- val:
                    case <-ctx.Done():
                        return
                    }
                }
            }
        }(out)
    }
    
    return outputs
}
```

## Testing with Context

```go
func TestWithTimeout(t *testing.T) {
    ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
    defer cancel()
    
    err := slowOperation(ctx)
    if err != context.DeadlineExceeded {
        t.Errorf("expected DeadlineExceeded, got %v", err)
    }
}

func TestWithCancellation(t *testing.T) {
    ctx, cancel := context.WithCancel(context.Background())
    
    done := make(chan bool)
    go func() {
        err := operation(ctx)
        if err != context.Canceled {
            t.Errorf("expected Canceled, got %v", err)
        }
        done <- true
    }()
    
    time.Sleep(10 * time.Millisecond)
    cancel()
    <-done
}
```
