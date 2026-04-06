import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  tokenHash: string;

  @Column()
  family: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  revokedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
