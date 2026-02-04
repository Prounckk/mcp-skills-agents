# Concurrency Patterns

## Principle
Don't communicate by sharing memory; share memory by communicating. Use goroutines for concurrency and channels for synchronization.

## Why it Matters
- Prevents race conditions
- Makes concurrent code easier to reason about
- Leverages Go's CSP-style concurrency model
- Enables efficient parallel processing

## Goroutines

### Basic Goroutine Usage

```go
package main

import (
    "fmt"
    "time"
)

// Good: Simple concurrent execution
func processData(id int) {
    fmt.Printf("Processing %d\n", id)
    time.Sleep(100 * time.Millisecond)
    fmt.Printf("Completed %d\n", id)
}

func main() {
    // Launch goroutines
    for i := 0; i < 5; i++ {
        go processData(i)
    }
    
    // Wait for goroutines (better: use sync.WaitGroup)
    time.Sleep(time.Second)
}
```

### Using WaitGroup

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func worker(id int, wg *sync.WaitGroup) {
    defer wg.Done()  // Decrement counter when done
    
    fmt.Printf("Worker %d starting\n", id)
    time.Sleep(time.Second)
    fmt.Printf("Worker %d done\n", id)
}

func main() {
    var wg sync.WaitGroup
    
    for i := 1; i <= 5; i++ {
        wg.Add(1)  // Increment counter
        go worker(i, &wg)
    }
    
    wg.Wait()  // Block until all goroutines complete
    fmt.Println("All workers completed")
}
```

## Channels

### Unbuffered Channels

```go
// Unbuffered channel - synchronous communication
func main() {
    ch := make(chan int)
    
    go func() {
        ch <- 42  // Send blocks until receive happens
    }()
    
    value := <-ch  // Receive blocks until send happens
    fmt.Println(value)
}
```

### Buffered Channels

```go
func main() {
    // Buffered channel - can hold values without receiver
    ch := make(chan int, 3)
    
    ch <- 1
    ch <- 2
    ch <- 3
    // ch <- 4  // Would block - buffer is full
    
    fmt.Println(<-ch)  // 1
    fmt.Println(<-ch)  // 2
    fmt.Println(<-ch)  // 3
}
```

### Channel Direction

```go
// Send-only channel
func producer(ch chan<- int) {
    for i := 0; i < 5; i++ {
        ch <- i
    }
    close(ch)
}

// Receive-only channel
func consumer(ch <-chan int) {
    for value := range ch {
        fmt.Println(value)
    }
}

func main() {
    ch := make(chan int)
    go producer(ch)
    consumer(ch)
}
```

## Select Statement

### Multiplexing Channels

```go
func main() {
    ch1 := make(chan string)
    ch2 := make(chan string)
    
    go func() {
        time.Sleep(1 * time.Second)
        ch1 <- "one"
    }()
    
    go func() {
        time.Sleep(2 * time.Second)
        ch2 <- "two"
    }()
    
    for i := 0; i < 2; i++ {
        select {
        case msg1 := <-ch1:
            fmt.Println("Received", msg1)
        case msg2 := <-ch2:
            fmt.Println("Received", msg2)
        }
    }
}
```

### Timeout Pattern

```go
func fetchWithTimeout(url string) (string, error) {
    result := make(chan string, 1)
    
    go func() {
        // Simulate slow operation
        time.Sleep(2 * time.Second)
        result <- "data from " + url
    }()
    
    select {
    case data := <-result:
        return data, nil
    case <-time.After(1 * time.Second):
        return "", fmt.Errorf("timeout fetching %s", url)
    }
}
```

### Non-blocking Operations

```go
func tryReceive(ch <-chan int) (int, bool) {
    select {
    case value := <-ch:
        return value, true
    default:
        return 0, false
    }
}

func trySend(ch chan<- int, value int) bool {
    select {
    case ch <- value:
        return true
    default:
        return false
    }
}
```

## Common Patterns

### Worker Pool

```go
func worker(id int, jobs <-chan int, results chan<- int) {
    for job := range jobs {
        fmt.Printf("Worker %d processing job %d\n", id, job)
        time.Sleep(time.Second)
        results <- job * 2
    }
}

func main() {
    const numJobs = 5
    const numWorkers = 3
    
    jobs := make(chan int, numJobs)
    results := make(chan int, numJobs)
    
    // Start workers
    for w := 1; w <= numWorkers; w++ {
        go worker(w, jobs, results)
    }
    
    // Send jobs
    for j := 1; j <= numJobs; j++ {
        jobs <- j
    }
    close(jobs)
    
    // Collect results
    for a := 1; a <= numJobs; a++ {
        <-results
    }
}
```

### Pipeline Pattern

```go
func generator(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        for _, n := range nums {
            out <- n
        }
        close(out)
    }()
    return out
}

