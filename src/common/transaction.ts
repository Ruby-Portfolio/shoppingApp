import { DataSource } from 'typeorm';
import { HttpException } from '@nestjs/common';

/**
 * 트랜잭션 처리
 * @param dataSource dataSource
 * @param logic 트랜잭션으로 처리할 비즈니스 로직 실행 함수
 * @param isolationLevel 트랜잭션 처리 레벨
 */
export const wrapTransaction = async (
  dataSource: DataSource,
  logic: Function,
  isolationLevel:
    | 'READ UNCOMMITTED'
    | 'READ COMMITTED'
    | 'REPEATABLE READ'
    | 'SERIALIZABLE' = 'READ COMMITTED',
): Promise<any> => {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction(isolationLevel);
  const entityManager = queryRunner.manager;

  try {
    // 비즈니스 로직 실행
    const execute = await logic(entityManager);

    // sql 커밋
    await queryRunner.commitTransaction();

    return execute;
  } catch (error) {
    // 오류 발생시 롤백 처리
    await queryRunner.rollbackTransaction();

    throw new SQLException(error);
  } finally {
    // 커넥션 연결 해제
    await queryRunner.release();
  }
};

export class SQLException extends HttpException {
  constructor(error: HttpException) {
    super(error.message, error.getStatus());
  }

  public static readonly ERROR_MESSAGE = '해당 요청 처리에 실패하였습니다.';
}
