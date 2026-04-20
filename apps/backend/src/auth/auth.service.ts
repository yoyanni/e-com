import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { hash, compare } from 'bcrypt';
import { User } from '../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { RefreshToken } from 'src/entities/refresh-token.entity';
import { AuthUser } from '@e-com/shared';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
  ) {}

  async getMe(userId: string): Promise<AuthUser | null> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { id: user.id, email: user.email, role: user.role };
  }

  async register(
    dto: RegisterDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await hash(dto.password, 10);
    const user = this.userRepo.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
    });
    await this.userRepo.save(user);

    return this.generateTokenPair(user);
  }

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokenPair(user);
  }

  async refreshAccess(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = this.generateHash(refreshToken);
    const tokenEntity = await this.refreshTokenRepo.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (!tokenEntity) {
      throw new UnauthorizedException('Invalid refresh token');
    } else if (tokenEntity.revokedAt) {
      await this.refreshTokenRepo.update(
        { family: tokenEntity.family, revokedAt: IsNull() },
        { revokedAt: new Date() },
      );
      throw new UnauthorizedException('Refresh token revoked');
    } else if (tokenEntity.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    tokenEntity.revokedAt = new Date();
    await this.refreshTokenRepo.save(tokenEntity);

    return this.generateTokenPair(tokenEntity.user, tokenEntity.family);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.generateHash(refreshToken);
    const tokenEntity = await this.refreshTokenRepo.findOne({
      where: { tokenHash },
    });

    if (!tokenEntity) {
      return;
    }

    tokenEntity.revokedAt = new Date();
    await this.refreshTokenRepo.save(tokenEntity);
  }

  async updateRole(
    id: string,
    role: User['role'],
    requestUserId: string,
  ): Promise<void> {
    if (id === requestUserId) {
      throw new BadRequestException('Cannot change your own role');
    }

    const result = await this.userRepo.update(id, { role });
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  private async generateTokenPair(
    user: User,
    family?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const refreshToken = randomBytes(64).toString('hex');
    const refreshTokenHash = this.generateHash(refreshToken);

    const tokenEntity = this.refreshTokenRepo.create({
      tokenHash: refreshTokenHash,
      family: family ?? randomUUID(),
      user,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await this.refreshTokenRepo.save(tokenEntity);

    return { accessToken: this.jwtService.sign(payload), refreshToken };
  }

  private generateHash(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }
}
