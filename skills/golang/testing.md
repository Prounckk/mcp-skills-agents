# Testing Strategies

## Principle
Write comprehensive tests that are easy to understand, maintain, and run. Use table-driven tests for multiple scenarios and focus on behavior, not implementation.

## Why it Matters
- Catches bugs early
- Enables confident refactoring
- Documents expected behavior
- Improves code design

## Basic Test Structure

### Simple Test

```go
package math

import "testing"

func Add(a, b int) int {
    return a + b
}

func TestAdd(t *testing.T) {
    result := Add(2, 3)
    expected := 5
    
    if result != expected {
        t.Errorf("Add(2, 3) = %d; want %d", result, expected)
    }
}
```

### Table-Driven Tests

```go
func TestAdd(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"positive numbers", 2, 3, 5},
        {"negative numbers", -2, -3, -5},
        {"mixed signs", -2, 3, 1},
        {"zeros", 0, 0, 0},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := Add(tt.a, tt.b)
            if result != tt.expected {
                t.Errorf("Add(%d, %d) = %d; want %d", 
                    tt.a, tt.b, result, tt.expected)
            }
        })
    }
}
```

## Testing Error Handling

```go
func Divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("division by zero")
    }
    return a / b, nil
}

func TestDivide(t *testing.T) {
    tests := []struct {
        name      string
        a, b      float64
        want      float64
        wantErr   bool
        errMsg    string
    }{
        {"normal division", 6, 2, 3, false, ""},
        {"division by zero", 5, 0, 0, true, "division by zero"},
        {"negative result", 6, -2, -3, false, ""},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := Divide(tt.a, tt.b)
            
            if tt.wantErr {
                if err == nil {
                    t.Error("expected error, got nil")
                    return
                }
                if err.Error() != tt.errMsg {
                    t.Errorf("error = %v, want %v", err.Error(), tt.errMsg)
                }
                return
            }
            
            if err != nil {
                t.Errorf("unexpected error: %v", err)
                return
            }
            
            if got != tt.want {
                t.Errorf("got %v, want %v", got, tt.want)
            }
        })
    }
}
```

## Testing with Helpers

```go
func TestUserOperations(t *testing.T) {
    // Helper function
    assertEqual := func(t *testing.T, got, want interface{}) {
        t.Helper()  // Marks this as a helper function
        if got != want {
            t.Errorf("got %v, want %v", got, want)
        }
    }
    
    user := NewUser("John")
    assertEqual(t, user.Name, "John")
    assertEqual(t, user.Active, true)
}
```

## Subtests

```go
func TestUser(t *testing.T) {
    user := NewUser("John")
    
    t.Run("name", func(t *testing.T) {
        if user.Name != "John" {
            t.Errorf("expected John, got %s", user.Name)
        }
    })
    
    t.Run("email validation", func(t *testing.T) {
        tests := []struct {
            email string
            valid bool
        }{
            {"test@example.com", true},
            {"invalid", false},
            {"", false},
        }
        
        for _, tt := range tests {
            err := user.SetEmail(tt.email)
            if (err == nil) != tt.valid {
                t.Errorf("SetEmail(%s) error = %v, want valid=%v", 
                    tt.email, err, tt.valid)
            }
        }
    })
}
```

## Mocking and Interfaces

```go
// Interface for dependency
type EmailSender interface {
    Send(to, subject, body string) error
}

// Mock implementation
type MockEmailSender struct {
    SendFunc   func(to, subject, body string) error
    CallCount  int
    LastEmail  string
}

func (m *MockEmailSender) Send(to, subject, body string) error {
    m.CallCount++
    m.LastEmail = to
    if m.SendFunc != nil {
        return m.SendFunc(to, subject, body)
    }
    return nil
}

// Service under test
type UserService struct {
    emailSender EmailSender
}

func (s *UserService) RegisterUser(email string) error {
    return s.emailSender.Send(email, "Welcome", "Welcome!")
}

// Test
func TestRegisterUser(t *testing.T) {
    mock := &MockEmailSender{}
    service := &UserService{emailSender: mock}
    
    err := service.RegisterUser("test@example.com")
    if err != nil {
        t.Errorf("unexpected error: %v", err)
    }
    
    if mock.CallCount != 1 {
        t.Errorf("expected 1 call, got %d", mock.CallCount)
    }
    
    if mock.LastEmail != "test@example.com" {
        t.Errorf("expected test@example.com, got %s", mock.LastEmail)
    }
}
```

## Test Fixtures

