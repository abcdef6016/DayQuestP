export const cottageReminderId = 6641;

export function reminderTime(value) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [hour, minute] = value.split(':').map(Number);
  return { hour, minute, second: 0 };
}

export async function scheduleCottageReminder(plugin, value, { id, title, body, extra }) {
  const on = reminderTime(value);
  if (!on) throw new Error('Choose a valid reminder time.');
  let permission = await plugin.checkPermissions();
  if (permission.display !== 'granted') permission = await plugin.requestPermissions();
  if (permission.display !== 'granted') return false;
  await plugin.schedule({ notifications: [{
    id, title, body, ...(extra ? { extra } : {}), schedule: { on }
  }] });
  return true;
}
