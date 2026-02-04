# Interface Design

## Principle
Keep interfaces small and focused. The bigger the interface, the weaker the abstraction. Design interfaces at the point of use, not implementation.

## Why it Matters
- Small interfaces are easier to implement and test
- Promotes composition over inheritance
- Enables better decoupling
- Makes code more flexible and maintainable

## Interface Basics

### Simple Interface Definition

```go
// Single-method interface (idiomatic)
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

// Composed interface
type ReadWriter interface {
    Reader
    Writer
}
```

### Implementing Interfaces

```go
// Implicit interface implementation
type File struct {
    name string
}

// File implements Reader by having a Read method
func (f *File) Read(p []byte) (n int, err error) {
    // Implementation
    return 0, nil
}

// No explicit declaration needed!
var _ Reader = (*File)(nil)  // Compile-time check
```

## Interface Design Patterns

### Accept Interfaces, Return Structs

**Good:**
```go
// Accept interface - flexible
func ProcessData(r io.Reader) error {
    data, err := io.ReadAll(r)
    if err != nil {
        return err
    }
    // Process data
    _ = data
    return nil
}

// Return concrete type - clear
func NewFile(name string) *File {
    return &File{name: name}
}

// Usage is flexible
func main() {
    // Can pass any Reader implementation
    file, _ := os.Open("data.txt")
    ProcessData(file)
    
    data := []byte("test data")
    ProcessData(bytes.NewReader(data))
}
```

**Bad:**
```go
// Returning interface is often unnecessary
func NewFile(name string) Reader {
    return &File{name: name}
}
```

### Small, Focused Interfaces

**Good:**
```go
// Each interface has a single responsibility
type Validator interface {
    Validate() error
}

type Saver interface {
    Save() error
}

type Deleter interface {
    Delete() error
}

// Compose when needed
type Repository interface {
    Validator
    Saver
    Deleter
}
```

**Bad:**
```go
// Too many responsibilities
type Repository interface {
    Validate() error
    Save() error
    Delete() error
    Find(id int) (interface{}, error)
    List() ([]interface{}, error)
    Update(interface{}) error
    // ... many more methods
}
```

## Interface Segregation

### Good: Interface per Need

```go
package storage

// Define interfaces where they're used
type UserReader interface {
    GetUser(id int) (*User, error)
}

type UserWriter interface {
    SaveUser(user *User) error
}

// Service only needs to read
type NotificationService struct {
    users UserReader  // Only depends on what it needs
}

// Service needs both read and write
type UserService struct {
    users interface {
        UserReader
        UserWriter
    }
}
```

### Implementation Flexibility

```go
// One implementation can satisfy multiple interfaces
type Database struct{}

func (db *Database) GetUser(id int) (*User, error) {
    return &User{}, nil
}

func (db *Database) SaveUser(user *User) error {
    return nil
}

func main() {
    db := &Database{}
    
    // db satisfies both interfaces
    notifySvc := NotificationService{users: db}
    userSvc := UserService{users: db}
    
    _, _ = notifySvc, userSvc
}
```

## Empty Interface

### Use Cases for interface{}

```go
// Containers and generic data structures
type Cache struct {
    items map[string]interface{}
}

func (c *Cache) Set(key string, value interface{}) {
    c.items[key] = value
}

func (c *Cache) Get(key string) (interface{}, bool) {
    value, ok := c.items[key]
    return value, ok
}
```

### Type Assertions

```go
func processValue(v interface{}) {
    // Type assertion
    if str, ok := v.(string); ok {
        fmt.Printf("String: %s\n", str)
        return
    }
    
    // Type switch
    switch val := v.(type) {
    case int:
        fmt.Printf("Integer: %d\n", val)
    case string:
        fmt.Printf("String: %s\n", val)
    case bool:
        fmt.Printf("Boolean: %t\n", val)
    default:
        fmt.Printf("Unknown type: %T\n", val)
    }
}
```

### Better: Use Type Parameters (Go 1.18+)

```go
// Generic cache with type safety
type Cache[T any] struct {
    items map[string]T
}

func (c *Cache[T]) Set(key string, value T) {
    c.items[key] = value
}

func (c *Cache[T]) Get(key string) (T, bool) {
    value, ok := c.items[key]
    return value, ok
}

// Usage
cache := Cache[string]{items: make(map[string]string)}
cache.Set("key", "value")
value, _ := cache.Get("key")  // value is string, not interface{}
```

## Common Interface Patterns

### Strategy Pattern

```go
type Sorter interface {
    Sort(data []int) []int
}

type BubbleSort struct{}
func (b BubbleSort) Sort(data []int) []int {
    // Bubble sort implementation
    return data
}

type QuickSort struct{}
func (q QuickSort) Sort(data []int) []int {
    // Quick sort implementation
    return data
}

type DataProcessor struct {
    sorter Sorter
}

func (d *DataProcessor) Process(data []int) []int {
    return d.sorter.Sort(data)
}

// Usage
processor := DataProcessor{sorter: QuickSort{}}
```

### Decorator Pattern

```go
type Handler interface {
    Handle(data string) string
}

type BaseHandler struct{}
func (h BaseHandler) Handle(data string) string {
    return data
}

type LoggingHandler struct {
    next Handler
}

func (h LoggingHandler) Handle(data string) string {
    fmt.Printf("Handling: %s\n", data)
    result := h.next.Handle(data)
    fmt.Printf("Result: %s\n", result)
    return result
}

// Chain handlers
handler := LoggingHandler{next: BaseHandler{}}
```

