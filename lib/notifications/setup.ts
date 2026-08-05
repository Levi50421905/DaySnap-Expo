import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function setupNotificationChannels() {
  if (Platform.OS !== 'android') return

  await Notifications.setNotificationChannelAsync('daily-reminder', {
    name: 'Reminder Harian',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4ECDC4',
  })

  await Notifications.setNotificationChannelAsync('discovery', {
    name: 'Discovery',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#E8C547',
  })

  await Notifications.setNotificationChannelAsync('monthly-recap', {
    name: 'Monthly Recap',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#4ECDC4',
  })
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing === 'granted') return true

  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}