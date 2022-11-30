import { CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from 'typeorm';

export class DateColumns {
  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;

  @DeleteDateColumn()
  deleteAt: Date;
}
