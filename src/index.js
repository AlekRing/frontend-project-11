import app from './app';

(function start() {
  const state = {
    timeoutId: null,
    timeout: 5000,
    streams: {
      readPosts: new Set(),
      rssStreams: {},
    },
    ui: {
      modalUI: {
        isInitiated: false,
        modal: document.getElementById('modal'),
      },
    },
    status: {
      success: '',
      error: '',
    },
  };

  app(state);
}());
