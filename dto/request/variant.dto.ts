import { ValidateNested } from 'class-validator';

export class CreateVariation {
  @ValidateNested({ each: true })
  name: ITranslate[];
}
