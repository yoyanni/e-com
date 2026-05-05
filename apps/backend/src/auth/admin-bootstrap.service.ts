import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcrypt';
import { User } from '../entities/user.entity';
import { UserRole } from '@e-com/shared';

@Injectable()
export class AdminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const email = this.config.get<string>('ADMIN_EMAIL');
    const password = this.config.get<string>('ADMIN_PASSWORD');
    const name = this.config.get<string>('ADMIN_NAME') ?? 'Admin';

    if (!email || !password) return;

    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) return;

    const passwordHash = await hash(password, 10);
    await this.userRepo.save(
      this.userRepo.create({ email, name, passwordHash, role: UserRole.ADMIN }),
    );
    this.logger.log(`Admin user created: ${email}`);
  }
}
