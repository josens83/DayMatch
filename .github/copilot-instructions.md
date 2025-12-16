# GitHub Copilot Instructions for DayMatch

## Project Overview
DayMatch is a short-term job matching platform connecting employers with workers.

## Tech Stack
- Backend: NestJS + TypeScript + TypeORM + PostgreSQL
- Mobile: React Native (Expo) + Redux Toolkit
- Admin: React + Vite + Tailwind CSS

## Code Guidelines

### TypeScript
- Always use strict mode
- Provide explicit return types
- Never use `any`, use `unknown` with type guards
- Use @/ path aliases for imports

### NestJS Patterns
```typescript
// Controller example
@Controller('users')
@ApiTags('Users')
export class UsersController {
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string): Promise<UserDto> {
    return this.usersService.findOne(id);
  }
}

// Service example
@Injectable()
export class UsersService {
  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
```

### React/React Native Patterns
```typescript
// Component example
interface UserCardProps {
  user: User;
  onPress?: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{user.name}</Text>
    </TouchableOpacity>
  );
};
```

## File Naming
- TypeScript: `kebab-case.ts`
- React components: `PascalCase.tsx`
- Test files: `*.spec.ts` or `*.test.ts`

## Commit Message Format
Follow Conventional Commits:
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `refactor:` code refactoring
- `test:` adding tests
- `chore:` maintenance

## Important Notes
- Korean comments are acceptable
- Always validate DTOs with class-validator
- Add Swagger decorators to all API endpoints
- Run `npm run verify` before committing
