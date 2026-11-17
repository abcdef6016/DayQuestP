import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { cottageReminderId, scheduleCottageReminder } from './cottage-reminder.mjs';

const native = Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('LocalNotifications');
const reminders = [
  { id: cottageReminderId, prefix: 'cottage-reminder', title: 'DayQuest Cottage check-in',
    body: 'Drop by the Cottage to check your quests and see who is around.' },
  { id: 6642, prefix: 'quick-reminder', title: 'A quick DayQuest rush?',
    body: 'Plate orders in Food Village or serve drinks in Barista for points.', extra: { quickGame: true } }
];

for (const reminder of reminders) {
  const form = document.getElementById(reminder.prefix + '-form');
  const time = form.querySelector('input');
  const status = document.getElementById(reminder.prefix + '-status');
  const buttons = form.querySelectorAll('button');
  const disable = form.querySelector('button[type=button]');
  const lock = value => buttons.forEach(button => { button.disabled = value; });
  if (!native) {
    form.hidden = true;
    status.textContent = 'Daily notifications are available in the Android app.';
    continue;
  }
  lock(true);
  LocalNotifications.getPending().then(({ notifications }) => {
    const current = notifications.find(item => item.id === reminder.id)?.schedule?.on;
    if (Number.isInteger(current?.hour) && Number.isInteger(current?.minute)) {
      time.value = [current.hour, current.minute].map(part => String(part).padStart(2, '0')).join(':');
      status.textContent = 'Daily reminder scheduled for ' + time.value + ' (device time).';
    }
  }).catch(() => {
    status.textContent = 'Could not read the current notification schedule.';
  }).finally(() => lock(false));

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const requested = time.value;
    lock(true);
    try {
      const scheduled = await scheduleCottageReminder(LocalNotifications, requested, reminder);
      status.textContent = scheduled ? 'Daily reminder scheduled for ' + requested + ' (device time).'
        : 'Allow DayQuest notifications in Android settings to schedule a reminder.';
    } catch {
      status.textContent = 'Could not schedule the reminder. Try again.';
    } finally {
      lock(false);
    }
  });

  disable.addEventListener('click', async () => {
    lock(true);
    try {
      await LocalNotifications.cancel({ notifications: [{ id: reminder.id }] });
      status.textContent = 'Daily reminder turned off.';
    } catch {
      status.textContent = 'Could not turn off the reminder. Try again.';
    } finally {
      lock(false);
    }
  });
}

if (native) LocalNotifications.addListener('localNotificationActionPerformed', async ({ notification }) => {
  if (!notification.extra?.quickGame || !window.dayQuestHome) return;
  await window.dayQuestHome.ready;
  if (!window.dayQuestHome.focusActive()) {
    window.dayQuestHome.navigate('ramen');
    document.querySelector('#village-nav button[data-shop="market"]').click();
    const panel = document.querySelector('.dayquest-quick-panel');
    panel.open = true;
    panel.scrollIntoView({ block: 'center' });
  }
}).catch(() => {});
