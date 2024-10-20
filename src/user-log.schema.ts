import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class UserLog extends Document {
  @Prop()
  userId: string;

  @Prop()
  action: string;

  @Prop()
  timestamp: Date;
}

export const UserLogSchema = SchemaFactory.createForClass(UserLog);
