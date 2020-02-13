import {
  BaseEntity,
  Entity,
  Unique,
  PrimaryGeneratedColumn,
  ObjectID,
  Column,
  ObjectIdColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';

@Entity()
@Unique(['email'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  @ObjectIdColumn()
  id: ObjectID;

  @Column({ nullable: false })
  email: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  role;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: false })
  salt: string;

  async checkPassword(password: string): Promise<boolean> {
    const hash = await bcrypt.hash(password, this.salt);
    return hash === this.password;
  }
}