```go
func TestWithTempFile(t *testing.T) {
    // Setup
    tmpfile, err := os.CreateTemp("", "test")
    if err != nil {
        t.Fatal(err)
    }
    defer os.Remove(tmpfile.Name())  // Cleanup
    
    // Write test data
    content := []byte("test content")
    if _, err := tmpfile.Write(content); err != nil {
        t.Fatal(err)
    }
    tmpfile.Close()
    
    // Test
    data, err := os.ReadFile(tmpfile.Name())
    if err != nil {
        t.Fatal(err)
    }
    
    if string(data) != "test content" {
        t.Errorf("got %s, want 'test content'", data)
    }
}
```

## Benchmarks

```go
func BenchmarkAdd(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Add(2, 3)
    }
}

func BenchmarkAddParallel(b *testing.B) {
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            Add(2, 3)
        }
    })
}

// Table-driven benchmarks
func BenchmarkFibonacci(b *testing.B) {
    tests := []struct {
        name string
        n    int
    }{
        {"small", 10},
        {"medium", 20},
        {"large", 30},
    }
    
    for _, tt := range tests {
        b.Run(tt.name, func(b *testing.B) {
            for i := 0; i < b.N; i++ {
                Fibonacci(tt.n)
            }
        })
    }
}
```

## Testing HTTP Handlers

```go
func HelloHandler(w http.ResponseWriter, r *http.Request) {
    name := r.URL.Query().Get("name")
    if name == "" {
        name = "World"
    }
    fmt.Fprintf(w, "Hello, %s!", name)
}

func TestHelloHandler(t *testing.T) {
    tests := []struct {
        name       string
        queryParam string
        want       string
    }{
        {"with name", "name=John", "Hello, John!"},
        {"without name", "", "Hello, World!"},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            req := httptest.NewRequest("GET", "/hello?"+tt.queryParam, nil)
            w := httptest.NewRecorder()
            
            HelloHandler(w, req)
            
            if w.Body.String() != tt.want {
                t.Errorf("got %s, want %s", w.Body.String(), tt.want)
            }
        })
    }
}
```

## Test Coverage

```bash
# Run tests with coverage
go test -cover

# Generate coverage report
go test -coverprofile=coverage.out
go tool cover -html=coverage.out

# Check coverage for specific package
go test -cover ./pkg/user

# Require minimum coverage
go test -cover -covermode=count -coverprofile=coverage.out
go tool cover -func=coverage.out | grep total
```

## Example Tests

```go
func ExampleAdd() {
    result := Add(2, 3)
    fmt.Println(result)
    // Output: 5
}

func ExampleUser_SetEmail() {
    user := NewUser("John")
    err := user.SetEmail("john@example.com")
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Println("Email set successfully")
    // Output: Email set successfully
}
```

## Test Organization

```
mypackage/
├── user.go
├── user_test.go
├── handler.go
├── handler_test.go
└── testdata/
    ├── users.json
    └── config.yml
```

## Best Practices

1. **Use table-driven tests** - Test multiple scenarios efficiently
2. **Name tests descriptively** - Clear test names document behavior
3. **Test behavior, not implementation** - Focus on inputs/outputs
4. **Keep tests independent** - Each test should be self-contained
5. **Use t.Helper()** - Mark helper functions properly
6. **Don't use init()** - Makes tests harder to understand
7. **Use testdata directory** - For test fixtures and data files
8. **Test error cases** - Error paths are important
9. **Run tests in parallel** - Use t.Parallel() when possible
10. **Keep tests fast** - Fast tests encourage frequent running

## Common Patterns

```go
// Setup and teardown
func TestMain(m *testing.M) {
    // Setup
    setup()
    
    // Run tests
    code := m.Run()
    
    // Teardown
    teardown()
    
    os.Exit(code)
}

// Skip tests conditionally
func TestFeature(t *testing.T) {
    if testing.Short() {
        t.Skip("skipping test in short mode")
    }
    // Long-running test
}

// Parallel tests
func TestParallel(t *testing.T) {
    t.Parallel()  // Run in parallel with other parallel tests
    // Test code
}

// Cleanup
func TestWithCleanup(t *testing.T) {
    resource := allocateResource()
    t.Cleanup(func() {
        resource.Close()
    })
    
    // Test code using resource
}
```

## Running Tests

```bash
# Run all tests
go test ./...

# Run specific test
go test -run TestAdd

# Run tests with verbose output
go test -v

# Run tests in short mode (skip long tests)
go test -short

# Run tests multiple times
go test -count=10

# Run with race detector
go test -race

# Run benchmarks
go test -bench=.

# Run specific benchmark
go test -bench=BenchmarkAdd

# Profile CPU usage
go test -cpuprofile=cpu.prof -bench=.
go tool pprof cpu.prof
```
