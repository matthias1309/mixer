# Documentation

This directory contains all project documentation following Arc42 and Req42 frameworks.

## Structure

### Architecture (`architecture/`)
- **arc42.md** - Complete architecture documentation following Arc42 standard
  - System overview and goals
  - Technical constraints
  - Architecture decisions
  - Building blocks and runtime views
  - Deployment strategy
  - Quality requirements

### Requirements (`requirements/`)
- **req42-template.md** - Template for creating requirement documents
- **mvp/** - MVP phase requirements
  - 01-user-management.md - Authentication and user management
  - 02-recipe-management.md - Recipe CRUD operations
  - 03-recipe-filtering.md - Ingredient-based filtering
- **future/** - Planned features for future phases

### Roadmap (`roadmap/`)
- **kanban.md** - Project planning and Kanban board
  - Epics and user stories
  - Backlog with ticket definitions
  - Progress tracking
  - Velocity and metrics

### Decisions (`decisions/`)
- Architecture Decision Records (ADRs)
- Format: adr-###-[decision-name].md
- Includes: Context, Decision, Consequences, Alternatives

### Learnings (`learnings/`)
- Code review findings and improvements
- Patterns and anti-patterns discovered
- Refactoring opportunities
- Technical debt tracking

## Writing Documentation

### Style Guidelines
- **Language**: English only
- **Format**: Markdown
- **Clarity**: Write for developers who haven't seen this code
- **Conciseness**: Be thorough but not verbose

### Updating Documentation
- Update requirements when specs change
- Update arc42 when architecture changes
- Update kanban as tickets progress
- Create ADRs for significant decisions
- Record learnings after code reviews

## Documentation Workflow

1. **Requirements** → Req42 documents in `requirements/`
2. **Architecture** → Arc42 document and ADRs
3. **Planning** → Kanban board with tickets
4. **Implementation** → Code with tests
5. **Review** → Code review with checklist
6. **Learning** → Record findings in learnings/
7. **Feedback** → Update future requirements

## Key Documents

Start here:
- `.claude/CLAUDE.md` - Project guidelines and constraints
- `architecture/arc42.md` - System overview
- `requirements/mvp/` - Current MVP requirements
- `roadmap/kanban.md` - What's being built next
