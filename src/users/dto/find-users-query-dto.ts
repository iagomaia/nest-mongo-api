import { BaseQueryParametersDto } from '../../shared/dto/base-query-paramets.dto';

export class FindUsersQueryDto extends BaseQueryParametersDto {
  name: string;
  email: string;
  status: boolean;
  role: string;
}
