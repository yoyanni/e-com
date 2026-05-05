import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { hash, compare } from 'bcrypt';
import { IsNull } from 'typeorm';
import { AuthService } from './auth.service';
import { UserRole } from '@e-com/shared';

jest.mock('bcrypt');

const mockHash = hash as jest.Mock;
const mockCompare = compare as jest.Mock;

function makeUserRepo() {
  return {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
}

function makeRefreshTokenRepo() {
  return {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
}

const MOCK_USER = {
  id: 'user-uuid',
  email: 'test@example.com',
  name: 'Test User',
  passwordHash: 'hashed-password',
  role: 'customer' as const,
};

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: ReturnType<typeof makeUserRepo>;
  let refreshTokenRepo: ReturnType<typeof makeRefreshTokenRepo>;
  let jwtService: { sign: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();

    userRepo = makeUserRepo();
    refreshTokenRepo = makeRefreshTokenRepo();
    jwtService = { sign: jest.fn().mockReturnValue('mock-access-token') };

    // generateTokenPair internals
    refreshTokenRepo.create.mockReturnValue({
      tokenHash: 'new-token-hash',
      family: 'new-family-uuid',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    refreshTokenRepo.save.mockResolvedValue({});

    service = new AuthService(
      userRepo as any,
      refreshTokenRepo as any,
      jwtService as any,
    );
  });

  describe('getMe', () => {
    it('returns AuthUser projection when user exists', async () => {
      userRepo.findOne.mockResolvedValue(MOCK_USER);

      const result = await service.getMe(MOCK_USER.id);

      expect(result).toEqual({
        id: MOCK_USER.id,
        email: MOCK_USER.email,
        role: MOCK_USER.role,
      });
    });

    it('throws NotFoundException when user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.getMe('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('register', () => {
    const dto = {
      email: 'new@example.com',
      name: 'New User',
      password: 'password123',
    };

    it('throws ConflictException if email is already in use', async () => {
      userRepo.findOne.mockResolvedValue(MOCK_USER);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('hashes password with 10 rounds, saves user, and returns token pair', async () => {
      userRepo.findOne.mockResolvedValue(null);
      mockHash.mockResolvedValue('hashed-pw');
      const savedUser = {
        ...MOCK_USER,
        email: dto.email,
        passwordHash: 'hashed-pw',
      };
      userRepo.create.mockReturnValue(savedUser);
      userRepo.save.mockResolvedValue(savedUser);

      const result = await service.register(dto);

      expect(mockHash).toHaveBeenCalledWith(dto.password, 10);
      expect(userRepo.save).toHaveBeenCalled();
      expect(result.accessToken).toBe('mock-access-token');
      expect(typeof result.refreshToken).toBe('string');
      expect(result.refreshToken.length).toBeGreaterThan(0);
    });
  });

  describe('login', () => {
    const dto = { email: 'test@example.com', password: 'password123' };

    it('throws UnauthorizedException for an unknown email', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for a wrong password', async () => {
      userRepo.findOne.mockResolvedValue(MOCK_USER);
      mockCompare.mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('returns token pair on valid credentials', async () => {
      userRepo.findOne.mockResolvedValue(MOCK_USER);
      mockCompare.mockResolvedValue(true);

      const result = await service.login(dto);

      expect(mockCompare).toHaveBeenCalledWith(
        dto.password,
        MOCK_USER.passwordHash,
      );
      expect(result.accessToken).toBe('mock-access-token');
      expect(typeof result.refreshToken).toBe('string');
      expect(result.refreshToken.length).toBeGreaterThan(0);
    });
  });

  describe('refreshAccess', () => {
    const rawToken = 'a'.repeat(128); // 128-char hex string

    it('throws UnauthorizedException for a non-existent token', async () => {
      refreshTokenRepo.findOne.mockResolvedValue(null);

      await expect(service.refreshAccess(rawToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('revokes the entire family and throws UnauthorizedException on token reuse', async () => {
      const revokedToken = {
        tokenHash: 'hash',
        family: 'family-id',
        revokedAt: new Date(), // already revoked — reuse attempt
        expiresAt: new Date(Date.now() + 1000),
        user: MOCK_USER,
      };
      refreshTokenRepo.findOne.mockResolvedValue(revokedToken);
      refreshTokenRepo.update.mockResolvedValue({});

      await expect(service.refreshAccess(rawToken)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(refreshTokenRepo.update).toHaveBeenCalledTimes(1);
      const [whereClause, updatePayload] = refreshTokenRepo.update.mock
        .calls[0] as [unknown, unknown];
      expect(whereClause).toEqual({ family: 'family-id', revokedAt: IsNull() });
      expect(updatePayload).toHaveProperty('revokedAt');
      expect(
        (updatePayload as { revokedAt?: unknown }).revokedAt,
      ).toBeInstanceOf(Date);
    });

    it('throws UnauthorizedException for an expired token', async () => {
      const expiredToken = {
        tokenHash: 'hash',
        family: 'family-id',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000), // in the past
        user: MOCK_USER,
      };
      refreshTokenRepo.findOne.mockResolvedValue(expiredToken);

      await expect(service.refreshAccess(rawToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('revokes old token, issues new token pair on success', async () => {
      const validToken = {
        tokenHash: 'hash',
        family: 'family-id',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: MOCK_USER,
      };
      refreshTokenRepo.findOne.mockResolvedValue(validToken);

      const result = await service.refreshAccess(rawToken);

      expect(refreshTokenRepo.save).toHaveBeenCalledTimes(2); // revoke old + save new
      const revokeCall = refreshTokenRepo.save.mock.calls[0] as [unknown];
      const savedToken = revokeCall[0];
      expect(savedToken).toHaveProperty('revokedAt');
      expect((savedToken as { revokedAt?: unknown }).revokedAt).toBeInstanceOf(
        Date,
      );
      expect(result.accessToken).toBe('mock-access-token');
      expect(typeof result.refreshToken).toBe('string');
      expect(result.refreshToken.length).toBeGreaterThan(0);
    });
  });

  describe('logout', () => {
    it('is a no-op when the token is not found', async () => {
      refreshTokenRepo.findOne.mockResolvedValue(null);

      await expect(service.logout('unknown-token')).resolves.toBeUndefined();
      expect(refreshTokenRepo.save).not.toHaveBeenCalled();
    });

    it('sets revokedAt on the token entity when found', async () => {
      const tokenEntity = { tokenHash: 'hash', revokedAt: null };
      refreshTokenRepo.findOne.mockResolvedValue(tokenEntity);

      await service.logout('some-token');

      expect(refreshTokenRepo.save).toHaveBeenCalledTimes(1);
      const logoutSaveCall = refreshTokenRepo.save.mock.calls[0] as [unknown];
      const savedEntity = logoutSaveCall[0];
      expect(savedEntity).toHaveProperty('revokedAt');
      expect((savedEntity as { revokedAt?: unknown }).revokedAt).toBeInstanceOf(
        Date,
      );
    });
  });

  describe('updateRole', () => {
    it('throws BadRequestException when updating own role', async () => {
      await expect(
        service.updateRole(MOCK_USER.id, UserRole.ADMIN, MOCK_USER.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when the target user does not exist', async () => {
      userRepo.update.mockResolvedValue({ affected: 0 });

      await expect(
        service.updateRole('other-uuid', UserRole.ADMIN, MOCK_USER.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates the role when the target user exists', async () => {
      userRepo.update.mockResolvedValue({ affected: 1 });

      await expect(
        service.updateRole('other-uuid', UserRole.ADMIN, MOCK_USER.id),
      ).resolves.toBeUndefined();
      expect(userRepo.update).toHaveBeenCalledWith('other-uuid', {
        role: UserRole.ADMIN,
      });
    });
  });
});