### Adapter Pattern

```go
// Third-party interface we can't modify
type LegacyPrinter interface {
    PrintString(s string)
}

// Our new interface
type Printer interface {
    Print(data []byte) error
}

// Adapter
type PrinterAdapter struct {
    legacy LegacyPrinter
}

func (a *PrinterAdapter) Print(data []byte) error {
    a.legacy.PrintString(string(data))
    return nil
}
```

## Interface Composition

### Building Complex Interfaces

```go
// Basic interfaces
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

type Closer interface {
    Close() error
}

// Composed interfaces
type ReadWriter interface {
    Reader
    Writer
}

type ReadCloser interface {
    Reader
    Closer
}

type WriteCloser interface {
    Writer
    Closer
}

type ReadWriteCloser interface {
    Reader
    Writer
    Closer
}
```

### Standard Library Examples

```go
// io.Reader - most important interface in Go
func ReadUserData(r io.Reader) error {
    data, err := io.ReadAll(r)
    if err != nil {
        return err
    }
    // Process data
    _ = data
    return nil
}

// Works with files, network connections, strings, bytes...
file, _ := os.Open("data.txt")
ReadUserData(file)

str := strings.NewReader("data")
ReadUserData(str)

buf := bytes.NewBuffer([]byte("data"))
ReadUserData(buf)
```

## Testing with Interfaces

### Mock Implementation

```go
// Interface for production code
type UserStore interface {
    GetUser(id int) (*User, error)
    SaveUser(user *User) error
}

// Mock for testing
type MockUserStore struct {
    GetUserFunc  func(id int) (*User, error)
    SaveUserFunc func(user *User) error
}

func (m *MockUserStore) GetUser(id int) (*User, error) {
    if m.GetUserFunc != nil {
        return m.GetUserFunc(id)
    }
    return &User{}, nil
}

func (m *MockUserStore) SaveUser(user *User) error {
    if m.SaveUserFunc != nil {
        return m.SaveUserFunc(user)
    }
    return nil
}

// Test
func TestUserService(t *testing.T) {
    mock := &MockUserStore{
        GetUserFunc: func(id int) (*User, error) {
            return &User{ID: id, Name: "Test"}, nil
        },
    }
    
    service := NewUserService(mock)
    user, err := service.GetUser(1)
    
    if err != nil {
        t.Errorf("unexpected error: %v", err)
    }
    if user.Name != "Test" {
        t.Errorf("expected name Test, got %s", user.Name)
    }
}
```

## Interface Best Practices

1. **Design interfaces at usage point** - Not at implementation
2. **Keep interfaces small** - One or few methods
3. **Accept interfaces, return structs** - Maximize flexibility
4. **Don't force interfaces** - Not everything needs an interface
5. **Use standard library interfaces** - io.Reader, io.Writer, etc.
6. **Avoid interface pollution** - Don't create interfaces "just in case"
7. **Name single-method interfaces with -er** - Reader, Writer, Closer

## Common Anti-Patterns

```go
// DON'T: Unnecessary interface
type UserInterface interface {
    GetName() string
    SetName(string)
}

type User struct {
    Name string
}

func (u *User) GetName() string { return u.Name }
func (u *User) SetName(n string) { u.Name = n }

// If there's only one implementation, you probably don't need an interface

// DON'T: Interface with too many methods
type Everything interface {
    Method1()
    Method2()
    Method3()
    Method4()
    Method5()
    // ... many more
}

// DO: Split into smaller, focused interfaces

// DON'T: Returning interface when not needed
func NewUser() UserInterface {
    return &User{}
}

// DO: Return concrete type
func NewUser() *User {
    return &User{}
}
```

## Interface Guidelines

```go
// Good interface naming
type Closer interface { Close() error }           // Single method: -er suffix
type ReadWriter interface { Reader; Writer }      // Composition: descriptive name
type Handler interface { Handle(data string) }    // Clear purpose

// Interface documentation
// Handler processes incoming data and returns the result.
// Implementations must be safe for concurrent use.
type Handler interface {
    // Handle processes the data and returns the result or an error.
    Handle(data string) (string, error)
}
```

## Real-World Example

```go
package main

import (
    "fmt"
    "log"
)

// Small, focused interface
type EmailSender interface {
    Send(to, subject, body string) error
}

// Production implementation
type SMTPSender struct {
    host string
    port int
}

func (s *SMTPSender) Send(to, subject, body string) error {
    // SMTP implementation
    fmt.Printf("Sending email to %s via SMTP\n", to)
    return nil
}

// Test implementation
type MockSender struct {
    SentEmails []string
}

func (m *MockSender) Send(to, subject, body string) error {
    m.SentEmails = append(m.SentEmails, to)
    return nil
}

// Business logic depends only on interface
type UserService struct {
    emailSender EmailSender
}

func (s *UserService) RegisterUser(email string) error {
    // ... registration logic ...
    
    err := s.emailSender.Send(email, "Welcome", "Welcome to our service!")
    if err != nil {
        return fmt.Errorf("failed to send welcome email: %w", err)
    }
    return nil
}

func main() {
    // Production
    smtp := &SMTPSender{host: "smtp.example.com", port: 587}
    service := UserService{emailSender: smtp}
    
    if err := service.RegisterUser("user@example.com"); err != nil {
        log.Fatal(err)
    }
}
```
