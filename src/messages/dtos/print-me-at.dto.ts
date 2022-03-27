import { IsPositive, IsString } from 'class-validator';

export class PrintMeAtDto {
  @IsString()
  readonly text: string;

  @IsPositive()
  readonly timestamp: number;
}