func square(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            out <- n * n
        }
        close(out)
    }()
    return out
}

func main() {
    // Set up pipeline
    c := generator(2, 3, 4)
    out := square(c)
    
    // Consume output
    for result := range out {
        fmt.Println(result)
    }
}
```

### Fan-out, Fan-in

```go
func fanOut(input <-chan int, numWorkers int) []<-chan int {
    channels := make([]<-chan int, numWorkers)
    for i := 0; i < numWorkers; i++ {
        channels[i] = worker(input)
    }
    return channels
}

func fanIn(channels ...<-chan int) <-chan int {
    out := make(chan int)
    var wg sync.WaitGroup
    
    for _, ch := range channels {
        wg.Add(1)
        go func(c <-chan int) {
            defer wg.Done()
            for value := range c {
                out <- value
            }
        }(ch)
    }
    
    go func() {
        wg.Wait()
        close(out)
    }()
    
    return out
}
```

## Context for Cancellation

### Basic Context Usage

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func operation(ctx context.Context) error {
    // Check if cancelled before expensive operation
    select {
    case <-ctx.Done():
        return ctx.Err()
    default:
    }
    
    // Simulate work with cancellation support
    select {
    case <-time.After(2 * time.Second):
        fmt.Println("Operation completed")
        return nil
    case <-ctx.Done():
        return ctx.Err()
    }
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
    defer cancel()
    
    if err := operation(ctx); err != nil {
        fmt.Printf("Operation failed: %v\n", err)
    }
}
```

### Context with Values

```go
type contextKey string

const userIDKey contextKey = "userID"

func processRequest(ctx context.Context) {
    if userID, ok := ctx.Value(userIDKey).(string); ok {
        fmt.Printf("Processing request for user: %s\n", userID)
    }
}

func main() {
    ctx := context.WithValue(context.Background(), userIDKey, "user123")
    processRequest(ctx)
}
```

## Sync Primitives

### Mutex for Critical Sections

```go
type Counter struct {
    mu    sync.Mutex
    value int
}

func (c *Counter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.value++
}

func (c *Counter) Value() int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.value
}
```

### RWMutex for Read-Heavy Workloads

```go
type Cache struct {
    mu    sync.RWMutex
    items map[string]string
}

func (c *Cache) Get(key string) (string, bool) {
    c.mu.RLock()  // Multiple readers allowed
    defer c.mu.RUnlock()
    val, ok := c.items[key]
    return val, ok
}

func (c *Cache) Set(key, value string) {
    c.mu.Lock()  // Exclusive lock for writes
    defer c.mu.Unlock()
    c.items[key] = value
}
```

### Once for Initialization

```go
var (
    instance *Singleton
    once     sync.Once
)

type Singleton struct {
    data string
}

func GetInstance() *Singleton {
    once.Do(func() {
        instance = &Singleton{data: "initialized"}
    })
    return instance
}
```

## Best Practices

1. **Always close channels** - When the sender is done
2. **Use WaitGroup for goroutine synchronization** - Better than sleep
3. **Pass context as first parameter** - For cancellation support
4. **Avoid goroutine leaks** - Ensure all goroutines can exit
5. **Use buffered channels carefully** - Understand blocking behavior
6. **Prefer channels over shared memory** - Unless performance critical
7. **Use defer for cleanup** - Especially with mutexes
8. **Don't start goroutines without knowing how they'll stop**

## Common Anti-Patterns

```go
// DON'T: Goroutine leak
func leak() {
    ch := make(chan int)
    go func() {
        ch <- 42  // Will block forever if no receiver
    }()
}

// DO: Ensure goroutines can complete
func noLeak() {
    ch := make(chan int, 1)  // Buffered
    go func() {
        ch <- 42  // Won't block
    }()
}

// DON'T: Race condition
var counter int
func increment() {
    counter++  // Not safe for concurrent access
}

// DO: Use mutex or channels
var (
    counter int
    mu      sync.Mutex
)
func increment() {
    mu.Lock()
    defer mu.Unlock()
    counter++
}
```

## Testing Concurrent Code

```go
func TestConcurrentIncrement(t *testing.T) {
    c := &Counter{}
    var wg sync.WaitGroup
    
    // Launch 100 goroutines
    for i := 0; i < 100; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            c.Increment()
        }()
    }
    
    wg.Wait()
    
    if c.Value() != 100 {
        t.Errorf("Expected 100, got %d", c.Value())
    }
}
```

## Race Detection

```bash
# Run tests with race detector
go test -race ./...

# Run program with race detector
go run -race main.go
```
