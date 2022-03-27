import { IsPositive, IsString, MinLength } from 'class-validator';

export class PrintMeAtDto {
  @MinLength(1)
  @IsString()
  readonly text: string;

  @IsPositive()
  readonly timestamp: number;
}
