import { Channel } from 'shared/data';

/* CHANNEL LIST ACTIONS */
export function loadChannelList(context, payload) {
  const params = payload || {};
  if (payload && payload.listType) {
    params[payload.listType] = true;
  }
  return Channel.where(params).then(channels => {
    context.commit('ADD_CHANNELS', channels);
    return channels;
  });
}

export function loadChannel(context, id) {
  return Channel
    .get(id)
    .then(channel => {
      context.commit('ADD_CHANNEL', channel);
      return channel;
    })
    .catch(() => {
      return;
    });
}


/* CHANNEL EDITOR ACTIONS */

export function createChannel(context) {
  const session = context.rootState.session;
  const channelData = {
    name: '',
    description: '',
    language: session.preferences ? session.preferences.language : session.currentLanguage,
    content_defaults: session.preferences,
    thumbnail_url: '',
    bookmark: false,
    edit: true,
  };
  return Channel.put(channelData).then(id => {
    context.commit('ADD_CHANNEL', {
      id,
      ...channelData,
    });
    return id;
  });
}

export function updateChannel(context, channelData) {
  context.commit('UPDATE_CHANNEL', channelData );
  return Channel.update(channelData.id, channelData);
}

export function bookmarkChannel(context, payload) {
  return client
    .patch(window.Urls['channel-detail'](payload.id), { bookmark: payload.bookmark })
    .then(() => {
      context.commit('TOGGLE_BOOKMARK', payload.id);
    });
}

export function deleteChannel(context, channelId) {
  return Channel.update(channelId, { deleted: true }).then(() => {
    context.commit('REMOVE_CHANNEL', channelId);
  });
}
