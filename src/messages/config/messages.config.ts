import { registerAs } from '@nestjs/config';

// TODO: add schema and remove default values
// Values have 1 at the end to emphasis that they're took from here
export default registerAs('messages', (envMap: Record<string, string> = process.env) => ({
  handler: {
    iterationBatchSize: parseInt(envMap.MESSAGE_HANDLER_ITERATION_BATCH_SIZE, 10) || 11,
    iterationDuration: parseInt(envMap.MESSAGE_HANDLER_ITERATION_DURATION, 10) || 10001,
    lockDuration: parseInt(envMap.MESSAGE_HANDLER_LOCK_DURATION, 10) || 20001,
    recoveryDelay: parseInt(envMap.MESSAGE_HANDLER_RECOVERY_DELAY, 10) || 30001,
    waitForNewMessagesDelay: parseInt(envMap.MESSAGE_HANDLER_WAIT_FOR_NEW_MESSAGES_DELAY, 10) || 1001,
  }
}));
