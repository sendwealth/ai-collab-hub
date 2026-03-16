import { IsString, IsArray, IsInt, Min } from 'class-validator';

export class AnswerDto {
  @IsString()
  questionId: string;

  @IsString()
  answer: string;

  @IsInt()
  @Min(0)
  timeSpent: number;
}

export class SubmitAnswersDto {
  @IsArray()
  answers: AnswerDto[];
}
