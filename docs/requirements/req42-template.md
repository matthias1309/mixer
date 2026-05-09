# Req42 - Requirements Template

This template defines the structure for capturing requirements following the Req42 framework.

## Structure

### Header
```markdown
# [Feature/Epic Name] Requirements

**Version**: 1.0  
**Date**: YYYY-MM-DD  
**Status**: Active | Completed | On Hold  
**Epic**: [Parent Epic if applicable]  
**Priority**: Must Have | Should Have | Nice to Have  
**Owner**: [Responsible person]  
```

### 1. Overview

**Description**: Brief overview of the feature or epic.

**Business Value**: Why is this feature important? What problem does it solve?

**Success Criteria**: How do we know this feature is successful?

---

### 2. Functional Requirements

List of "what" the system must do.

**Format**:
```
FR-XXX: [Short description]
- Description: [Detailed description]
- Acceptance Criteria:
  - Criterion 1
  - Criterion 2
  - Criterion 3
```

**Example**:
```
FR-101: User can register with email and password
- Description: Users should be able to create a new account by providing an email and password
- Acceptance Criteria:
  - Registration form displays email and password fields
  - Form validates email format
  - Form validates password minimum length (8 chars)
  - Password is hashed before storage
  - User receives confirmation email (future)
  - Duplicate email addresses are rejected
```

---

### 3. Non-Functional Requirements

System properties like performance, security, maintainability.

**Format**:
```
NFR-XXX: [Short description]
- Requirement: [Detailed requirement]
- Measurement: [How to verify/test]
- Target: [Acceptable value/range]
```

**Example**:
```
NFR-201: API Response Time
- Requirement: All API endpoints should respond within acceptable time
- Measurement: Response time under load (10 concurrent users)
- Target: <500ms for GET requests, <1s for POST requests
```

---

### 4. User Stories (Optional)

Detailed user stories for complex features.

**Format**:
```
### US-XXX: [Short title]

**As a** [user role]  
**I want to** [action]  
**So that** [benefit]  

**Acceptance Criteria**:
- [ ] Criterion 1
- [ ] Criterion 2

**Tasks**:
- [ ] Task 1
- [ ] Task 2

**Estimated Effort**: [Story Points or hours]
```

**Example**:
```
### US-301: Filter recipes by available ingredients

**As a** home cook  
**I want to** select ingredients I have and see recipes I can make  
**So that** I can efficiently use ingredients on hand  

**Acceptance Criteria**:
- [ ] Ingredient selection interface displays all available ingredients
- [ ] User can select/deselect multiple ingredients
- [ ] Recipe list updates in real-time as ingredients are selected
- [ ] Recipes show only if ALL selected ingredients are in the recipe
- [ ] Filter state persists during the session

**Tasks**:
- [ ] Create IngredientFilter component
- [ ] Create recipe filtering logic
- [ ] Add unit tests for filter logic
- [ ] Add E2E test for filter flow
- [ ] Performance: handle 100+ ingredients without lag

**Estimated Effort**: 8 story points
```

---

### 5. Dependencies

**External Dependencies**:
- [Dependency name] - [Why it's needed]

**Internal Dependencies**:
- [Feature] - [Why it's needed]

---

### 6. Assumptions

- Assumption 1
- Assumption 2

---

### 7. Constraints

- Constraint 1
- Constraint 2

---

### 8. Out of Scope

What is explicitly NOT included in this feature:
- Item 1
- Item 2

---

### 9. Testing Strategy

**Unit Tests**:
- What business logic needs testing?

**Integration Tests**:
- What API endpoints or workflows need testing?

**E2E Tests**:
- What user flows need end-to-end testing?

**Test Coverage Target**: 80%+

---

### 10. Documentation

**User Documentation**:
- What needs to be documented for users?

**Developer Documentation**:
- What needs to be documented for developers?

**Code Comments**:
- Are there complex algorithms or non-obvious logic that need comments?

---

### 11. Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] E2E tests for critical flows
- [ ] Code coverage ≥80%
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] No breaking changes to existing functionality

---

### 12. Notes and Open Questions

- Question 1?
- Assumption to clarify?
- Decision pending?

---

## Using This Template

1. **Copy** this template for each feature/epic
2. **Remove** sections that don't apply
3. **Fill in** all relevant sections
4. **Keep** the Definition of Done section always
5. **Link** requirements to tickets/issues
6. **Update** status as feature progresses (Active → Completed)

## Example Files

See `mvp/` directory for concrete examples:
- `01-user-management.md`
- `02-recipe-management.md`
- `03-recipe-filtering.md`
