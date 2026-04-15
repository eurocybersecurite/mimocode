# Skill: Dockerize
## Goal
Create production-ready Docker configurations for various applications.

## Procedures
1. **Multi-stage builds:** Always use separate build and runtime stages.
2. **Security:** Use a non-root user.
3. **Optimizations:** Utilize .dockerignore to exclude node_modules, .git, etc.
4. **Environment:** Properly handle environment variables.
5. **Validation:** Ensure the image builds successfully and verify ports are mapped.
