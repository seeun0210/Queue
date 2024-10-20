// processed-log.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class ProcessedLog extends Document {
  @Prop()
  userId: string;

  @Prop()
  originalAction: string;

  @Prop()
  processedAction: string;

  @Prop()
  timestamp: Date;
}

export const ProcessedLogSchema = SchemaFactory.createForClass(ProcessedLog);
