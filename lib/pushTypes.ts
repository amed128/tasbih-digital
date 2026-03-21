export type ReminderScheduleType = "daily" | "weekly";

export type ReminderTime = {
  hour: number;
  minute: number;
};

export type PushSubscriptionRecord = {
  endpoint: string;
  subscription: PushSubscriptionJSON;
  remindersEnabled: boolean;
  reminderScheduleType: ReminderScheduleType;
  reminderTimes: ReminderTime[];
  reminderDays: number[];
  language: "fr" | "en";
  timezone: string;
  updatedAt: string;
  lastSentSlot?: string;
};

export type PushStoreShape = {
  subscribers: PushSubscriptionRecord[];
};
