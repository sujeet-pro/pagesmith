---
title: "API Design Patterns"
description: "Best practices for designing clean, maintainable APIs"
publishedDate: 2026-02-01T00:00:00.000Z
lastUpdatedOn: 2026-03-15T00:00:00.000Z
tags:
  - api
  - design-patterns
  - rest
---

# API Design Patterns

Good API design makes systems easier to understand, integrate with, and maintain.

## RESTful Conventions

### Resource Naming

Use nouns, not verbs:

```text
✅ GET /users/123
❌ GET /getUser?id=123
```

### HTTP Methods

| Method | Purpose | Idempotent |
|--------|---------|------------|
| GET | Read | Yes |
| POST | Create | No |
| PUT | Replace | Yes |
| PATCH | Update | Yes |
| DELETE | Remove | Yes |

## Error Handling

Return consistent error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      { "field": "email", "message": "Must be a valid email address" }
    ]
  }
}
```

## Pagination

Use cursor-based pagination for large datasets:

```typescript
interface PaginatedResponse<T> {
  data: T[]
  cursor: string | null
  hasMore: boolean
}
```

## Rate Limiting

Protect your API with rate limiting headers:

```text
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```
