import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  provider: string;

  @Column({ length: 100 })
  providerId: string;

  @Column()
  name: string;

  @Column()
  email: string;
}
