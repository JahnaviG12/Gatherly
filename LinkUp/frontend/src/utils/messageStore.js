import localforage from 'localforage';

const store = localforage.createInstance({
  name: 'gatherly_messages',
  storeName: 'messages'
});

export async function saveMessages(workspaceId, messages) {
  try {
    await store.setItem(String(workspaceId), messages || []);
  } catch (e) {
    console.warn('Failed to persist messages to IndexedDB', e);
  }
}

export async function loadMessages(workspaceId) {
  try {
    const data = await store.getItem(String(workspaceId));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('Failed to load messages from IndexedDB', e);
    return [];
  }
}
