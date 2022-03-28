import { PrintMessageIterationStatus } from '../enums/print-message-iteration-status';

type MessageHandledResult = {
  status: PrintMessageIterationStatus.MESSAGE_HANDLED
}

type NoMessagesAreReadyResult = {
  status: PrintMessageIterationStatus.NO_MESSAGES_ARE_READY
}

export type PrintMessageIterationResult =
  MessageHandledResult |
  NoMessagesAreReadyResult
