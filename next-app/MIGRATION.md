# Migration status

- [x] Isolated `/next-app` workspace
- [x] Next.js + TypeScript project shell
- [x] Required homepage/shared assets copied into `/next-app/public`
- [x] Shared header recreated as a React component
- [x] Shared footer recreated as a React component
- [x] Homepage recreated as the first Next.js route
- [ ] Homepage visual/functionality parity testing
- [ ] API/auth integration parity

## Boundary

During migration, files outside `/next-app` are read-only references. The current static site remains untouched until final cutover.
