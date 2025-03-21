import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class ListProductDto {
  @ApiPropertyOptional({ description: 'Page to be returned' })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Number of records per page' })
  @IsOptional()
  perPage?: number;

  @ApiPropertyOptional({
    description: 'Column defined to sort data: "name" or "createdAt"',
  })
  @IsOptional()
  sort?: string;

  @ApiPropertyOptional({
    description: 'Sorting data: ascending or descending',
  })
  @IsOptional()
  sortDir?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    description: 'Data provided to filter the result',
  })
  @IsOptional()
  filter?: string;
}
