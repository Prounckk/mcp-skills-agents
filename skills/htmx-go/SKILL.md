# HTMX with Go Templates

This skill covers the integration of **HTMX** with Go's `html/template` package to build dynamic, refined web applications using Server-Side Rendering (SSR).

## 1. The Core Philosophy

HTMX allows you to access modern browser features (AJAX, CSS Transitions, WebSockets) directly from HTML attributes. Combined with Go templates, you can act on the **Hypertext as the Engine of Application State (HATEOAS)** principle:

1.  **State is on the Server**: The server holds the truth.
2.  **HTML Over the Wire**: The server responds with HTML fragments, not JSON.
3.  **Client Updates DOM**: HTMX swaps the returned HTML into the DOM.

## 2. Go Template Essentials for HTMX

### Parsing & Execution
Always use `html/template` for HTML generation to ensure Context-Aware Escaping (preventing XSS).

```go
import "html/template"

// Parse all templates (layouts and partials)
var templates = template.Must(template.ParseGlob("views/**/*.html"))

// Execute a specific template block
err := templates.ExecuteTemplate(w, "block_name", data)
```

### Key Actions
*   **`{{define "name"}} ... {{end}}`**: Defines a reusable template fragment (partial).
*   **`{{template "name" .}}`**: Renders a defined fragment.
*   **`{{block "name" .}} ... {{end}}`**: Defines a block that can be overridden by child templates.
*   **`{{range .Items}} ... {{end}}`**: Iterates over a slice.
*   **`{{if .Condition}} ... {{else}} ... {{end}}`**: Conditional rendering.

## 3. HTMX Essentials

### Key Attributes
*   **`hx-get`, `hx-post`, `hx-put`, `hx-delete`**: Triggers an AJAX request.
*   **`hx-trigger`**: Event that triggers the request (e.g., `click`, `keyup changed delay:500ms`).
*   **`hx-target`**: CSS selector for the element to update (e.g., `#results`).
*   **`hx-swap`**: How to swap the content (`innerHTML`, `outerHTML`, `beforebegin`, `afterend`, `delete`).

## 4. Integration Patterns

### Pattern A: Partial Rendering (The "Happy Path")
The most common pattern is efficiently rendering *only* the part of the page that changed.

**Go Handler Strategy:**
1.  Check for the `HX-Request` header.
2.  If present, render only the specific fragment (partial).
3.  If missing (full page load), render the layout + the fragment.

**Example Go Code:**
```go
func SearchHandler(w http.ResponseWriter, r *http.Request) {
    query := r.URL.Query().Get("q")
    results := SearchDatabase(query) // returns []Item
    
    // Check if it's an HTMX request
    if r.Header.Get("HX-Request") == "true" {
        // Render only the rows
        templates.ExecuteTemplate(w, "results_rows", results)
    } else {
        // Render the full search page
        templates.ExecuteTemplate(w, "search_page", results)
    }
}
```

**Template (`search.html`):**
```html
{{define "search_page"}}
<!DOCTYPE html>
<html>
<body>
    <input type="search" 
           name="q" 
           hx-get="/search" 
           hx-trigger="keyup changed delay:500ms" 
           hx-target="#results">
    
    <table>
        <tbody id="results">
            {{template "results_rows" .}}
        </tbody>
    </table>
</body>
</html>
{{end}}

{{define "results_rows"}}
    {{range .}}
    <tr>
        <td>{{.Name}}</td>
        <td>{{.Price}}</td>
    </tr>
    {{end}}
{{end}}
```

### Pattern B: Out-of-Band (OOB) Swaps
Use OOB swaps when a single request needs to update multiple, non-adjacent parts of the DOM (e.g., adding an item to a list AND updating a cart counter in the header).

**Response HTML:**
```html
<!-- Main content to swap into hx-target -->
<li>New Item</li>

<!-- OOB content finds element with id="cart-count" and swaps it -->
<span id="cart-count" hx-swap-oob="true">Items: 5</span>
```

**Go Implementation:**
Simply execute multiple templates writing to the same response writer usable in `hx-request` context.

### Pattern C: Click-to-Edit
This pattern allows inline editing of data without a full page reload or complex modal logic.

1.  **View State**: Div showing the value and an "Edit" button.
2.  **Edit State**: Form with input and "Save"/"Cancel" buttons.

**Template:**
```html
{{define "contact"}}
<div id="contact-{{.ID}}">
    <p>
        Name: {{.Name}}
        <button hx-get="/contact/{{.ID}}/edit" hx-target="#contact-{{.ID}}">
            Edit
        </button>
    </p>
</div>
{{end}}

{{define "contact_form"}}
<form hx-put="/contact/{{.ID}}" hx-target="this" hx-swap="outerHTML">
    <input type="text" name="name" value="{{.Name}}">
    <button type="submit">Save</button>
    <button hx-get="/contact/{{.ID}}" hx-target="this" hx-swap="outerHTML">
        Cancel
    </button>
</form>
{{end}}
```

## 5. Directory Structure Recommendation

Organize templates to separate full page layouts from reusable fragments.

```text
/views
    /layouts
        base.html       # <html>, <head>, global css/js
    /pages
        home.html       # Full page definitions
        dashboard.html
    /partials
        card.html       # Reusable fragments
        list_item.html
```

## 6. Common Pitfalls & Tips

*   **Idempotency**: Ensure GET requests are safe and typically readonly. Use POST/PUT/DELETE for state changes.
*   **CSRF**: If using a framework like Chi or Fiber with CSRF middleware, ensure the CSRF token is included in `hx-headers` or standard forms.
    ```html
    <body hx-headers='{"X-CSRF-Token": "{{.CSRFToken}}"}'>
    ```
*   **JSON Response**: If you *must* return JSON (e.g., for a client-side chart), distinct endpoints are cleaner than mixing logic.
*   **Debugging**: Set `htmx.logAll()` in the browser console or add `hx-vals='js:{timestamp: Date.now()}'` to bust caches during dev.
