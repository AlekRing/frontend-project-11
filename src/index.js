import app from './app';

(function start() {
  const state = {
    timeout: 5000,
    rssStreams: {
      readPosts: new Set(),
      feeds: [],
      posts: [],
    },
    links: [],
    isModalInitiated: false,
    formFeedback: {
      isSubmited: false,
      success: '',
      error: '',
    },
  };

  app(state);
}());
