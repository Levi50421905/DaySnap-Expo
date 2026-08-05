import * as Notifications from 'expo-notifications'

const DAILY_REMINDER_ID = 'daysnap-daily-reminder'
const MONTHLY_RECAP_ID = 'daysnap-monthly-recap'

export async function scheduleDailyReminder(time: string, enabled: boolean) {
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {})

  if (!enabled) return

  const [hourStr, minuteStr] = time.split(':')
  const hour = Number(hourStr)
  const minute = Number(minuteStr)

  if (Number.isNaN(hour) || Number.isNaN(minute)) return

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: 'Belum upload foto hari ini 📸',
      body: 'Jangan sampai kelewat, abadikan momen hari ini di Daysnap.',
      ...(process.env.EXPO_OS === 'android' ? { channelId: 'daily-reminder' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  })
}

export async function scheduleMonthlyRecap(enabled: boolean) {
  await Notifications.cancelScheduledNotificationAsync(MONTHLY_RECAP_ID).catch(() => {})

  if (!enabled) return

  // Tanggal 1 tiap bulan, jam 09:00
  await Notifications.scheduleNotificationAsync({
    identifier: MONTHLY_RECAP_ID,
    content: {
      title: 'Recap bulan lalu sudah siap ✨',
      body: 'Lihat statistik dan temuan terbaik kamu bulan kemarin di tab Stats.',
      ...(process.env.EXPO_OS === 'android' ? { channelId: 'monthly-recap' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
      day: 1,
      hour: 9,
      minute: 0,
    },
  })
}

export async function cancelAllScheduled() {
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {})
  await Notifications.cancelScheduledNotificationAsync(MONTHLY_RECAP_ID).catch(() => {})
}