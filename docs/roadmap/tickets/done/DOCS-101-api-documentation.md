# DOCS-101: API Documentation

**Type**: Chore  
**Effort**: 3 story points  
**Priority**: P1 (Should Have)  
**Status**: Ready  
**Phase**: 5 - E2E & Documentation  
**Order**: 30th  

---

## Description

Document all API endpoints with request/response formats, status codes, and examples.

## Acceptance Criteria

- [ ] API documentation file created: `docs/api.md`
- [ ] All endpoints documented:
  - POST /api/auth/register
  - POST /api/auth/login
  - POST /api/auth/logout
  - GET /api/users/profile
  - POST /api/recipes
  - GET /api/recipes
  - GET /api/recipes/[id]
  - PUT /api/recipes/[id]
  - DELETE /api/recipes/[id]
  - GET /api/recipes/ingredients
- [ ] For each endpoint: method, path, description
- [ ] Request format documented
- [ ] Response format documented
- [ ] Status codes and errors documented
- [ ] Example requests/responses included
- [ ] Authentication requirements noted
- [ ] Rate limiting noted (if applicable)

## Dependencies

- All API features implemented

## Implementation Notes

- Create `docs/api.md`
- Structure: endpoint → description → request → response → errors
- Include curl examples or similar

## Definition of Done

- [ ] API documentation complete
- [ ] All endpoints covered
- [ ] Examples included
- [ ] Code review approved

## Related Documents

- Arc42: Section 5.2 (Building Blocks - API)
